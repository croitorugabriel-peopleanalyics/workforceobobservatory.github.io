import { adminPageHtml } from "./admin-page.mjs";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const animationPresets = [
  "fade-up",
  "fade-in",
  "slide-left",
  "slide-right",
  "parallax-soft",
  "timeline-reveal",
  "diagram-flow",
  "comparison-flip",
  "kpi-pulse",
  "sticky-stepper",
];

const sectionTypes = [
  "hero",
  "summary",
  "narrative",
  "visualization",
  "questions",
  "mistakes",
  "guidance",
  "gallery",
  "quote",
  "cta",
];

const layoutVariants = ["standard", "split", "stacked", "immersive", "gallery", "timeline"];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), request, env);
      }

      if (url.pathname === "/" || url.pathname === "/api") {
        return withCors(json({
          service: "workforce-observatory-admin-api",
          status: "ok",
          routes: [
            "GET /admin",
            "GET /api/health",
            "POST /api/auth/register",
            "POST /api/auth/login",
            "POST /api/auth/logout",
            "GET /api/auth/session",
            "GET /api/admin/meta",
            "GET /api/admin/articles",
            "GET /api/admin/articles/:id",
            "POST /api/admin/articles",
            "PUT /api/admin/articles/:id",
            "GET /api/public/articles",
          ],
        }), request, env);
      }

      if (url.pathname === "/admin" || url.pathname === "/admin/") {
        return withCors(html(adminPageHtml), request, env);
      }

      if (url.pathname === "/api/health") {
        return withCors(json({ ok: true, now: nowIso() }), request, env);
      }

      if (url.pathname === "/api/auth/register" && request.method === "POST") {
        const body = await readJson(request);
        const user = await registerUser(env, request, body);
        return withCors(await withSession(json({ ok: true, user }), env, request, user.id), request, env);
      }

      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        const body = await readJson(request);
        const user = await loginUser(env, request, body);
        return withCors(await withSession(json({ ok: true, user }), env, request, user.id), request, env);
      }

      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        const session = await getSession(env, request);
        if (session) {
          await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(session.sessionId).run();
        }
        return withCors(clearSession(json({ ok: true }), request), request, env);
      }

      if (url.pathname === "/api/auth/session" && request.method === "GET") {
        const session = await getSession(env, request);
        return withCors(json({ user: session?.user ?? null }), request, env);
      }

      if (url.pathname === "/api/public/articles" && request.method === "GET") {
        const articles = await listPublicArticles(env);
        return withCors(json({ articles }), request, env);
      }

      if (url.pathname === "/api/admin/meta" && request.method === "GET") {
        await requireEditor(env, request);
        return withCors(json({
          topics: await fetchTopics(env),
          animationPresets,
          sectionTypes,
          layoutVariants,
        }), request, env);
      }

      if (url.pathname === "/api/admin/articles" && request.method === "GET") {
        await requireEditor(env, request);
        return withCors(json({ articles: await listArticles(env) }), request, env);
      }

      if (url.pathname === "/api/admin/articles" && request.method === "POST") {
        const actor = await requireEditor(env, request);
        const body = await readJson(request);
        const article = await saveArticle(env, actor, null, body);
        return withCors(json({ ok: true, article }), request, env);
      }

      const articleMatch = url.pathname.match(/^\/api\/admin\/articles\/(\d+)$/);
      if (articleMatch && request.method === "GET") {
        await requireEditor(env, request);
        const article = await getArticleById(env, Number(articleMatch[1]));
        if (!article) return withCors(json({ error: "Article not found" }, 404), request, env);
        return withCors(json({ article }), request, env);
      }

      if (articleMatch && request.method === "PUT") {
        const actor = await requireEditor(env, request);
        const body = await readJson(request);
        const article = await saveArticle(env, actor, Number(articleMatch[1]), body);
        return withCors(json({ ok: true, article }), request, env);
      }

      return withCors(json({ error: "Not found" }, 404), request, env);
    } catch (error) {
      return withCors(json({ error: error.message || "Unexpected error" }, error.status || 500), request, env);
    }
  },
};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: jsonHeaders,
  });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  const origin = request.headers.get("origin");
  if (origin && env.APP_ORIGIN && origin === env.APP_ORIGIN) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
  }
  headers.set("access-control-allow-credentials", "true");
  headers.set("access-control-allow-headers", "content-type");
  headers.set("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
  return new Response(response.body, { status: response.status, headers });
}

async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw httpError(415, "Use application/json.");
  }
  return await request.json();
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanString(value, max = 1000) {
  return String(value || "").trim().slice(0, max);
}

