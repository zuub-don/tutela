# Error Handling

Every Tutela call resolves into one closed, tagged union — `TutelaError`. There
are no thrown exceptions to catch; failures are values in the Effect error
channel, handled with `Effect.catchTag` and checked exhaustively by the compiler.

## The error union

| Tag | When |
|-----|------|
| `BadRequest` | HTTP 400 — malformed request |
| `Unauthorized` | HTTP 401 — invalid/expired token or API key |
| `PaymentRequired` | HTTP 402 — Guardian **business** failure (EOI/Benefits) |
| `NotFound` | HTTP 404 |
| `Unprocessable` | HTTP 422 — Retail validation failure |
| `RateLimited` | HTTP 429 — carries `retryAfterSeconds` |
| `ServerError` | HTTP 5xx — carries `status` |
| `TransportError` | network failure before a response |
| `DecodeError` | a 2xx body that didn't match the schema (contract drift) |
| `AuthError` | failure obtaining a client-credentials token |

Two of these encode Guardian-specific quirks: **402 is a business failure**
(not "payment required" in the literal sense), and **422** is the Retail
validation path. Both carry a normalized list of field-level errors.

## Handling them

```ts
program.pipe(
  Effect.catchTag("PaymentRequired", (e) => {
    // e.errors: ReadonlyArray<{ code?, field?, value?, message }>
    return recover(e)
  }),
  Effect.catchTag("Unauthorized", () => Effect.die("check credentials")),
  Effect.catchTag("RateLimited", (e) => retryAfter(e.retryAfterSeconds)),
)
```

Because the union is closed, the compiler knows exactly which tags remain after
each `catchTag` — you can't forget one, and you can't catch one that can't occur.

## Contract drift is a typed failure

Curated resources decode responses through `effect/Schema`. If the server returns
a value outside the agreed contract — say a status enum that isn't one of the
documented values — the call fails with a `DecodeError` rather than handing you a
plausible-but-wrong object. This turns silent integration breakage into a loud,
typed signal.
