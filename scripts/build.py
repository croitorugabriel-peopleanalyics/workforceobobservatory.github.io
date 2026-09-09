from __future__ import annotations

from datetime import datetime, timezone
from html import escape
from pathlib import Path
from urllib.parse import quote
import json
import os
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
SITE_URL = f"https://{(ROOT / 'CNAME').read_text().strip()}"


def render_fragment(template: str, context: dict[str, str]) -> str:
    for key, value in context.items():
        template = template.replace(f"{{{{{key}}}}}", value)
    return template


def read_json(path: Path):
    return json.loads(path.read_text())


def iso_now() -> datetime:
    value = os.getenv("BUILD_TIME_UTC", datetime.now(timezone.utc).isoformat())
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def write_page(path: Path, content: str):
    ensure_dir(path.parent)
    path.write_text(content)


def format_publish_label(value: str) -> str:
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return dt.strftime("%d %b %Y")


def make_head(title: str, description: str, canonical_url: str, *, robots: str = "index,follow", og_type: str = "website", social_image: str = "/assets/img/og-default.svg", structured_data: dict | list | None = None, extra_head: str = "") -> str:
    head_template = (ROOT / "partials" / "head.html").read_text()
    image_url = social_image if social_image.startswith("http") else f"{SITE_URL}{social_image}"
    return render_fragment(head_template, {
        "page_title": escape(title),
        "page_description": escape(description),
        "canonical_url": canonical_url,
        "robots": robots,
        "og_type": og_type,
        "social_image_url": image_url,
        "structured_data": json.dumps(structured_data or {}, ensure_ascii=False),
        "extra_head": extra_head,
    })


def render_page(*, template_name: str, page_title: str, page_description: str, canonical_path: str, content_context: dict[str, str], body_class: str, body_attrs: str = "", scripts: list[str] | None = None, robots: str = "index,follow", og_type: str = "website", social_image: str = "/assets/img/og-default.svg", structured_data: dict | list | None = None, extra_head: str = "") -> str:
    header = (ROOT / "partials" / "header.html").read_text()
    footer = render_fragment((ROOT / "partials" / "footer.html").read_text(), {"year": str(datetime.now(timezone.utc).year)})
    page_template = (ROOT / "templates" / template_name).read_text()
    page_content = render_fragment(page_template, content_context)
    script_tags = "\n".join(f'<script src="{src}"></script>' for src in (scripts or []))
    base = (ROOT / "templates" / "base.html").read_text()
    return render_fragment(base, {
        "head": make_head(page_title, page_description, f"{SITE_URL}{canonical_path}", robots=robots, og_type=og_type, social_image=social_image, structured_data=structured_data, extra_head=extra_head),
        "body_class": body_class,
        "body_attrs": body_attrs,
        "header": header,
        "page_content": page_content,
        "footer": footer,
        "scripts": script_tags,
    })


def article_url(slug: str) -> str:
    return f"/articles/{slug}/"


def article_card(article: dict) -> str:
    return (
        f'<a class="article-card" href="{article_url(article["slug"])}" data-topic="{escape(article["topicSlug"])}" '
        f'data-search="{escape(article["searchText"])}">'
        f'<p class="eyebrow">{escape(article["topic"])}</p>'
        f'<h3>{escape(article["title"])}</h3>'
        f'<p>{escape(article["summary"])}</p>'
        f'<div class="article-card__meta"><span>{article["readingMinutes"]} min read</span><span>{escape(article["publishLabel"])}</span></div>'
        f'</a>'
    )


def topic_card(topic: dict, count: int) -> str:
    label = "published article" if count == 1 else "published articles"
    return (
        f'<a class="topic-card" href="/topics/{topic["slug"]}/">'
        f'<p class="eyebrow">Topic</p>'
        f'<h2>{escape(topic["name"])}</h2>'
        f'<p>{escape(topic["summary"])}</p>'
        f'<div class="topic-card__count">{count} {label}</div>'
        f'</a>'
    )


def bullet_cards(items: list[str]) -> str:
    return "".join(f'<article class="bullet-card"><p>{escape(item)}</p></article>' for item in items)


def accordion(items: list[str]) -> str:
    return "".join(
        f'<details class="accordion-item"><summary>Mistake {index}</summary><p>{escape(item)}</p></details>'
        for index, item in enumerate(items, start=1)
    )


def guidance_list(items: list[str]) -> str:
    return "".join(f"<li>{escape(item)}</li>" for item in items)


