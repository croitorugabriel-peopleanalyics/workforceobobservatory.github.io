from __future__ import annotations

from datetime import datetime
from html import escape
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import json
import os

ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "content" / "generated"

TOPIC_ACCENTS = {
    "hr-datamart": "#f5b41b",
    "people-analytics": "#16a6b6",
    "workforce-health-score": "#7c52d9",
    "workforce-planning": "#d96b2b",
    "talent-intelligence": "#4e9f6d",
    "responsible-ai": "#19a6a6",
    "hr-data-governance": "#f1a800",
    "organizational-health": "#7252d3",
    "analytics-engineering": "#e24f59",
    "microsoft-fabric-for-hr": "#2b7fff",
}


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def clean(value: str | None, *, fallback: str = "", max_length: int = 5000) -> str:
    return " ".join(str(value or fallback).split())[:max_length]


def slugify(value: str | None, fallback: str = "section") -> str:
    text = "".join(char.lower() if char.isalnum() else "-" for char in clean(value, fallback=fallback, max_length=120))
    while "--" in text:
        text = text.replace("--", "-")
    return text.strip("-") or fallback


def read_source() -> dict:
    fixture = os.getenv("BACKEND_EXPORT_FILE")
    if fixture:
        return json.loads(Path(fixture).read_text())
    origin = os.getenv("BACKEND_ORIGIN", "").rstrip("/")
    token = os.getenv("BACKEND_SYNC_TOKEN", "")
    if not origin or not token:
        raise SystemExit("Set BACKEND_ORIGIN and BACKEND_SYNC_TOKEN, or BACKEND_EXPORT_FILE.")
    request = Request(
        f"{origin}/api/admin/export",
        headers={"x-sync-token": token, "accept": "application/json"},
    )
    try:
        with urlopen(request) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise SystemExit(f"Backend export failed with HTTP {error.code}") from error
    except URLError as error:
        raise SystemExit(f"Backend export request failed: {error.reason}") from error


def split_items(section: dict) -> list[str]:
    settings = section.get("settings") or {}
    items = settings.get("items")
    if isinstance(items, list):
        return [clean(item, max_length=300) for item in items if clean(item, max_length=300)]
    body = str(section.get("body") or "")
    results = []
    for raw in body.splitlines():
        item = raw.strip().lstrip("-•").strip()
        if item:
            results.append(clean(item, max_length=300))
    return results


def media_markup(media_items: list[dict]) -> str:
    if not media_items:
        return ""
    figures = []
    for item in media_items:
        url = clean(item.get("url"), max_length=500)
        alt = escape(clean(item.get("alt"), max_length=255))
        caption = clean(item.get("caption"), max_length=255)
        if not url:
            continue
        figure = [
            '<figure class="content-box media-block">',
            f'<img src="{escape(url)}" alt="{alt}" loading="lazy">',
        ]
        if caption:
            figure.append(f"<figcaption>{escape(caption)}</figcaption>")
        figure.append("</figure>")
        figures.append("".join(figure))
    return f'<div class="media-grid">{"".join(figures)}</div>' if figures else ""


def body_paragraphs(text: str) -> str:
    paragraphs = [segment.strip() for segment in text.split("\n") if segment.strip()]
    return "".join(f"<p>{escape(clean(paragraph, max_length=5000))}</p>" for paragraph in paragraphs)


def narrative_markup(section: dict, index: int) -> str:
    section_key = slugify(section.get("sectionKey") or section.get("title") or f"section-{index}")
    eyebrow = clean(section.get("eyebrow"), fallback=f"{index:02d} · Deep dive", max_length=120)
    title = clean(section.get("title"), fallback=f"Section {index}", max_length=180)
    body = body_paragraphs(str(section.get("body") or ""))
    settings = section.get("settings") or {}
    callout = clean(settings.get("calloutText"), max_length=1000)
    callout_html = f'<div class="content-box"><b class="ey">Apply it</b><p>{escape(callout)}</p></div>' if callout else ""
    media = media_markup(section.get("media") or [])
    return (
        f'<section class="article-section reveal" id="{section_key}">'
        f'<div class="ey">{escape(eyebrow)}</div>'
        f'<h2>{escape(title)}</h2>'
        f"{body}"
        f"{callout_html}"
        f"{media}"
        "</section>"
    )


