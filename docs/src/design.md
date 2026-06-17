# Design & Philosophy

Tutela is built on a few convictions about how an API client should behave.

### Make illegal states unrepresentable

Ids are branded — `GroupPolicyId`, `PolicyNumber`, `Nonce`, … — so a policy
number can't be passed where an agreement number belongs, even though both are
`string` at runtime.

Request builders use **type-state**: a call's `.send()` does not exist as a
callable method until every required field has been supplied. The proof is in the
compiler error you get if you try too early:

```text
Tutela: cannot send — missing required field(s): nonce | body
```

### Parse, don't validate

Responses cross the boundary through `effect/Schema`. Data is decoded into known
shapes once, at the edge; contract drift surfaces as a typed `DecodeError`
instead of an `any` that fails three layers deep.

### Errors are values, not exceptions

Every call resolves into one closed, tagged union (`TutelaError`). Handling is
`catchTag`, checked exhaustively by the compiler — including the API's own quirks
(402 as a business failure, 422 for validation). See [Error Handling](./error-handling.md).

### Dependencies are explicit

Configuration, credentials, and the HTTP client are provided as Effect `Layer`s.
Moving between production, UAT, and internal hosts is a change of layer, not a
change of code. Secrets stay `Redacted` and never log.

### Generate the boring, hand-craft the meaningful

Type definitions for all 11 APIs are generated from the OpenAPI specs; the
ergonomic surface and runtime validation are hand-written where they earn their
cost. The mechanics are in [How It's Built](./architecture.md).

### Honest metrics over vanity numbers

The test and mutation suites verify real behavior. Where a mutation is
mathematically equivalent and unkillable, it is documented as such rather than
papered over. See [Testing & Mutation Score](./testing.md).