def parse_toc(body_html: str) -> list[tuple[str, str]]:
    return re.findall(r'<section[^>]*id="([^"]+)"[^>]*>.*?<h2>(.*?)</h2>', body_html, re.S)


def merge_content() -> tuple[list[dict], list[dict], dict, list[dict]]:
    schedule = {item["slug"]: item for item in read_json(ROOT / "schedule.json")}
    articles = read_json(ROOT / "content" / "articles" / "articles.json")
    topics = read_json(ROOT / "content" / "topics" / "topics.json")
    author = read_json(ROOT / "content" / "authors" / "gabriel-croitoru.json")
    live = []
    now = iso_now()
    for article in articles:
        sched = schedule[article["slug"]]
        publish_at = datetime.fromisoformat(sched["publishAt"].replace("Z", "+00:00"))
        merged = {**article, **sched}
        if publish_at <= now:
            body_html = (ROOT / "content" / "articles" / f'{article["slug"]}.html').read_text().strip()
            merged["bodyHtml"] = body_html
            merged["publishLabel"] = format_publish_label(merged["publishAt"])
            merged["searchText"] = " ".join([
                merged["title"], merged["summary"], merged["topic"], *merged.get("keywords", []), *merged.get("keyQuestions", [])
            ]).lower()
            live.append(merged)
    live.sort(key=lambda item: item["publishAt"], reverse=True)
    return live, topics, author, articles


def build_featured_section(live: list[dict]) -> str:
    if not live:
        return (
            '<article class="feature-card">'
            '<div><p class="eyebrow">Featured article</p><h2>The platform shell is live. Published articles will appear automatically.</h2>'
            '<p>The Phase 1 build now generates the full library, topic hubs, search, author page and SEO scaffolding without exposing future-dated articles.</p></div>'
            '<div class="hero-panel"><p class="eyebrow">Publishing model</p><strong>UTC gated</strong><p>Only eligible content reaches the deployment output.</p></div>'
            '</article>'
        )
    article = live[0]
    return (
        '<article class="feature-card">'
        '<div>'
        f'<p class="eyebrow">Featured article</p><h2>{escape(article["title"])}</h2><p>{escape(article["summary"])}</p>'
        f'<div class="feature-card__meta"><span>{escape(article["topic"])}</span><span>{article["readingMinutes"]} min read</span><span>{escape(article["publishLabel"])}</span></div>'
        f'<p><a class="button button--primary" href="{article_url(article["slug"])}">Read the article</a></p>'
        '</div>'
        '<div class="hero-panel">'
        '<p class="eyebrow">Depth layer</p>'
        f'<strong>{escape(article["eyebrow"])}</strong>'
        f'<p>{escape(article["executiveTakeaway"])}</p>'
        '</div>'
        '</article>'
    )


def build_topic_filter(topics: list[dict]) -> str:
    buttons = ['<button class="filter-pill is-active" type="button" data-topic-filter="all">All topics</button>']
    for topic in topics:
        buttons.append(f'<button class="filter-pill" type="button" data-topic-filter="{escape(topic["slug"])}">{escape(topic["name"])}</button>')
    return "".join(buttons)


def build_search_topic_filter(topics: list[dict]) -> str:
    buttons = ['<button class="filter-pill is-active" type="button" data-search-topic="all">All topics</button>']
    for topic in topics:
        buttons.append(f'<button class="filter-pill" type="button" data-search-topic="{escape(topic["slug"])}">{escape(topic["name"])}</button>')
    return "".join(buttons)


def article_structured_data(article: dict) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article["title"],
        "description": article["summary"],
        "datePublished": article["publishAt"],
        "dateModified": article["publishAt"],
        "author": {"@type": "Person", "name": "Gabriel Croitoru", "url": f"{SITE_URL}/author/"},
        "publisher": {"@type": "Organization", "name": "Workforce Observatory", "url": SITE_URL},
        "mainEntityOfPage": f'{SITE_URL}{article_url(article["slug"])}',
        "image": f'{SITE_URL}{article["socialImage"]}',
        "articleSection": article["topic"],
        "keywords": article.get("keywords", []),
        "timeRequired": f'PT{article["readingMinutes"]}M',
    }


def collection_structured_data(title: str, description: str, path: str) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": title,
        "description": description,
        "url": f"{SITE_URL}{path}",
        "isPartOf": {"@type": "WebSite", "name": "Workforce Observatory", "url": SITE_URL},
    }


