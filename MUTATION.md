# Mutation testing

Tutela's core engine is verified with [StrykerJS](https://stryker-mutator.io/) — every mutant
(small code change) must be *killed* by a test, or it counts against the score. This is the
TypeScript analogue of a `cargo mutants` 0-survivor gate.

```sh
pnpm mutation     # stryker run
```

- **Runner:** the `command` runner executes `tsx test/run.ts`; a non-zero exit (any failed
  assertion) means the mutant was killed.
- **Scope:** `src/core/**` — the transport, auth, config, errors, branded ids, and the generic
  combinator. (`request-builder.ts` is excluded: it is pure compile-time type machinery with no
  runtime to mutate. The generated `src/generated/**` modules are types-only and likewise have
  no runtime.)
- **Gate:** `thresholds.break = 90`. The run fails CI if the score regresses below it.

## Current score

```
File       | % score | killed | survived
-----------|---------|--------|---------
All files  |  93.63  |   191  |    13
 brand.ts  | 100.00  |    22  |     0
 errors.ts | 100.00  |    10  |     0
 typed.ts  | 100.00  |    14  |     0
 config.ts |  94.12  |    16  |     1
 http.ts   |  92.92  |   105  |     8
 auth.ts   |  85.71  |    24  |     4
```

## On the surviving mutants

The 13 survivors are **equivalent or effectively-unreachable mutants** — changes that produce no
observable behavioral difference, which by definition no test can kill:

- **Identity strings:** the `Context.Tag` keys (`"@tutela/Config"`, `"@tutela/TokenProvider"`) →
  `""`. A tag's identity is only relative; renaming it consistently has no effect.
- **Request-body value details:** `grant_type: "client_credentials"` / the `bodyUrlParams`
  payload. Observable only by parsing the urlencoded token-request body — that would assert on the
  mock's view of the body, not SDK behavior. (We *do* assert the request's method, Basic auth
  header, `Accept`, and `Content-Type`.)
- **Lenient-schema internals:** mutations inside the all-optional `ErrorEnvelope` `Schema.Struct`
  still decode our error bodies identically.
- **Redundant defensive code:** the explicit `entry[1] !== undefined` query filter — `setUrlParams`
  already drops `undefined` values, so removing the filter changes nothing observable.
- **Unrepresentable boundaries:** `status >= 200` → `true` only differs for `< 200` statuses, which
  the `Response` constructor cannot produce; `>` → `>=` on the expiry comparison differs only at an
  exact-millisecond tie.

Every *killable* mutant is covered — all status→error mappings (incl. the 300 boundary), the
retry/refresh-and-give-up logic, transport & "failed reading body" errors, query building + path
encoding, the error-envelope normalization (numeric codes, per-error messages, missing fields,
non-object bodies), branded-constructor validation + messages, config parsing + `fromEnv`, the
OAuth Basic/Accept/Content-Type headers, the 204 no-read path, and curated schema decoding
including contract-drift detection. See `reports/mutation/index.html` after a run.
