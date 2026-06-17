# Resources & API Coverage

All 11 Guardian Connect APIs have a named resource on the `Tutela` object. They
come in two styles.

## Curated resources

`eoi`, `vob`, `benefits`, `retail`.

Curated resources add **branded ids** and decode responses through
`effect/Schema` at runtime, so a malformed or drifted response surfaces as a
typed `DecodeError` instead of propagating as `any`. EOI additionally exposes a
**type-state builder** (see [Design](./design.md)).

```ts
// runtime-validated response; branded path id
const status = yield* Tutela.benefits.transactionStatus(
  Tutela.Brand.MasterAgreementNumber("00000420"),
  transmissionGuid,
)
status.TransmissionStatusCode // "Success" | "Failure" | "Partial" | "In Progress"
```

## Generic resources

`policy`, `underwriting`, `groupRatingQuoting`, `dentalProvider`,
`gpsIllustration`, `prefill`, `hmb`.

Generic resources expose typed named methods built over a single generic
combinator that infers path params, query, body, and the success response from
the generated OpenAPI types. Each also carries a fully-typed `.call` escape hatch
for any operation not surfaced as a named method.

```ts
// named method
yield* Tutela.underwriting.mvrInquiry(body)

// escape hatch — any of the 26 UW operations, fully typed
yield* Tutela.underwriting.call("/v1/uwdata/{uwDataId}", "get", {
  path: { uwDataId: 42 },
})
```

## The catalog

| API | Resource | Style |
|-----|----------|-------|
| Evidence of Insurability | `eoi` | curated (type-state builder) |
| Verification of Benefits | `vob` | curated |
| Benefits (LDEx) | `benefits` | curated |
| Retail Individual Products | `retail` | curated |
| Policy | `policy` | generic |
| Underwriting Data Service | `underwriting` | generic (26 ops) |
| Group Rating & Quoting | `groupRatingQuoting` | generic |
| Group Dental Provider | `dentalProvider` | generic |
| GPS Illustration | `gpsIllustration` | generic |
| eSuite Prefill | `prefill` | generic |
| HMB Membership | `hmb` | generic |

The split — and why it exists — is covered in [How It's Built](./architecture.md).
