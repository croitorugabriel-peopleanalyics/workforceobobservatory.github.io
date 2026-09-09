# Workforce Observatory scheduled articles

Each PDF has a separate, responsive, extended English interactive article.

## Scheduling
Edit `schedule.json`. `publishAt` uses UTC ISO format. The GitHub Action runs hourly and copies only eligible articles into the deployed `dist` folder. Browser-only hiding is intentionally avoided because a direct URL could bypass it.

Important: future source files remain visible if the repository is public. Keep this repository private where supported, or separate private drafts from the public deployment repository.

## Deploy
1. Upload all files, including `.github`, to the repository root.
2. GitHub Settings → Pages → Source: GitHub Actions.
3. Update every `publishAt` to match its LinkedIn publication.
4. Push to `main`, or run the workflow manually.

## Preview
`BUILD_TIME_UTC=2027-12-31T00:00:00Z python scripts/build.py`
Then serve `dist` locally.
