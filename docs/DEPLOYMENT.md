# Deployment

StockPurify has no production deployment or payment environment. The GitHub repository does not have a Pages site configured.

## Current pipeline

The `CI` workflow runs `npm run qa` for pull requests and changes to `main`. It checks source guardrails, runs the deterministic test suite, and verifies the methodology registry and historical-data manifest.

The workflow does not publish the site. A public deployment should be added only after the owner chooses a host and confirms the research-preview wording. Enabling a methodology or payment flow remains subject to the separate review gate in `METHODOLOGY_GOVERNANCE.md`.

## Local smoke test

Run:

```sh
npm run qa
npm run serve
```

Open `http://localhost:4173`, submit a contribution record, and confirm that the page shows events, an exact total, a canonical-record fingerprint, and an unavailable charitable amount.

## Future release and rollback

When a deployment pipeline exists, it should publish only a commit that passed `npm run qa`. Record the deployed commit SHA and smoke-test the public URL. If that test fails, redeploy the last passing SHA and verify it before investigating the failed release.