def quote_markup(section: dict, index: int) -> str:
    section_key = slugify(section.get("sectionKey") or f"quote-{index}")
    title = clean(section.get("title"), fallback="Key quotation", max_length=180)
    body = clean(section.get("body"), max_length=1500)
    return (
        f'<section class="article-section reveal" id="{section_key}">'
        f'<h2>{escape(title)}</h2>'
        f'<div class="content-box quote-block"><p>“{escape(body)}”</p></div>'
        "</section>"
    )


def gallery_markup(section: dict, index: int) -> str:
    section_key = slugify(section.get("sectionKey") or f"gallery-{index}")
    title = clean(section.get("title"), fallback="Visual gallery", max_length=180)
    body = body_paragraphs(str(section.get("body") or ""))
    media = media_markup(section.get("media") or [])
    return (
        f'<section class="article-section reveal" id="{section_key}">'
        f'<h2>{escape(title)}</h2>'
        f"{body}"
        f"{media}"
        "</section>"
    )


def sections_to_body(article: dict) -> str:
    sections = article.get("sections") or []
    intro_section = next((section for section in sections if clean(section.get("body"))), None)
    intro = clean((intro_section or {}).get("body"), fallback=article.get("summary"), max_length=1200)
    body = [f'<p class="article-intro">{escape(intro)}</p>']
    content_sections = [
        section for section in sections
        if section.get("sectionType") not in {"summary", "questions", "mistakes", "guidance", "visualization"}
    ]
    for index, section in enumerate(content_sections, start=1):
        section_type = section.get("sectionType")
        if section_type == "quote":
            body.append(quote_markup(section, index))
        elif section_type == "gallery":
            body.append(gallery_markup(section, index))
        else:
            body.append(narrative_markup(section, index))
    body.append(
        '<section class="article-section reveal interactive-lab" id="lab">'
        '<div class="ey">Interactive explainer</div>'
        '<h2>Explore the operating logic</h2>'
        '<p>Use the scenario switcher above and the flow map below to inspect how the article logic changes when the operating model matures. No employee data is used.</p>'
        '<div class="stage"></div>'
        "</section>"
    )
    body.append(
        '<section class="article-section reveal">'
        '<h2>Decision takeaway</h2>'
        f'<div class="content-box"><p>{escape(clean(article.get("executiveTakeaway"), fallback=article.get("summary"), max_length=1000))}</p></div>'
        "</section>"
    )
    return "".join(body)


def build_visualization(article: dict, flow: list[str]) -> dict:
    section = next((section for section in article.get("sections") or [] if section.get("sectionType") == "visualization"), None)
    settings = (section or {}).get("settings") or {}
    scenarios = settings.get("scenarios")
    if not isinstance(scenarios, list) or not scenarios:
        scenarios = [
            {
                "label": "Current operating model",
                "headline": clean((section or {}).get("title"), fallback=article["title"], max_length=180),
                "description": clean((section or {}).get("body"), fallback=article.get("summary"), max_length=400),
                "metricLabel": "Readiness",
                "metricValue": "Configured",
                "insight": clean(article.get("executiveTakeaway"), fallback=article.get("summary"), max_length=400),
                "stages": flow[:4] or ["Signal", "Context", "Decision", "Action"],
            }
        ]
    normalized = []
    for item in scenarios:
        normalized.append({
            "label": clean(item.get("label"), fallback="Scenario", max_length=80),
            "headline": clean(item.get("headline"), fallback=article["title"], max_length=180),
            "description": clean(item.get("description"), fallback=article.get("summary"), max_length=400),
            "metricLabel": clean(item.get("metricLabel"), fallback="Signal", max_length=80),
            "metricValue": clean(item.get("metricValue"), fallback="Configured", max_length=80),
            "insight": clean(item.get("insight"), fallback=article.get("executiveTakeaway"), max_length=400),
            "stages": [clean(stage, max_length=60) for stage in (item.get("stages") or flow[:4] or ["Signal", "Context", "Decision", "Action"]) if clean(stage, max_length=60)],
        })
    return {
        "title": clean((section or {}).get("title"), fallback="Interactive visualization", max_length=180),
        "intro": clean((section or {}).get("body"), fallback=article.get("summary"), max_length=400),
        "scenarios": normalized,
    }