def process_cards(flow: list[str]) -> str:
    return "".join(
        f'<article class="process-card"><span class="process-card__index">{index}</span><h3>{escape(step)}</h3><p>Make this step explicit in the operating model so readers can connect concept, evidence and decision consequence.</p></article>'
        for index, step in enumerate(flow, start=1)
    )


def continuation_card(article: dict | None, label: str) -> str:
    if article is None:
        return (
            f'<article class="continuation-card continuation-card--empty"><p class="eyebrow">{escape(label)}</p>'
            '<h3>No adjacent published article yet.</h3><p>The sequence expands automatically as scheduled content becomes eligible for publication.</p></article>'
        )
    return (
        f'<a class="continuation-card" href="{article_url(article["slug"])}"><p class="eyebrow">{escape(label)}</p>'
        f'<h3>{escape(article["title"])}</h3><p>{escape(article["summary"])}</p>'
        f'<div class="article-card__meta"><span>{escape(article["topic"])}</span><span>{article["readingMinutes"]} min read</span></div></a>'
    )


def build_articles(live: list[dict], articles_by_slug: dict[str, dict]):
    urls = []
    for index, article in enumerate(live):
        toc_items = parse_toc(article["bodyHtml"])
        extra_toc = [
            ("operating-model", "Interactive operating model"),
            ("before-after", "Before / after"),
            ("executive-takeaway", "Executive takeaway"),
            ("key-business-questions", "Key business questions"),
            ("common-mistakes", "Common mistakes"),
            ("implementation-guidance", "Implementation guidance"),
            ("continue-reading", "Continue reading"),
            ("related-articles", "Related articles"),
            ("share", "Share"),
        ]
        seen = set()
        toc_html = []
        for anchor, label in [*extra_toc[:1], *toc_items, *extra_toc[1:]]:
            if anchor in seen:
                continue
            seen.add(anchor)
            toc_html.append(f'<a href="#{escape(anchor)}">{escape(re.sub(r"<.*?>", "", label))}</a>')
        related_cards = "".join(
            article_card(articles_by_slug[slug])
            for slug in article.get("related", [])
            if slug in articles_by_slug
        ) or '<div class="empty-panel is-visible"><p>More published related articles will appear here as the library grows.</p></div>'
        previous_article = live[index + 1] if index + 1 < len(live) else None
        next_article = live[index - 1] if index > 0 else None
        content = render_page(
            template_name="article.html",
            page_title=f'{article["title"]} | Workforce Observatory',
            page_description=article["summary"],
            canonical_path=article_url(article["slug"]),
            content_context={
                "article_topic": escape(article["topic"]),
                "article_title": escape(article["title"]),
                "article_summary": escape(article["summary"]),
                "article_reading_time": f'{article["readingMinutes"]} min read',
                "article_publish_label": escape(article["publishLabel"]),
                "article_author": "Gabriel Croitoru",
                "article_number": escape(article["heroNumber"]),
                "article_flow": "|".join(article.get("flow", [])),
                "article_toc": "".join(toc_html),
                "article_flow_cards": process_cards(article.get("flow", [])),
                "article_takeaway": escape(article["executiveTakeaway"]),
                "article_carousel": escape(article["carouselSource"]),
                "article_before": escape(article["beforeAfter"]["before"]),
                "article_after": escape(article["beforeAfter"]["after"]),
                "article_body": article["bodyHtml"],
                "article_questions": bullet_cards(article.get("keyQuestions", [])),
                "article_mistakes": accordion(article.get("commonMistakes", [])),
                "article_guidance": guidance_list(article.get("implementationGuidance", [])),
                "related_cards": related_cards,
                "article_prev_next": continuation_card(previous_article, "Previous published article") + continuation_card(next_article, "Next published article"),
                "article_encoded_url": quote(f'{SITE_URL}{article_url(article["slug"])}', safe=''),
                "article_encoded_title": quote(article["title"], safe=''),
            },
            body_class="page page--article",
            body_attrs=f' data-page="article" style="--article-accent:{article["accent"]}"',
            scripts=["/assets/js/core.js", "/assets/js/article.js"],
            og_type="article",
            social_image=article["socialImage"],
            structured_data=article_structured_data(article),
        )
        write_page(DIST / "articles" / article["slug"] / "index.html", content)
        urls.append(article_url(article["slug"]))
    return urls