function cleanSlug(value) {
  return cleanString(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCookie(request, name) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(name + "="));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function sessionDays(env) {
  const days = Number(env.SESSION_DAYS || 14);
  return Number.isFinite(days) && days > 0 ? days : 14;
}

function secureCookie(request) {
  return new URL(request.url).hostname !== "127.0.0.1" && new URL(request.url).hostname !== "localhost";
}

function setCookie(headers, name, value, request, maxAgeSeconds) {
  const segments = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secureCookie(request)) segments.push("Secure");
  headers.append("set-cookie", segments.join("; "));
}

function clearSession(response, request) {
  const headers = new Headers(response.headers);
  const segments = ["wo_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"];
  if (secureCookie(request)) segments.push("Secure");
  headers.append("set-cookie", segments.join("; "));
  return new Response(response.body, { status: response.status, headers });
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

function base64FromBytes(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function bytesFromBase64(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function randomToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return base64FromBytes(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function derivePassword(password, saltBase64, iterations, pepper = "") {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password + pepper),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations,
      salt: bytesFromBase64(saltBase64),
    },
    keyMaterial,
    256,
  );
  return base64FromBytes(new Uint8Array(bits));
}

async function createPasswordHash(password, env) {
  const iterations = 310000;
  const salt = base64FromBytes(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await derivePassword(password, salt, iterations, env.AUTH_PEPPER || "");
  return { iterations, salt, hash };
}

async function verifyPassword(password, user, env) {
  const hash = await derivePassword(password, user.password_salt, user.password_iterations, env.AUTH_PEPPER || "");
  return timingSafeEqual(hash, user.password_hash);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

async function registerUser(env, request, body) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const displayName = cleanString(body.displayName || body.name, 120);
  if (!email || !email.includes("@")) throw httpError(400, "A valid email is required.");
  if (password.length < 10) throw httpError(400, "Password must be at least 10 characters.");
  if (!displayName) throw httpError(400, "Display name is required.");
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) throw httpError(409, "An account with this email already exists.");

  const { hash, salt, iterations } = await createPasswordHash(password, env);
  const now = nowIso();
  const countRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first();
  const isFirstUser = Number(countRow?.count || 0) === 0;
  const role = isFirstUser ? "admin" : "editor";

  const result = await env.DB.prepare(
    `INSERT INTO users (email, display_name, password_hash, password_salt, password_iterations, role, created_at, updated_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(email, displayName, hash, salt, iterations, role, now, now, now).run();

  const user = {
    id: Number(result.meta.last_row_id),
    email,
    displayName,
    role,
  };
  await writeAudit(env, user.id, "auth.register", "user", String(user.id), { email, role });
  return user;
}

async function loginUser(env, request, body) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (!user || !(await verifyPassword(password, user, env))) {
    throw httpError(401, "Invalid email or password.");
  }
  const now = nowIso();
  await env.DB.prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?").bind(now, now, user.id).run();
  await writeAudit(env, user.id, "auth.login", "user", String(user.id), { email });
  return publicUser(user);
}

async function withSession(response, env, request, userId) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const sessionId = crypto.randomUUID();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + sessionDays(env) * 86400 * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    userId,
    tokenHash,
    expiresAt,
    createdAt,
    createdAt,
    cleanString(request.headers.get("cf-connecting-ip"), 64),
    cleanString(request.headers.get("user-agent"), 255),
  ).run();
  const headers = new Headers(response.headers);
  setCookie(headers, "wo_session", token, request, sessionDays(env) * 86400);
  return new Response(response.body, { status: response.status, headers });
}

async function getSession(env, request) {
  const token = parseCookie(request, "wo_session");
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT s.id AS session_id, s.user_id, s.expires_at, u.id, u.email, u.display_name, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?`
  ).bind(tokenHash).first();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(row.session_id).run();
    return null;
  }
  await env.DB.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?").bind(nowIso(), row.session_id).run();
  return {
    sessionId: row.session_id,
    user: {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
    },
  };
}

async function requireEditor(env, request) {
  const session = await getSession(env, request);
  if (!session) throw httpError(401, "Sign in first.");
  if (!["admin", "editor"].includes(session.user.role)) throw httpError(403, "Insufficient permissions.");
  return session.user;
}

async function fetchTopics(env) {
  const result = await env.DB.prepare("SELECT id, slug, name, summary FROM topics ORDER BY name").all();
  return result.results || [];
}

