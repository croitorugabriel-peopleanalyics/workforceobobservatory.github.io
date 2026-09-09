# Workforce Observatory

Workforce Observatory is a premium learning and thought leadership platform focused on People Analytics, HR Data Architecture, Workforce Intelligence, Responsible AI, Data Governance and HR Decision Science.

## Phase 1 architecture

Phase 1 establishes the platform shell and publishing system while keeping the existing scheduling and GitHub Pages primitives in place.

### Source structure

- `/content/articles` — canonical article body fragments plus structured metadata in `articles.json`
- `/content/carousels` — LinkedIn carousel metadata
- `/content/topics` — topic definitions for topic hubs
- `/content/authors` — author metadata
- `/templates` — static HTML templates for home, library, article, topic, topics, search and author pages
- `/partials` — shared head, header and footer partials
- `/assets/css` — design tokens, layout, components, page styles and motion
- `/assets/js` — modular enhancements for core shell, article behavior and search
- `/scripts/build.py` — scheduled static site generation into `/dist`
- `/.github/workflows` — GitHub Actions for build, refresh and deploy

### Publishing model

- `schedule.json` remains the publication gate.
- `scripts/build.py` reads `schedule.json` in UTC.
- Only publish-eligible articles are rendered into `/dist`.
- Future-dated articles are excluded from article pages, library listings, search index and sitemap output.

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