def build_home(live: list[dict], topics: list[dict], topic_counts: dict[str, int]):
    latest_cards = "".join(article_card(article) for article in live[:6]) or '<div class="empty-panel is-visible"><h3>Library coming online</h3><p>Published articles will populate this section as soon as their scheduled dates arrive.</p></div>'
    live_topic_count = sum(1 for count in topic_counts.values() if count)
    html = render_page(
        template_name="home.html",
        page_title="Workforce Observatory | People Analytics, Workforce Intelligence and Responsible AI",
        page_description="A premium learning and thought leadership platform for People Analytics, HR Data Architecture, Workforce Intelligence, Responsible AI and HR decision science.",
        canonical_path="/",
        content_context={
            "published_count": str(len(live)),
            "published_label": "published articles" if len(live) != 1 else "published article",
            "live_topic_count": str(live_topic_count),
            "home_status": live[0]["publishLabel"] if live else "Build-ready",
            "home_status_label": "latest publication" if live else "waiting for first scheduled release",
            "featured_section": build_featured_section(live),
            "topic_cards": "".join(topic_card(topic, topic_counts.get(topic["slug"], 0)) for topic in topics),
            "latest_cards": latest_cards,
        },
        body_class="page page--home",
        body_attrs=' data-page="home"',
        scripts=["/assets/js/core.js"],
        structured_data={
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Workforce Observatory",
            "url": SITE_URL,
            "description": "Premium People Analytics and Workforce Intelligence platform.",
            "potentialAction": {"@type": "SearchAction", "target": f"{SITE_URL}/search/?q={{search_term_string}}", "query-input": "required name=search_term_string"},
        },
    )
    write_page(DIST / "index.html", html)
    return "/"


def build_library(live: list[dict], topics: list[dict]):
    html = render_page(
        template_name="library.html",
        page_title="Library | Workforce Observatory",
        page_description="Browse every published Workforce Observatory article across People Analytics, HR Data Architecture, Workforce Intelligence and Responsible AI.",
        canonical_path="/library/",
        content_context={
            "topic_filters": build_topic_filter(topics),
            "library_cards": "".join(article_card(article) for article in live),
            "library_empty_modifier": " is-visible" if not live else "",
            "published_count": str(len(live)),
            "published_label": "published articles" if len(live) != 1 else "published article",
            "live_topic_count": str(sum(1 for article in topics if any(item["topicSlug"] == article["slug"] for item in live))),
        },
        body_class="page page--library",
        body_attrs=' data-page="library"',
        scripts=["/assets/js/core.js", "/assets/js/search.js"],
        structured_data=collection_structured_data("Library | Workforce Observatory", "Browse every published Workforce Observatory article.", "/library/"),
    )
    write_page(DIST / "library" / "index.html", html)
    return "/library/"


def build_topics_pages(live: list[dict], topics: list[dict]):
    topic_counts = {topic["slug"]: 0 for topic in topics}
    grouped: dict[str, list[dict]] = {topic["slug"]: [] for topic in topics}
    for article in live:
        topic_counts[article["topicSlug"]] += 1
        grouped[article["topicSlug"]].append(article)
    topics_index = render_page(
        template_name="topics.html",
        page_title="Topics | Workforce Observatory",
        page_description="Explore Workforce Observatory topics across People Analytics, HR Data Architecture, Workforce Intelligence, Responsible AI and decision science.",
        canonical_path="/topics/",
        content_context={
            "topic_cards": "".join(topic_card(topic, topic_counts[topic["slug"]]) for topic in topics),
        },
        body_class="page page--topics",
        body_attrs=' data-page="topics"',
        scripts=["/assets/js/core.js"],
        structured_data=collection_structured_data("Topics | Workforce Observatory", "Explore Workforce Observatory topic hubs.", "/topics/"),
    )
    write_page(DIST / "topics" / "index.html", topics_index)
    urls = ["/topics/"]
    for topic in topics:
        count = topic_counts[topic["slug"]]
        html = render_page(
            template_name="topic.html",
            page_title=f'{topic["name"]} | Workforce Observatory',
            page_description=topic["summary"],
            canonical_path=f'/topics/{topic["slug"]}/',
            content_context={
                "topic_name": escape(topic["name"]),
                "topic_summary": escape(topic["summary"]),
                "topic_count": str(count),
                "topic_count_label": "published article" if count == 1 else "published articles",
                "topic_article_cards": "".join(article_card(article) for article in grouped[topic["slug"]]),
                "topic_empty_modifier": " is-visible" if count == 0 else "",
            },
            body_class="page page--topic",
            body_attrs=f' data-page="topic" data-topic="{topic["slug"]}"',
            scripts=["/assets/js/core.js"],
            structured_data=collection_structured_data(f'{topic["name"]} | Workforce Observatory', topic["summary"], f'/topics/{topic["slug"]}/'),
        )
        write_page(DIST / "topics" / topic["slug"] / "index.html", html)
        urls.append(f'/topics/{topic["slug"]}/')
    return urls, topic_counts