async function listArticles(env) {
  const result = await env.DB.prepare(
    `SELECT a.id, a.slug, a.title, a.status, a.publish_at, a.reading_minutes, t.name AS topic_name
     FROM articles a
     JOIN topics t ON t.id = a.topic_id
     ORDER BY COALESCE(a.publish_at, a.updated_at) DESC, a.id DESC`
  ).all();
  return (result.results || []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    publishAt: row.publish_at,
    readingMinutes: row.reading_minutes,
    topicName: row.topic_name,
  }));
}

async function getArticleById(env, articleId) {
  const article = await env.DB.prepare(
    `SELECT a.*, t.slug AS topic_slug, t.name AS topic_name, u.display_name AS author_name
     FROM articles a
     JOIN topics t ON t.id = a.topic_id
     LEFT JOIN users u ON u.id = a.author_user_id
     WHERE a.id = ?`
  ).bind(articleId).first();
  if (!article) return null;
  const sectionsResult = await env.DB.prepare(
    `SELECT sort_order, section_key, section_type, title, eyebrow, body, animation_preset, layout_variant, media_json, settings_json
     FROM article_sections
     WHERE article_id = ?
     ORDER BY sort_order ASC, id ASC`
  ).bind(articleId).all();
  return hydrateArticle(article, sectionsResult.results || []);
}

async function listPublicArticles(env) {
  const now = nowIso();
  const result = await env.DB.prepare(
    `SELECT a.id
     FROM articles a
     WHERE a.status = 'published'
        OR (a.status = 'scheduled' AND a.publish_at IS NOT NULL AND a.publish_at <= ?)
     ORDER BY COALESCE(a.publish_at, a.updated_at) DESC`
  ).bind(now).all();
  const items = [];
  for (const row of result.results || []) {
    const article = await getArticleById(env, row.id);
    if (article) items.push(article);
  }
  return items;
}

