# Workforce Observatory

Workforce Observatory is a premium learning and thought leadership platform focused on People Analytics, HR Data Architecture, Workforce Intelligence, Responsible AI, Data Governance and HR Decision Science.

## Platform architecture

Phase 1 established the platform shell and publishing system while keeping the existing scheduling and GitHub Pages primitives in place. Phase 2 layers on premium page composition, richer article storytelling modules, query-aware search, topic filtering and motion-safe front-end polish. Phase 3 upgrades the article library with stronger editorial copy and structured interactive scenario metadata. Phase 4 adds richer topic and author credibility surfaces, page-level social preview generation and stronger structured metadata coverage.

### Source structure

- `/content/articles` — canonical article body fragments plus structured metadata in `articles.json`
- `/content/carousels` — LinkedIn carousel metadata
- `/content/topics` — topic definitions for topic hubs
- `/content/authors` — author metadata
- `/templates` — static HTML templates for home, library, article, topic, topics, search and author pages
- `/partials` — shared head, header and footer partials
- `/assets/css` — design tokens, layout, components, page styles and motion
- `/assets/js` — modular enhancements for core shell, article behavior, parallax, topic filtering and search
- `/scripts/build.py` — scheduled static site generation into `/dist`
- `/.github/workflows` — GitHub Actions for build, refresh and deploy

### Article model

- Each article keeps its narrative body in `/content/articles/{slug}.html`.
- `content/articles/articles.json` stores metadata, related content, and Phase 3 `interactiveVisual` scenario definitions.
- `content/carousels/carousels.json` stores carousel-specific curiosity-layer hooks, preview points and call-to-depth copy for the same scheduled slugs.
- Article pages render interactive scenario tabs at build time and enhance them with vanilla JavaScript in the browser.
- Topic and author metadata also drive Phase 4 editorial framing, strategic questions, credibility sections and future-ready platform pages.

### Publishing model

- `schedule.json` remains the publication gate.
- `scripts/build.py` reads `schedule.json` in UTC.
- Only publish-eligible articles and their paired carousel briefings are rendered into `/dist`.
- Future-dated content is excluded from article pages, library listings, search indexes and sitemap output.
- Search topic filters and article continuation modules are also generated from the publish-eligible set only.
- Page-level Open Graph preview images are generated into `/dist/assets/og` during the build.
- Structured data now includes website, collection, breadcrumb, article and item-list coverage where relevant.

## Build and preview

Build against the current UTC time:

```bash
python scripts/build.py
```

Preview a future publication window locally:

```bash
BUILD_TIME_UTC=2026-11-20T00:00:00Z python scripts/build.py
```

Then serve `/dist` from the repository root.

## Deployment

GitHub Pages should use the workflows in `/.github/workflows`.

- `pages.yml` builds and deploys the generated `/dist` site on push and manual runs.
- `refresh-and-deploy.yml` refreshes data, commits the dataset when needed, then rebuilds and deploys `/dist` on schedule or manual runs.
- `refresh-data.yml` remains available for manual data refreshes without deployment.
