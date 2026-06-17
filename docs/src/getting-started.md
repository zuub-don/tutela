# Getting Started

## Install

```sh
pnpm add @tutela/sdk effect @effect/platform
```

`effect` and `@effect/platform` are peer dependencies — you bring your own
(shared) copy so the SDK composes with the rest of your Effect application.

Requires **Node ≥ 18** and an ESM project (`"type": "module"`).

## A first call

Every resource method returns an `Effect`. Provide the runtime once — with your
base URL, token URL, and partner credentials — and run it:

```ts
import { Effect } from "effect"
import { Tutela } from "@tutela/sdk"

const verify = Tutela.vob.verify({
  member: { member_id: "M-001", first_name: "Ada", last_name: "Lovelace" },
})

const result = await Tutela.run(verify, {
  baseUrl: "https://api.guardianlife.com",
  tokenUrl: "https://api.guardianlife.com/oauth/client_credential/accesstoken",
  clientId: process.env.GUARDIAN_CLIENT_ID!,
  clientSecret: process.env.GUARDIAN_CLIENT_SECRET!,
  apiKey: process.env.GUARDIAN_API_KEY!,
})
```

## Composing with your own Effect app

`Tutela.run` is a convenience. In a larger Effect application, provide the layer
yourself and keep the program as a value:

```ts
import { Effect } from "effect"
import { Tutela } from "@tutela/sdk"

const layer = Tutela.layer({ baseUrl, tokenUrl, clientId, clientSecret, apiKey })

const program = Effect.gen(function* () {
  const policy = yield* Tutela.policy.specs(mag)
  const vob = yield* Tutela.vob.verify({ member })
  return { policy, vob }
})

await Effect.runPromise(Effect.provide(program, layer))
```

You can also build the config from the environment with `Tutela.Config.fromEnv`
(reads `TUTELA_BASE_URL`, `TUTELA_TOKEN_URL`, `TUTELA_CLIENT_ID`,
`TUTELA_CLIENT_SECRET`, `TUTELA_API_KEY`).

## What you must supply

The published OpenAPI specs do **not** include two things you'll need:

1. The real OAuth **token URL** (the specs ship a placeholder).
2. Your partner-issued **client credentials and API key**.

Base URLs are inferred from the specs where present; otherwise pass `baseUrl`
explicitly per the environment you're targeting.