def before_after(article: dict) -> dict:
    for section in article.get("sections") or []:
        settings = section.get("settings") or {}
        before = clean(settings.get("before"), max_length=400)
        after = clean(settings.get("after"), max_length=400)
        if before and after:
            return {"before": before, "after": after}
    return {
        "before": "Fragmented article operations with manual publishing, disconnected media handling and weak content governance.",
        "after": "A structured Workforce Observatory publishing system with scheduled release control, reusable sections and visible editorial logic.",
    }


def build_flow(article: dict) -> list[str]:
    for section in article.get("sections") or []:
        settings = section.get("settings") or {}
        flow = settings.get("flow")
        if isinstance(flow, list) and flow:
            return [clean(item, max_length=60) for item in flow if clean(item, max_length=60)]
    steps = [clean(section.get("title"), max_length=60) for section in article.get("sections") or [] if clean(section.get("title"), max_length=60)]
    return steps[:6] or ["Question", "Evidence", "Interpretation", "Decision"]


def export_topics(topics: list[dict]) -> list[dict]:
    return [{
        "slug": slugify(topic.get("slug") or topic.get("name"), fallback="topic"),
        "name": clean(topic.get("name"), max_length=120),
        "summary": clean(topic.get("summary"), max_length=500),
        "audience": clean((topic.get("settings") or {}).get("audience"), fallback=f'Leaders and practitioners working in {topic.get("name", "this topic")}.', max_length=300),
        "credibilityNote": clean((topic.get("settings") or {}).get("credibilityNote"), fallback="This topic is managed from the Workforce Observatory backend.", max_length=300),
        "strategicQuestions": [clean(item, max_length=240) for item in ((topic.get("settings") or {}).get("strategicQuestions") or []) if clean(item, max_length=240)],
        "relatedTopics": [slugify(item, fallback="topic") for item in ((topic.get("settings") or {}).get("relatedTopics") or []) if slugify(item, fallback="topic")],
    } for topic in topics]


