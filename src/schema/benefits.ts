/**
 * Benefits API (LDEx) — response schemas.
 *
 * Modeled from `guardianlife-benefits-api-v4_*.yaml`. We decode the small,
 * stable response *envelopes* at runtime (where server-side contract drift
 * actually matters); the large request bodies (`Transmission`, etc.) are typed
 * via the generated `paths` types in the resource.
 */
import { Schema } from "effect"

/** Documented transmission outcomes. */
export const TransmissionStatusCode = Schema.Literal(
  "Success",
  "Failure",
  "Partial",
  "In Progress",
)
export type TransmissionStatusCode = Schema.Schema.Type<typeof TransmissionStatusCode>

/** Benefits.TransmissionResponse — returned by submit & status endpoints. */
export const TransmissionResponse = Schema.Struct({
  TransmissionGUID: Schema.String,
  TransmissionStatusCode: TransmissionStatusCode,
  CreationDateTime: Schema.optional(Schema.String),
})
export type TransmissionResponse = Schema.Schema.Type<typeof TransmissionResponse>

/** Benefits.EnrollmentCompleteResponse. */
export const EnrollmentCompleteResponse = Schema.Struct({
  TransmissionGUID: Schema.String,
  Status: Schema.String,
})
export type EnrollmentCompleteResponse = Schema.Schema.Type<
  typeof EnrollmentCompleteResponse
>
