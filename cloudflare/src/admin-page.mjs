export const adminPageHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Workforce Observatory Admin</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #071a33;
        --bg-soft: #102946;
        --card: rgba(255,255,255,0.06);
        --line: rgba(255,255,255,0.12);
        --text: #f4f8fc;
        --muted: #bfd0e2;
        --accent: #22c9ac;
        --accent-2: #f5b41b;
        --danger: #ff6d7c;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, Arial, sans-serif;
        background: linear-gradient(180deg, var(--bg), #12355b);
        color: var(--text);
      }
      a { color: inherit; }
      img { max-width: 100%; display: block; border-radius: 18px; }
      .shell { width: min(1320px, calc(100vw - 32px)); margin: 0 auto; }
      .hero { padding: 40px 0 20px; }
      .hero h1 { margin: 0 0 12px; font-size: clamp(2rem, 5vw, 3.6rem); }
      .hero p { margin: 0; max-width: 780px; color: var(--muted); }
      .layout {
        display: grid;
        gap: 24px;
        grid-template-columns: 340px minmax(0, 1.15fr) minmax(320px, 0.85fr);
        padding: 24px 0 48px;
      }
      .panel {
        border: 1px solid var(--line);
        background: var(--card);
        border-radius: 24px;
        padding: 24px;
        backdrop-filter: blur(12px);
      }
      .panel h2, .panel h3 { margin-top: 0; }
      .stack { display: grid; gap: 16px; }
      label { display: grid; gap: 8px; font-weight: 700; font-size: 0.94rem; }
      input, textarea, select, button { font: inherit; }
      input, textarea, select {
        width: 100%;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.04);
        color: var(--text);
        padding: 14px 16px;
      }
      textarea { min-height: 120px; resize: vertical; }
      .actions, .inline-actions { display: flex; flex-wrap: wrap; gap: 12px; }
      button {
        min-height: 46px;
        border: 0;
        border-radius: 999px;
        padding: 0 18px;
        cursor: pointer;
        font-weight: 800;
      }
      .primary { background: linear-gradient(135deg, var(--accent), #36dfc1); color: #062033; }
      .secondary { background: rgba(255,255,255,0.08); color: var(--text); border: 1px solid var(--line); }
      .danger { background: rgba(255,109,124,0.15); color: #ffdbe0; border: 1px solid rgba(255,109,124,0.28); }
      .meta { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .list { display: grid; gap: 12px; margin-top: 16px; }
      .list button { justify-content: flex-start; text-align: left; width: 100%; border-radius: 18px; padding: 16px; }
      .pill {
        display: inline-flex;
        min-height: 30px;
        align-items: center;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        color: var(--muted);
        font-size: 0.82rem;
      }
      .status {
        padding: 12px 14px;
        border-radius: 16px;
        background: rgba(255,255,255,0.04);
        color: var(--muted);
      }
      .status.error { background: rgba(255,109,124,0.15); color: #ffdbe0; }
      .hint, small, figcaption { color: var(--muted); }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 14px;
        background: rgba(0,0,0,0.18);
      }
      .hidden { display: none !important; }
      .preview-shell { display: grid; gap: 18px; }
      .preview-card, .preview-section, .media-chip {
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.04);
        border-radius: 20px;
        padding: 18px;
      }
      .preview-hero {
        background: linear-gradient(145deg, rgba(7,26,51,0.9), rgba(18,53,91,0.9));
      }
      .preview-section__meta,
      .media-list { display: grid; gap: 10px; }
      .preview-section__meta { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .media-list { margin-top: 12px; }
      .media-chip { padding: 12px; }
      .preview-columns { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .preview-animation {
        display: inline-flex;
        min-height: 30px;
        align-items: center;
        padding: 0 10px;
        border-radius: 999px;
        background: rgba(34,201,172,0.12);
        color: var(--accent);
        font-size: 0.8rem;
        font-weight: 700;
      }
      @media (max-width: 1180px) {
        .layout { grid-template-columns: 1fr; }
      }
      @media (max-width: 720px) {
        .meta, .preview-columns, .preview-section__meta { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header class="hero shell">
      <span class="pill">Cloudflare Workers + D1 + R2 admin</span>
      <h1>Workforce Observatory Admin</h1>
      <p>Register the first account as administrator, set article schedules, upload images, and preview structured article sections with animation metadata before sync.</p>
    </header>
    <main class="shell layout">
      <aside class="stack">
        <section class="panel stack">
          <div>
            <h2>Authentication</h2>
            <p class="hint">The first registered account becomes <strong>admin</strong>. Next accounts become <strong>editor</strong>.</p>
          </div>
          <form id="register-form" class="stack">
            <label>Display name <input name="displayName" required placeholder="Gabriel Croitoru"></label>
            <label>Email <input name="email" type="email" required placeholder="you@workforceobservatory.com"></label>
            <label>Password <input name="password" type="password" minlength="10" required placeholder="Minimum 10 characters"></label>
            <button class="primary" type="submit">Register</button>
          </form>
          <form id="login-form" class="stack">
            <label>Email <input name="email" type="email" required placeholder="you@workforceobservatory.com"></label>
            <label>Password <input name="password" type="password" required placeholder="Password"></label>
            <button class="secondary" type="submit">Sign in</button>
          </form>
          <div class="inline-actions">
            <button id="load-session" class="secondary" type="button">Refresh session</button>
            <button id="logout" class="danger hidden" type="button">Logout</button>
          </div>
          <div id="auth-status" class="status">Not signed in.</div>
        </section>
        <section class="panel stack">
          <div>
            <h3>Article records</h3>
            <p class="hint">Load a saved article into the editor or start a new one.</p>
          </div>
          <div class="actions">
            <button id="refresh-articles" class="secondary" type="button">Refresh list</button>
            <button id="new-article" class="primary" type="button">New article</button>
          </div>
          <div id="article-list" class="list"></div>
        </section>
        <section class="panel stack">
          <div>
            <h3>Media upload</h3>
            <p class="hint">Upload images to R2 and append them to a section in the current JSON model.</p>
          </div>
          <form id="media-form" class="stack">
            <label>Section key <input name="sectionKey" placeholder="executive-summary"></label>
            <label>Storage prefix <input name="prefix" value="articles"></label>
            <label>Alt text <input name="alt" placeholder="Architecture diagram"></label>
            <label>Caption <input name="caption" placeholder="Optional caption"></label>
            <label>Select image <input name="file" type="file" accept="image/*"></label>
            <button class="secondary" type="submit">Upload image</button>
          </form>
          <div id="upload-status" class="status">Upload requires an R2 binding.</div>
        </section>
      </aside>
      <section class="panel stack">
        <div>
          <h2>Article editor</h2>
          <p class="hint">Store article structure in D1 first, then sync scheduled content into the static publishing pipeline.</p>
        </div>
        <form id="article-form" class="stack">
          <input type="hidden" name="id">
          <div class="meta">
            <label>Title <input name="title" required placeholder="The Semantic Layer and Certified HR KPIs"></label>
            <label>Slug <input name="slug" required placeholder="semantic-layer-certified-hr-kpis"></label>
            <label>Status
              <select name="status">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label>Publish at (UTC) <input name="publishAt" type="datetime-local"></label>
            <label>Topic
              <select name="topicSlug" id="topic-select"></select>
            </label>
            <label>Reading minutes <input name="readingMinutes" type="number" min="1" max="120" value="12"></label>
          </div>
          <label>Summary
            <textarea name="summary" placeholder="Executive summary of the article."></textarea>
          </label>
          <div class="meta">
            <label>Carousel source <input name="carouselSource" placeholder="HR_DataMart_05_v2.pdf"></label>
            <label>Carousel hook <input name="carouselHook" placeholder="Executives lose confidence when KPI definitions travel with decks..."></label>
            <label>Social image URL <input name="socialImageUrl" placeholder="https://cdn.example.com/social/article.png"></label>
            <label>Executive takeaway <input name="executiveTakeaway" placeholder="Certified workforce KPIs depend on a semantic layer..."></label>
          </div>
          <label>Keywords (JSON array)
            <textarea name="keywordsJson">["people analytics","semantic layer"]</textarea>
          </label>
          <label>Related slugs (JSON array)
            <textarea name="relatedSlugsJson">["hr-datamart-reference-architecture"]</textarea>
          </label>
          <label>Sections (JSON array)
            <textarea name="sectionsJson">[
  {
    "sectionKey": "executive-summary",
    "sectionType": "summary",
    "title": "Executive summary",
    "eyebrow": "Executive summary",
    "body": "Explain the executive implication here.",
    "animationPreset": "fade-up",
    "layoutVariant": "standard",
    "media": [],
    "settings": {
      "expanded": true
    }
  },
  {
    "sectionKey": "interactive-visualization",
    "sectionType": "visualization",
    "title": "Interactive visualization",
    "eyebrow": "Interactive visualization",
    "body": "Show the scenario logic for this article.",
    "animationPreset": "diagram-flow",
    "layoutVariant": "immersive",
    "media": [],
    "settings": {
      "flow": ["Signal", "Context", "Interpretation", "Decision"],
      "scenarios": [
        {
          "label": "Baseline",
          "headline": "Current model",
          "description": "Describe the baseline operating model.",
          "metricLabel": "Confidence",
          "metricValue": "Medium",
          "insight": "Explain the trade-off.",
          "stages": ["Signal", "Context", "Decision"]
        }
      ]
    }
  }
]</textarea>
          </label>
          <div class="actions">
            <button class="primary" type="submit">Save article</button>
            <button id="delete-draft-values" class="secondary" type="button">Reset form</button>
          </div>
        </form>
        <section class="stack">
          <h3>Supported presets</h3>
          <div id="preset-meta" class="status">Load a session to view preset metadata.</div>
        </section>
        <section class="stack">
          <h3>Latest API response</h3>
          <pre id="response-log">No activity yet.</pre>
        </section>
      </section>
      <section class="panel stack">
        <div>
          <h2>Live preview</h2>
          <p class="hint">Preview the article shell, sections, animations, and uploaded images before saving.</p>
        </div>
        <div id="preview" class="preview-shell"></div>
      </section>
    </main>
    <script>
      const state = { user: null, meta: null, articles: [] };
      const authStatus = document.getElementById('auth-status');
      const uploadStatus = document.getElementById('upload-status');
      const articleList = document.getElementById('article-list');
      const responseLog = document.getElementById('response-log');
      const presetMeta = document.getElementById('preset-meta');
      const topicSelect = document.getElementById('topic-select');
      const articleForm = document.getElementById('article-form');
      const preview = document.getElementById('preview');
      const logoutButton = document.getElementById('logout');

      const escapeHtml = (value) => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      const log = (payload) => {
        responseLog.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
      };

      const setStatus = (text, error = false) => {
        authStatus.textContent = text;
        authStatus.classList.toggle('error', error);
      };

      const setUploadStatus = (text, error = false) => {
        uploadStatus.textContent = text;
        uploadStatus.classList.toggle('error', error);
      };

      const toUtcIso = (value) => value ? new Date(value).toISOString() : null;
      const fromUtcIso = (value) => {
        if (!value) return '';
        const date = new Date(value);
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
      };

      const readSections = () => {
        try {
          const parsed = JSON.parse(articleForm.elements.sectionsJson.value || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          return [];
        }
      };

      const writeSections = (sections) => {
        articleForm.elements.sectionsJson.value = JSON.stringify(sections, null, 2);
        renderPreview();
      };

      const jsonRequest = async (url, options = {}) => {
        const headers = { ...(options.headers || {}) };
        if (!(options.body instanceof FormData) && !headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
        const response = await fetch(url, {
          credentials: 'same-origin',
          ...options,
          headers
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Request failed');
        log(data);
        return data;
      };

      const renderMeta = () => {
        if (!state.meta) return;
        topicSelect.innerHTML = state.meta.topics.map(topic => '<option value="' + topic.slug + '">' + escapeHtml(topic.name) + '</option>').join('');
        presetMeta.innerHTML = '<strong>Animations</strong><br>' + state.meta.animationPresets.map(escapeHtml).join(', ')
          + '<br><br><strong>Section types</strong><br>' + state.meta.sectionTypes.map(escapeHtml).join(', ')
          + '<br><br><strong>Layouts</strong><br>' + state.meta.layoutVariants.map(escapeHtml).join(', ');
        setUploadStatus(state.meta.uploadEnabled ? 'R2 upload is enabled.' : 'Upload requires an R2 binding.', !state.meta.uploadEnabled);
      };

      const renderArticles = () => {
        articleList.innerHTML = '';
        if (!state.articles.length) {
          articleList.innerHTML = '<div class="status">No article records yet.</div>';
          return;
        }
        state.articles.forEach(article => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'secondary';
          button.innerHTML = '<strong>' + escapeHtml(article.title) + '</strong><br><small>' + escapeHtml(article.status) + ' · ' + escapeHtml(article.topicName) + ' · ' + escapeHtml(article.publishAt || 'No schedule') + '</small>';
          button.addEventListener('click', async () => {
            const data = await jsonRequest('/api/admin/articles/' + article.id);
            loadArticle(data.article);
          });
          articleList.appendChild(button);
        });
      };

      const renderPreview = () => {
        const sections = readSections();
        const title = articleForm.elements.title.value || 'Untitled article';
        const summary = articleForm.elements.summary.value || 'Executive summary will appear here.';
        const topicName = state.meta?.topics.find(topic => topic.slug === articleForm.elements.topicSlug.value)?.name || articleForm.elements.topicSlug.value || 'Topic';
        const publishAt = articleForm.elements.publishAt.value ? new Date(articleForm.elements.publishAt.value).toISOString() : 'No schedule yet';
        const sectionCards = sections.map((section, index) => {
          const mediaCards = Array.isArray(section.media) ? section.media.map(item => '<div class="media-chip"><strong>' + escapeHtml(item.alt || 'Image') + '</strong><br><small>' + escapeHtml(item.url || '') + '</small>' + (item.caption ? '<br><small>' + escapeHtml(item.caption) + '</small>' : '') + '</div>').join('') : '';
          return '<article class="preview-section">'
            + '<div class="preview-columns"><div><span class="preview-animation">' + escapeHtml(section.animationPreset || 'fade-up') + '</span><h3>' + escapeHtml(section.title || ('Section ' + (index + 1))) + '</h3><p>' + escapeHtml(section.body || '') + '</p></div>'
            + '<div class="preview-section__meta"><div><strong>Type</strong><br><small>' + escapeHtml(section.sectionType || 'narrative') + '</small></div><div><strong>Layout</strong><br><small>' + escapeHtml(section.layoutVariant || 'standard') + '</small></div></div></div>'
            + (mediaCards ? '<div class="media-list">' + mediaCards + '</div>' : '')
            + '</article>';
        }).join('');
        preview.innerHTML = '<section class="preview-card preview-hero"><span class="pill">' + escapeHtml(topicName) + '</span><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(summary) + '</p><div class="preview-columns"><div><strong>Status</strong><br><small>' + escapeHtml(articleForm.elements.status.value) + '</small></div><div><strong>Publish at</strong><br><small>' + escapeHtml(publishAt) + '</small></div></div></section>'
          + '<section class="preview-card"><h3>Carousel bridge</h3><p>' + escapeHtml(articleForm.elements.carouselHook.value || 'Carousel hook preview will appear here.') + '</p></section>'
          + (sectionCards || '<section class="preview-card"><p>Add sections to preview the article composition.</p></section>');
      };

      const loadArticle = (article) => {
        articleForm.elements.id.value = article.id || '';
        articleForm.elements.title.value = article.title || '';
        articleForm.elements.slug.value = article.slug || '';
        articleForm.elements.status.value = article.status || 'draft';
        articleForm.elements.publishAt.value = fromUtcIso(article.publishAt);
        articleForm.elements.topicSlug.value = article.topicSlug || '';
        articleForm.elements.readingMinutes.value = article.readingMinutes || 12;
        articleForm.elements.summary.value = article.summary || '';
        articleForm.elements.carouselSource.value = article.carouselSource || '';
        articleForm.elements.carouselHook.value = article.carouselHook || '';
        articleForm.elements.socialImageUrl.value = article.socialImageUrl || '';
        articleForm.elements.executiveTakeaway.value = article.executiveTakeaway || '';
        articleForm.elements.keywordsJson.value = JSON.stringify(article.keywords || [], null, 2);
        articleForm.elements.relatedSlugsJson.value = JSON.stringify(article.relatedSlugs || [], null, 2);
        articleForm.elements.sectionsJson.value = JSON.stringify(article.sections || [], null, 2);
        renderPreview();
      };

      const resetForm = () => {
        articleForm.reset();
        articleForm.elements.id.value = '';
        articleForm.elements.keywordsJson.value = '["people analytics","semantic layer"]';
        articleForm.elements.relatedSlugsJson.value = '["hr-datamart-reference-architecture"]';
        articleForm.elements.sectionsJson.value = JSON.stringify([
          {
            sectionKey: 'executive-summary',
            sectionType: 'summary',
            title: 'Executive summary',
            eyebrow: 'Executive summary',
            body: 'Explain the executive implication here.',
            animationPreset: 'fade-up',
            layoutVariant: 'standard',
            media: [],
            settings: { expanded: true }
          },
          {
            sectionKey: 'interactive-visualization',
            sectionType: 'visualization',
            title: 'Interactive visualization',
            eyebrow: 'Interactive visualization',
            body: 'Show the scenario logic for this article.',
            animationPreset: 'diagram-flow',
            layoutVariant: 'immersive',
            media: [],
            settings: {
              flow: ['Signal', 'Context', 'Interpretation', 'Decision'],
              scenarios: [
                {
                  label: 'Baseline',
                  headline: 'Current model',
                  description: 'Describe the baseline operating model.',
                  metricLabel: 'Confidence',
                  metricValue: 'Medium',
                  insight: 'Explain the trade-off.',
                  stages: ['Signal', 'Context', 'Decision']
                }
              ]
            }
          }
        ], null, 2);
        renderPreview();
      };

      const refreshMeta = async () => {
        const data = await jsonRequest('/api/admin/meta');
        state.meta = data;
        renderMeta();
        renderPreview();
      };

      const refreshArticles = async () => {
        const data = await jsonRequest('/api/admin/articles');
        state.articles = data.articles || [];
        renderArticles();
      };

      const refreshSession = async () => {
        try {
          const data = await jsonRequest('/api/auth/session');
          state.user = data.user || null;
          if (state.user) {
            setStatus('Signed in as ' + state.user.displayName + ' (' + state.user.role + ').');
            logoutButton.classList.remove('hidden');
            await refreshMeta();
            await refreshArticles();
          } else {
            setStatus('Not signed in.');
            logoutButton.classList.add('hidden');
          }
        } catch (error) {
          setStatus(error.message, true);
        }
      };

      document.getElementById('register-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
          await jsonRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              displayName: form.get('displayName'),
              email: form.get('email'),
              password: form.get('password')
            })
          });
          await refreshSession();
        } catch (error) {
          setStatus(error.message, true);
        }
      });

      document.getElementById('login-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
          await jsonRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: form.get('email'),
              password: form.get('password')
            })
          });
          await refreshSession();
        } catch (error) {
          setStatus(error.message, true);
        }
      });

      document.getElementById('logout').addEventListener('click', async () => {
        await jsonRequest('/api/auth/logout', { method: 'POST', body: '{}' });
        state.user = null;
        state.articles = [];
        renderArticles();
        setStatus('Signed out.');
        logoutButton.classList.add('hidden');
      });

      document.getElementById('media-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
          const data = await jsonRequest('/api/admin/media', {
            method: 'POST',
            body: form
          });
          const sections = readSections();
          const sectionKey = String(form.get('sectionKey') || '').trim();
          const target = sections.find(section => section.sectionKey === sectionKey);
          if (target) {
            target.media = Array.isArray(target.media) ? target.media : [];
            target.media.push(data.media);
            writeSections(sections);
          }
          setUploadStatus('Upload complete.');
        } catch (error) {
          setUploadStatus(error.message, true);
          log({ error: error.message });
        }
      });

      document.getElementById('load-session').addEventListener('click', refreshSession);
      document.getElementById('refresh-articles').addEventListener('click', refreshArticles);
      document.getElementById('new-article').addEventListener('click', resetForm);
      document.getElementById('delete-draft-values').addEventListener('click', resetForm);

      articleForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget.elements;
        const payload = {
          title: form.title.value,
          slug: form.slug.value,
          status: form.status.value,
          publishAt: toUtcIso(form.publishAt.value),
          topicSlug: form.topicSlug.value,
          readingMinutes: Number(form.readingMinutes.value),
          summary: form.summary.value,
          carouselSource: form.carouselSource.value,
          carouselHook: form.carouselHook.value,
          socialImageUrl: form.socialImageUrl.value,
          executiveTakeaway: form.executiveTakeaway.value,
          keywords: JSON.parse(form.keywordsJson.value || '[]'),
          relatedSlugs: JSON.parse(form.relatedSlugsJson.value || '[]'),
          sections: JSON.parse(form.sectionsJson.value || '[]')
        };
        try {
          const id = form.id.value;
          const url = id ? '/api/admin/articles/' + id : '/api/admin/articles';
          const method = id ? 'PUT' : 'POST';
          const data = await jsonRequest(url, { method, body: JSON.stringify(payload) });
          loadArticle(data.article);
          await refreshArticles();
        } catch (error) {
          log({ error: error.message });
        }
      });

      articleForm.addEventListener('input', renderPreview);
      articleForm.addEventListener('change', renderPreview);

      resetForm();
      refreshSession();
    </script>
  </body>
</html>`;
