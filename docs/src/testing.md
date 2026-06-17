# Testing & Mutation Score

Tutela's correctness is verified two ways: a behavioral test suite, and mutation
testing that checks the *tests themselves*.

## Behavioral tests

`pnpm test` runs 81 assertions against a mock `HttpClient` layer — no network,
fully deterministic. They cover:

- token fetch, caching, expiry/refresh, and the `Basic`/`Accept`/`Content-Type`
  headers on the token request;
- bearer + `x-api-key` injection on data requests;
- every status → error mapping (400/401/402/404/422/429/5xx, plus the 300
  boundary), with normalized field errors;
- transparent 401 refresh-and-retry, and the give-up-after-one path;
- transport errors and malformed-body decode errors;
- curated `effect/Schema` decoding, including a **contract-drift** case
  (an out-of-enum value becoming a typed `DecodeError`).

## Mutation testing

`pnpm mutation` runs [StrykerJS](https://stryker-mutator.io) over `src/core/**`.
It makes thousands of tiny edits ("mutants") to the code and checks that a test
fails for each — a direct measure of whether the suite actually verifies behavior
rather than just executing it.

**Score: 93.6%**, gated at 90 (CI fails below it). `brand`, `errors`, and `typed`
are at 100%.

The handful of surviving mutants are **equivalent** — changes with no observable
behavioral difference, which by definition no test can kill (e.g. `Context.Tag`
identity strings, header literals the mock can't observe, `>` → `>=` boundaries).
They are catalogued rather than hidden; the full discussion lives in
[`MUTATION.md`](https://github.com/zuub-don/tutela/blob/main/MUTATION.md).

The guiding rule: kill every *killable* mutant, and document the equivalents.
100% is not a meaningful target — honesty about which mutants are unkillable is.
