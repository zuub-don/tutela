# Introduction

**Tutela** is an [Effect](https://effect.website)-native TypeScript SDK for the
**Guardian Connect** insurance APIs.

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

## What you get

- **All 11 Guardian Connect APIs**, each with a named resource on `Tutela`.
- **Compile-time safety**: branded ids, type-state request builders, and an
  exhaustive tagged error channel.
- **Runtime safety where it matters**: responses decoded through `effect/Schema`,
  so contract drift surfaces as a typed error rather than a silent `any`.
- **Batteries-included transport**: an auto-refreshing OAuth client-credentials
  token provider, secrets kept in `Redacted`, and a transparent 401 retry.

Read on for [Getting Started](./getting-started.md), or jump to the
[Design & Philosophy](./design.md) behind it.

> This is an **unofficial** client built from publicly published OpenAPI
> documentation. See the [Disclaimer](./disclaimer.md).
