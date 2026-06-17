# Authentication

Guardian fronts every API with an Apigee gateway using the **OAuth 2.0
client-credentials** grant. Tutela handles the whole token lifecycle for you.

## How it works

1. On the first call, the SDK requests a token from `tokenUrl` using HTTP Basic
   auth (`clientId:clientSecret`) and `grant_type=client_credentials`.
2. The returned JWT is cached in a `Ref` together with its expiry (minus a small
   skew, so it refreshes shortly *before* it actually expires).
3. Every request carries `Authorization: Bearer <token>` and your `x-api-key`.
4. If a request comes back `401`, the SDK invalidates the cached token, fetches a
   fresh one, and retries the request **once**.

You never write any of this — it lives in the `TokenProvider` layer.

## Secrets stay redacted

`clientSecret` and `apiKey` are stored as Effect `Redacted` values. They are used
when building requests but never appear in logs or stack traces — printing a
`Redacted` yields `<redacted>`.

## Configuration

| Field | Meaning |
|-------|---------|
| `baseUrl` | Apigee gateway origin, e.g. `https://api.guardianlife.com` |
| `tokenUrl` | OAuth client-credentials token endpoint |
| `clientId` / `clientSecret` | Partner-issued credentials |
| `apiKey` | Per-app API key sent on every request |

Provide them once via `Tutela.layer(...)`, `Tutela.run(program, ...)`, or
`Tutela.Config.fromEnv`. Swapping between production, UAT, and internal hosts is
a change of configuration, not a change of code.

> **Failure mode:** if the token endpoint itself fails, calls fail with a typed
> `AuthError` — see [Error Handling](./error-handling.md).
