# How It's Built

Covering 11 APIs — several with hundreds of nested schemas — without drowning in
hand-written models comes down to a deliberate two-layer split.

## 1. Type backbone (all 11 APIs)

[`openapi-typescript`](https://openapi-ts.dev) generates a `paths`/`components`
type module per API into `src/generated/`. A single generic combinator,
`api<paths>()` (`core/typed.ts`), turns any of them into typed,
`Effect`-returning calls: path params, query, body, and the success response are
all **inferred from the generated type**. Unknown paths, missing path params, and
wrong body types don't compile.

```ts
const call = api<paths>()
call("/v4/policies/{master-agreement-number}/policyspecs", "get", {
  path: { "master-agreement-number": mag },
}) // Effect<Transmission, TutelaError, RequestContext>
```

Regenerate the backbone whenever the specs change:

```sh
pnpm gen   # specs → src/generated/*.ts
```

## 2. Curated runtime validation (where it matters)

For the resources worth extra care, a hand-written layer adds `effect/Schema`
response decoding and richer ergonomics (e.g. the EOI type-state builder).
Response *envelopes* are decoded at runtime; the large request bodies are typed
via the generated types rather than re-derived by hand.

## Why this route

`openapi-typescript` consumes the OpenAPI **3.0** specs natively and is widely
maintained. The alternatives didn't fit:

- `openapi-to-effect` is OpenAPI 3.1-only and targets the deprecated
  `@effect/schema`.
- Hand-writing the 500-schema specs was never an option.

## Project layout

```text
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
