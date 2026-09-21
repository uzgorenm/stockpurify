# StockPurify

StockPurify is a research preview for a deterministic, auditable investment-earnings purification calculator.

The preview does not calculate or label a charitable amount. No methodology can be enabled until all of these gates are complete:

- an authoritative, versioned source has been archived and traced to the implementation;
- implementation, data, display, and trademark rights have been confirmed;
- historical inputs have fixed versions and verified checksums; and
- a qualified Islamic-finance scholar or Shariah board has approved the calculation, fee structure, charity flow, supported recipients, and public wording.

The current app builds a reproducible contribution record, including recurring schedules. It accepts no payments, holds no charitable funds, makes no statement of religious obligation, and does not claim scholarly or nonprofit approval.

## Local use

Install Node.js 20 or later, then run:

```sh
npm run qa
npm run serve
```

Open `http://localhost:4173`.

The app has no runtime dependencies. All contribution-record calculations run as deterministic JavaScript in the browser, and AI is not part of the calculation path.

## Repository map

- `src/core/` contains exact money, calendar, canonicalization, and audit-record code.
- `data/` contains the production methodology registry and historical-data manifest. Both currently contain zero supported entries.
- `test/fixtures/` contains fixed contribution-record fixtures.
- `docs/METHODOLOGY_GOVERNANCE.md` documents the release gate for a future methodology.

## Deployment

No production deployment is configured. GitHub Actions runs the full QA suite on each change to `main`. See `docs/DEPLOYMENT.md` for the current release policy.