def build_search(search_index: list[dict], topics: list[dict]):
    html = render_page(
        template_name="search.html",
        page_title="Search | Workforce Observatory",
        page_description="Search the published Workforce Observatory library without exposing future-dated articles.",
        canonical_path="/search/",
        content_context={"search_topic_filters": build_search_topic_filter(topics)},
        body_class="page page--search",
        body_attrs=' data-page="search"',
        scripts=["/assets/js/core.js", "/assets/js/search.js"],
        robots="noindex,follow",
        structured_data=collection_structured_data("Search | Workforce Observatory", "Search the published Workforce Observatory library.", "/search/"),
    )
    write_page(DIST / "search" / "index.html", html)
    ensure_dir(DIST / "data")
    (DIST / "data" / "search-index.json").write_text(json.dumps(search_index, indent=2) + "\n")
    return "/search/"


def build_author(live: list[dict], author: dict):
    author_cards = "".join(article_card(article) for article in live if article.get("author") == author["slug"])
    html = render_page(
        template_name="author.html",
        page_title=f'{author["name"]} | Workforce Observatory',
        page_description=author["summary"],
        canonical_path="/author/",
        content_context={
            "author_name": escape(author["name"]),
            "author_summary": escape(author["summary"]),
            "author_role": escape(author["role"]),
            "author_location": escape(author["location"]),
            "author_linkedin": escape(author["linkedin"]),
            "author_future_state": escape(author["futureState"]),
            "author_focus_pills": "".join(f'<span class="pill">{escape(item)}</span>' for item in author.get("focusAreas", [])),
            "author_article_cards": author_cards,
            "author_empty_modifier": " is-visible" if not author_cards else "",
        },
        body_class="page page--author",
        body_attrs=' data-page="author"',
        scripts=["/assets/js/core.js"],
        structured_data={
            "@context": "https://schema.org",
            "@type": "Person",
            "name": author["name"],
            "jobTitle": author["role"],
            "description": author["summary"],
            "url": f"{SITE_URL}/author/",
        },
    )
    write_page(DIST / "author" / "index.html", html)
    return "/author/"


def build_robots():
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n")
    return "/robots.txt"


def build_sitemap(paths: list[str]):
    entries = "\n".join(f"  <url><loc>{SITE_URL}{path}</loc></url>" for path in sorted(set(paths)))
    (DIST / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{entries}\n</urlset>\n')
    return "/sitemap.xml"


def main():
    shutil.rmtree(DIST, ignore_errors=True)
    ensure_dir(DIST)
    ensure_dir(DIST / "assets")
    for folder in ("css", "js", "img", "fonts"):
        source = ROOT / "assets" / folder
        if source.exists():
            shutil.copytree(source, DIST / "assets" / folder)
    live, topics, author, _all_articles = merge_content()
    articles_by_slug = {article["slug"]: article for article in live}
    topic_urls, topic_counts = build_topics_pages(live, topics)
    search_index = [
        {
            "slug": article["slug"],
            "title": article["title"],
            "summary": article["summary"],
            "topic": article["topic"],
            "topicSlug": article["topicSlug"],
            "readingMinutes": article["readingMinutes"],
            "publishLabel": article["publishLabel"],
            "keywords": article.get("keywords", []),
            "searchText": article["searchText"],
            "url": article_url(article["slug"]),
        }
        for article in live
    ]
    ensure_dir(DIST / "data")
    (DIST / "data" / "topic-map.json").write_text(json.dumps({
        topic["slug"]: {
            "name": topic["name"],
            "summary": topic["summary"],
            "articleCount": topic_counts[topic["slug"]],
        }
        for topic in topics
    }, indent=2) + "\n")
    (DIST / "data" / "related-content.json").write_text(json.dumps({
        article["slug"]: article.get("related", [])
        for article in live
    }, indent=2) + "\n")
    paths = [build_home(live, topics, topic_counts), build_library(live, topics), *topic_urls, build_author(live, author)]
    build_robots()
    build_search(search_index, topics)
    paths.extend(build_articles(live, articles_by_slug))
    paths.append(build_sitemap(paths))
    (DIST / ".nojekyll").write_text("")
    print(f"published {len(live)} articles")


if __name__ == "__main__":
    main()
