# Tutela

An [Effect](https://effect.website)-native TypeScript SDK for the **Guardian Connect** insurance APIs.

[![CI](https://img.shields.io/github/actions/workflow/status/zuub-don/tutela/ci.yml?branch=main&label=CI&logo=github)](https://github.com/zuub-don/tutela/actions/workflows/ci.yml)
[![Mutation score](https://img.shields.io/badge/mutation-93.6%25-brightgreen?logo=stryker)](./MUTATION.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Effect](https://img.shields.io/badge/Effect-3.21-5B21B6)](https://effect.website)
[![Module: ESM](https://img.shields.io/badge/module-ESM-F7DF1E)](https://nodejs.org/api/esm.html)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![APIs](https://img.shields.io/badge/Guardian%20APIs-11%2F11-blue)](#api-coverage)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)
[![Status: unofficial](https://img.shields.io/badge/status-unofficial-orange)](#disclaimer)

> *Tutela* — Latin for guardianship and protection. The name nods both to the
> domain (life & group insurance) and to the SDK's aim: to guard the boundary
> between your code and a remote API with types you can trust.

```ts
import { Effect } from "effect"
import { Tutela } from "@tutela/sdk"

const program = Tutela.eoi
  .submit()
  .policy(Tutela.Brand.GroupPolicyId("GP-00420"))
  .nonce(Tutela.Brand.Nonce("nonce-abc-123"))
  .body(form)
  .send() // only callable once policy + nonce + body are all set
  .pipe(
    Effect.catchTag("PaymentRequired", recover), // Guardian's 402 business error
  )

await Tutela.run(program, {
  baseUrl: "https://api.guardianlife.com",
  tokenUrl: "https://api.guardianlife.com/oauth/client_credential/accesstoken",
  clientId, clientSecret, apiKey,
})
```

## Philosophy

Tutela is built on a few convictions about how an API client should behave.

- **Make illegal states unrepresentable.** Ids are branded (`GroupPolicyId`,
  `PolicyNumber`, `Nonce`…), so a policy number can't be passed where an agreement
  number belongs. Request builders use type-state: a call's `.send()` doesn't
  exist as a callable method until every required field has been supplied.
- **Parse, don't validate.** Responses cross the boundary through `effect/Schema`.
  Data is decoded into known shapes once, at the edge; contract drift surfaces as a
  typed `DecodeError` instead of an `any` that fails three layers deep.
- **Errors are values, not exceptions.** Every call resolves into one closed,
  tagged union (`TutelaError`). Handling them is `catchTag`, checked exhaustively
  by the compiler — including the API's own quirks (HTTP 402 as a business failure,
  422 for validation).
- **Dependencies are explicit.** Configuration, credentials, and the HTTP client are
  provided as Effect `Layer`s. Moving between production, UAT, and internal hosts is
  a change of layer, not a change of code. Secrets stay `Redacted` and never log.
- **Generate the boring, hand-craft the meaningful.** Type definitions for all 11
  APIs are generated from the OpenAPI specs; the ergonomic surface and runtime
  validation are written by hand where they earn their cost (see below).
- **Honest metrics over vanity numbers.** The test and mutation suites aim to verify
  real behavior. Where a mutation is mathematically equivalent and unkillable, it's
  documented as such rather than papered over — see [MUTATION.md](./MUTATION.md).

## Technology

| | |
|---|---|
| **Language** | TypeScript 5.7 (strict, `noUncheckedIndexedAccess`), ESM |
| **Runtime core** | [Effect](https://effect.website) 3.21 — `Schema`, `Layer`/`Context`, `Ref`, `Redacted`, tagged errors |
| **HTTP** | [`@effect/platform`](https://github.com/Effect-TS/effect/tree/main/packages/platform) `HttpClient` (fetch-backed) |
| **Type generation** | [`openapi-typescript`](https://openapi-ts.dev) — OpenAPI 3.0 → `paths`/`components` types |
| **Auth** | OAuth 2.0 client-credentials (Apigee gateway), auto-refreshing JWT bearer |
| **Tests** | dependency-free harness on a mock `HttpClient` layer · [StrykerJS](https://stryker-mutator.io) mutation testing |
| **Tooling** | `tsx`, `pnpm` |

## How it's built: generated types + curated schemas

Covering 11 APIs — several with hundreds of nested schemas — without drowning in
hand-written models comes down to a deliberate split:

1. **Type backbone (all 11 APIs).** `openapi-typescript` generates a `paths` type per
   API into `src/generated/`. A single generic combinator, `api<paths>()`
   (`core/typed.ts`), turns any of them into typed, `Effect`-returning calls — path
   params, query, body, and the success response are all inferred from the generated
   type. Unknown paths, missing path params, and wrong body types don't compile.
2. **Curated runtime validation (where it matters).** For the resources worth extra
   care, a hand-written layer adds `effect/Schema` response decoding and richer
   ergonomics (e.g. the EOI type-state builder). Response *envelopes* are decoded at
   runtime; the large request bodies are typed via the generated types rather than
   re-derived by hand.

Regenerate the backbone whenever the specs change:

```sh
pnpm gen   # specs → src/generated/*.ts
```

`openapi-typescript` is used (rather than an OpenAPI→Effect-Schema generator) because
it consumes the OpenAPI **3.0** specs natively and is widely maintained; hand-writing
the 500-schema specs was never an option.

## API coverage

All 11 Guardian Connect APIs have a named resource on `Tutela`.

| Style | Resources |
|-------|-----------|
| **Curated** — branded ids + runtime `effect/Schema` decode (EOI adds a type-state builder) | `eoi`, `vob`, `benefits`, `retail` |
| **Generic** — typed named methods over the combinator, plus a typed `.call` escape hatch | `policy`, `underwriting`, `groupRatingQuoting`, `dentalProvider`, `gpsIllustration`, `prefill`, `hmb` |

## Project layout

```
src/
├── index.ts              # the Tutela entry point + live Layer wiring
├── core/
│   ├── brand.ts          # branded id constructors
│   ├── errors.ts         # the tagged TutelaError union
│   ├── config.ts         # TutelaConfig service (+ fromEnv)
│   ├── auth.ts           # OAuth2 client-credentials TokenProvider
│   ├── http.ts           # the `request` transport combinator
│   ├── typed.ts          # generic api<paths>() combinator (inference engine)
│   └── request-builder.ts# type-state machinery
├── generated/            # openapi-typescript output, one module per API (11)
├── schema/               # effect/Schema models for curated resources
└── resources/            # the per-API clients
```

## Development

```sh
pnpm install
pnpm gen           # regenerate generated/ from the OpenAPI specs
pnpm typecheck     # tsc, no emit
pnpm test          # mock-HttpClient suite (81 assertions)
pnpm mutation      # StrykerJS over src/core/**
pnpm build         # → dist/
```

Requires Effect `^3.21` and `@effect/platform` `^0.72` (peer dependencies).

## Continuous integration

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on every push and PR
to `main`:

- **build** — `typecheck` → `test` → `build`
- **mutation** — StrykerJS, enforcing the 90% break threshold

The **CI** badge at the top is live — it reflects the latest `main` workflow run via
the GitHub Actions API. The **Mutation score** badge shows the score enforced by the
mutation job's 90% break threshold (the build fails if it drops below).

Optionally, the score can also be published live to the
[Stryker Dashboard](https://dashboard.stryker-mutator.io): add a
`STRYKER_DASHBOARD_API_KEY` repository secret and CI will upload it on each `main`
build (`stryker.conf.json` already carries the `dashboard.project` config). Without
the secret the mutation job still runs and enforces the threshold.

## Disclaimer

Tutela is an **unofficial** client built from publicly published OpenAPI
documentation. It is not affiliated with, endorsed by, or supported by Guardian.

Two things the published specs don't include and that you must supply yourself: the
real OAuth **token URL** (the specs ship a placeholder) and your partner-issued
**client credentials and API key**.

## License

MIT.