def transform_articles(payload: dict) -> tuple[list[dict], list[dict], list[dict], dict[str, str], list[dict]]:
    exported_articles = payload.get("articles") or []
    topics = {topic["slug"]: topic for topic in export_topics(payload.get("topics") or [])}
    ordered = sorted(
        [article for article in exported_articles if article.get("status") in {"scheduled", "published"}],
        key=lambda item: item.get("publishAt") or item.get("updatedAt") or "9999-12-31T00:00:00Z",
    )
    article_records = []
    carousel_records = []
    schedule_records = []
    body_fragments: dict[str, str] = {}

    for index, article in enumerate(ordered, start=1):
        topic_slug = slugify(article.get("topicSlug"), fallback="people-analytics")
        topic = topics.get(topic_slug, {
            "slug": topic_slug,
            "name": clean(article.get("topicName"), fallback="People Analytics", max_length=120),
            "summary": "",
            "audience": f'Leaders and practitioners working in {clean(article.get("topicName"), fallback="People Analytics")}.',
            "credibilityNote": "This topic is managed from the Workforce Observatory backend.",
            "strategicQuestions": [],
            "relatedTopics": [],
        })
        flow = build_flow(article)
        q_section = next((section for section in article.get("sections") or [] if section.get("sectionType") == "questions"), None)
        m_section = next((section for section in article.get("sections") or [] if section.get("sectionType") == "mistakes"), None)
        g_section = next((section for section in article.get("sections") or [] if section.get("sectionType") == "guidance"), None)
        article_records.append({
            "slug": slugify(article.get("slug"), fallback=f"article-{index}"),
            "title": clean(article.get("title"), fallback=f"Article {index}", max_length=180),
            "summary": clean(article.get("summary"), max_length=500),
            "topic": topic["name"],
            "topicSlug": topic["slug"],
            "publishAt": article.get("publishAt") or datetime.utcnow().isoformat() + "Z",
            "readingMinutes": int(article.get("readingMinutes") or 12),
            "eyebrow": clean(article.get("sections", [{}])[0].get("eyebrow") if article.get("sections") else None, fallback=topic["name"], max_length=120),
            "accent": TOPIC_ACCENTS.get(topic["slug"], "#22c9ac"),
            "carouselSource": clean(article.get("carouselSource"), fallback="Backend managed carousel", max_length=255),
            "heroNumber": f"{index:02d}",
            "flow": flow,
            "author": "gabriel-croitoru",
            "socialImage": clean(article.get("socialImageUrl"), fallback="/assets/img/og-default.svg", max_length=500),
            "related": [slugify(item, fallback="related") for item in (article.get("relatedSlugs") or []) if slugify(item, fallback="related")],
            "keywords": [clean(item, max_length=120) for item in (article.get("keywords") or []) if clean(item, max_length=120)],
            "executiveTakeaway": clean(article.get("executiveTakeaway"), fallback=article.get("summary"), max_length=1000),
            "keyQuestions": split_items(q_section or {}),
            "commonMistakes": split_items(m_section or {}),
            "implementationGuidance": split_items(g_section or {}),
            "beforeAfter": before_after(article),
            "interactiveVisual": build_visualization(article, flow),
        })
        carousel_records.append({
            "slug": slugify(article.get("slug"), fallback=f"article-{index}"),
            "title": clean(article.get("title"), fallback=f"Article {index}", max_length=180),
            "source": clean(article.get("carouselSource"), fallback="Backend managed carousel", max_length=255),
            "relationship": "LinkedIn visual carousel curiosity layer paired with a long-form Workforce Observatory article.",
            "hook": clean(article.get("carouselHook"), fallback=article.get("summary"), max_length=500),
            "previewPoints": split_items(q_section or {})[:3] or split_items(g_section or {})[:3] or [clean(article.get("summary"), max_length=200)],
            "cta": "Open the full Workforce Observatory article for the depth layer.",
        })
        schedule_records.append({
            "slug": slugify(article.get("slug"), fallback=f"article-{index}"),
            "title": clean(article.get("title"), fallback=f"Article {index}", max_length=180),
            "publishAt": article.get("publishAt") or datetime.utcnow().isoformat() + "Z",
        })
        body_fragments[slugify(article.get("slug"), fallback=f"article-{index}")] = sections_to_body(article)

    return article_records, carousel_records, schedule_records, body_fragments, list(topics.values())


def write_json(path: Path, payload):
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def main():
    payload = read_source()
    articles, carousels, schedule, body_fragments, topics = transform_articles(payload)
    write_json(GENERATED / "articles" / "articles.json", articles)
    write_json(GENERATED / "carousels" / "carousels.json", carousels)
    write_json(GENERATED / "schedule.json", schedule)
    write_json(GENERATED / "topics" / "topics.json", topics)
    for slug, html in body_fragments.items():
        path = GENERATED / "articles" / f"{slug}.html"
        ensure_dir(path.parent)
        path.write_text(html)
    print(f"synced {len(articles)} backend articles")


if __name__ == "__main__":
    main()
