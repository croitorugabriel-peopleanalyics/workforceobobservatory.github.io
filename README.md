# Workforce Observatory: end-to-end

## Upload
Upload every file and directory in this package to the repository root, including the hidden `.github` directory.

## GitHub settings
1. Settings > Pages > Source: GitHub Actions.
2. Settings > Actions > General > Workflow permissions: Read and write permissions.
3. Actions > Refresh data and deploy > Run workflow.
4. The same workflow refreshes daily and deploys the site.

## Domain
The included CNAME points to workforceobservatory.com. Keep GitHub DNS records as DNS only in Cloudflare until GitHub provisions HTTPS.

## Scope
World Bank indicators are active. Eurostat, OECD and ILOSTAT are listed as planned adapters, not falsely presented as already ingested. A daily workflow checks for refreshed public data, but publishers may update individual series less frequently.
