# Workforce Observatory

Static public-data workforce dashboard for GitHub Pages.

## What is included
- Curated country-level workforce indicators from the World Bank Indicators API
- Experimental macro Workforce Health Index
- Daily GitHub Actions refresh
- Country selector, trends, benchmark ranking, coverage, CSV export and provenance
- Documented extension points for Eurostat, OECD SDMX and ILOSTAT

## Important scope
This repository does not claim to ingest every public HR indicator. Public labour datasets are large, differently structured and revised on different schedules. The MVP uses a curated, comparable indicator registry. Company-level HR data is not automatically included because there is no single standardized comparable public API; add explicit source-specific adapters.

## Deploy
1. Create a GitHub repository and upload the repository contents.
2. In Settings > Pages, choose GitHub Actions.
3. Run the Refresh public workforce data workflow manually once.
4. The refresh workflow is scheduled daily. Daily execution does not mean every publisher updates every indicator daily.
5. Add your custom domain in Pages settings after DNS is configured.

## Local preview
Run `python -m http.server 8000` in the repository root and open localhost port 8000.
