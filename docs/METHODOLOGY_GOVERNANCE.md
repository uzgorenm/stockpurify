# Methodology governance

StockPurify currently supports zero production methodologies. The contribution-record builder is available, but the charitable-amount calculation is locked.

## Release gate

A methodology may enter the production registry only when every item below has recorded evidence:

1. The authoritative source and its exact version are archived.
2. Each calculation rule is traced from the source to deterministic code and fixed fixtures.
3. Implementation, data, display, and trademark rights are confirmed.
4. Every historical dataset has a version, provenance record, and SHA-256 checksum.
5. Recurring contributions, boundary dates, revisions, and missing-data behavior have fixed tests.
6. A qualified Islamic-finance scholar or Shariah board approves the calculation, fee structure, charity flow, supported recipients, and public wording.

Product names, index standards, and commercial screening services are not interchangeable. Each registry entry must state whether it implements an authoritative standard or uses a licensed provider's data and calculation service.

## Calculation rules

- Production calculations must be deterministic and must not call an AI model.
- Money uses integer minor units. Floating-point values are not allowed in calculation records.
- Dates use explicit calendar rules and ISO `YYYY-MM-DD` values.
- Identical versioned inputs must produce identical canonical JSON, explanations, and fingerprints.
- A change to a rule or dataset requires a new version. Existing results must retain their original versions.
- Missing or unverifiable inputs must stop the calculation. The product must not estimate them silently.

## Public and financial controls

Until the qualified review is complete, the product must not:

- describe a result as a religious obligation or ruling;
- accept a software fee or purification funds;
- route a user to a charity as part of a live payment flow;
- claim scholarly approval; or
- claim legal nonprofit or tax-exempt status.

The present interface therefore reports only a contribution record. Its calculation status is `locked`, its methodology identifier is `null`, and it does not contain a charitable amount.

## Production registry

The files `data/methodologies.json` and `data/historical-data-manifest.json` are the production release controls. `npm run verify:data` rejects duplicate identifiers, unversioned datasets, checksum mismatches, paths outside `data/history/`, and methodology entries that lack gate evidence. It also requires a version-matched calculation module and fixed fixture set for every production methodology.

Test-only examples must remain under `test/fixtures/`. They cannot appear in the production registry or public methodology selector.