async function saveArticle(env, actor, articleId, body) {
  const isUpdate = Number.isInteger(articleId);
  const payload = normalizeArticlePayload(body);
  const topic = await env.DB.prepare("SELECT id FROM topics WHERE slug = ?").bind(payload.topicSlug).first();
  if (!topic) throw httpError(400, "Unknown topic slug.");

  const now = nowIso();
  if (articleId) {
    const existing = await env.DB.prepare("SELECT id FROM articles WHERE id = ?").bind(articleId).first();
    if (!existing) throw httpError(404, "Article not found.");
    await env.DB.prepare(
      `UPDATE articles
       SET slug = ?, title = ?, summary = ?, topic_id = ?, author_user_id = ?, status = ?, publish_at = ?, reading_minutes = ?,
           social_image_url = ?, carousel_source = ?, carousel_hook = ?, executive_takeaway = ?, keywords_json = ?, related_slugs_json = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      payload.slug,
      payload.title,
      payload.summary,
      topic.id,
      actor.id,
      payload.status,
      payload.publishAt,
      payload.readingMinutes,
      payload.socialImageUrl,
      payload.carouselSource,
      payload.carouselHook,
      payload.executiveTakeaway,
      JSON.stringify(payload.keywords),
      JSON.stringify(payload.relatedSlugs),
      now,
      articleId,
    ).run();
    await env.DB.prepare("DELETE FROM article_sections WHERE article_id = ?").bind(articleId).run();
  } else {
    const result = await env.DB.prepare(
      `INSERT INTO articles
       (slug, title, summary, topic_id, author_user_id, status, publish_at, reading_minutes, social_image_url, carousel_source, carousel_hook, executive_takeaway, keywords_json, related_slugs_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      payload.slug,
      payload.title,
      payload.summary,
      topic.id,
      actor.id,
      payload.status,
      payload.publishAt,
      payload.readingMinutes,
      payload.socialImageUrl,
      payload.carouselSource,
      payload.carouselHook,
      payload.executiveTakeaway,
      JSON.stringify(payload.keywords),
      JSON.stringify(payload.relatedSlugs),
      now,
      now,
    ).run();
    articleId = Number(result.meta.last_row_id);
  }

  const sectionStatements = payload.sections.map((section, index) =>
    env.DB.prepare(
      `INSERT INTO article_sections
       (article_id, sort_order, section_key, section_type, title, eyebrow, body, animation_preset, layout_variant, media_json, settings_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      articleId,
      index + 1,
      section.sectionKey,
      section.sectionType,
      section.title,
      section.eyebrow,
      section.body,
      section.animationPreset,
      section.layoutVariant,
      JSON.stringify(section.media),
      JSON.stringify(section.settings),
      now,
      now,
    )
  );
  if (sectionStatements.length) await env.DB.batch(sectionStatements);
  await writeAudit(env, actor.id, isUpdate ? "article.save" : "article.create", "article", String(articleId), {
    slug: payload.slug,
    status: payload.status,
    sectionCount: payload.sections.length,
  });
  return await getArticleById(env, articleId);
}

function normalizeArticlePayload(body) {
  const title = cleanString(body.title, 180);
  const slug = cleanSlug(body.slug);
  const status = cleanString(body.status, 20);
  const topicSlug = cleanSlug(body.topicSlug);
  const publishAt = body.publishAt ? new Date(body.publishAt).toISOString() : null;
  const readingMinutes = Math.max(1, Math.min(120, Number(body.readingMinutes || 10)));
  const keywords = expectStringArray(body.keywords, "keywords");
  const relatedSlugs = expectStringArray(body.relatedSlugs, "relatedSlugs").map(cleanSlug).filter(Boolean);
  const sections = normalizeSections(body.sections);

  if (!title) throw httpError(400, "Article title is required.");
  if (!slug) throw httpError(400, "Article slug is required.");
  if (!["draft", "scheduled", "published"].includes(status)) throw httpError(400, "Invalid article status.");
  if (!topicSlug) throw httpError(400, "Topic slug is required.");
  if ((status === "scheduled" || status === "published") && !publishAt) {
    throw httpError(400, "Scheduled or published articles require publishAt.");
  }

  return {
    title,
    slug,
    status,
    topicSlug,
    publishAt,
    readingMinutes,
    summary: cleanString(body.summary, 5000),
    carouselSource: cleanString(body.carouselSource, 255),
    carouselHook: cleanString(body.carouselHook, 500),
    socialImageUrl: cleanString(body.socialImageUrl, 500),
    executiveTakeaway: cleanString(body.executiveTakeaway, 1000),
    keywords,
    relatedSlugs,
    sections,
  };
}

function normalizeSections(input) {
  if (!Array.isArray(input) || !input.length) throw httpError(400, "At least one section is required.");
  return input.map((section, index) => {
    const sectionType = cleanString(section.sectionType, 40);
    const animationPreset = cleanString(section.animationPreset || "fade-up", 40);
    const layoutVariant = cleanString(section.layoutVariant || "standard", 40);
    if (!sectionTypes.includes(sectionType)) throw httpError(400, `Unsupported section type at index ${index}.`);
    if (!animationPresets.includes(animationPreset)) throw httpError(400, `Unsupported animation preset at index ${index}.`);
    if (!layoutVariants.includes(layoutVariant)) throw httpError(400, `Unsupported layout variant at index ${index}.`);
    const media = Array.isArray(section.media) ? section.media.map((item) => ({
      url: cleanString(item.url, 500),
      alt: cleanString(item.alt, 255),
      caption: cleanString(item.caption, 255),
    })).filter((item) => item.url) : [];
    return {
      sectionKey: cleanSlug(section.sectionKey || `section-${index + 1}`),
      sectionType,
      title: cleanString(section.title, 180),
      eyebrow: cleanString(section.eyebrow, 120),
      body: cleanString(section.body, 10000),
      animationPreset,
      layoutVariant,
      media,
      settings: isPlainObject(section.settings) ? section.settings : {},
    };
  });
}

function hydrateArticle(article, sections) {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    topicSlug: article.topic_slug,
    topicName: article.topic_name,
    authorName: article.author_name,
    status: article.status,
    publishAt: article.publish_at,
    readingMinutes: article.reading_minutes,
    socialImageUrl: article.social_image_url,
    carouselSource: article.carousel_source,
    carouselHook: article.carousel_hook,
    executiveTakeaway: article.executive_takeaway,
    keywords: parseJson(article.keywords_json, []),
    relatedSlugs: parseJson(article.related_slugs_json, []),
    sections: sections.map((section) => ({
      sectionKey: section.section_key,
      sectionType: section.section_type,
      title: section.title,
      eyebrow: section.eyebrow,
      body: section.body,
      animationPreset: section.animation_preset,
      layoutVariant: section.layout_variant,
      media: parseJson(section.media_json, []),
      settings: parseJson(section.settings_json, {}),
    })),
  };
}

function expectStringArray(value, field) {
  if (!Array.isArray(value)) throw httpError(400, `${field} must be an array.`);
  return value.map((item) => cleanString(item, 160)).filter(Boolean);
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function writeAudit(env, userId, action, entityType, entityId, payload) {
  await env.DB.prepare(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(userId || null, action, entityType, entityId || null, JSON.stringify(payload || {}), nowIso()).run();
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
