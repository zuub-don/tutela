/**
 * Group Verification of Benefits (VOB) API — schemas.
 *
 * Modeled from `guardianlife-VOB-API-1.0.0.yaml`. The request (`vobRequest`)
 * is modeled from its components; note the spec leaves the 200 response body
 * *untyped* (empty schema), so `VobResult` is intentionally permissive — a
 * documented contract gap rather than an omission on our side.
 */
import { Schema } from "effect"

/** VOB.member. */
export const Member = Schema.Struct({
  member_id: Schema.optional(Schema.String),
  first_name: Schema.optional(Schema.String),
  last_name: Schema.optional(Schema.String),
  date_of_birth: Schema.optional(Schema.String),
})

/** VOB.patient. */
export const Patient = Schema.Struct({
  first_name: Schema.optional(Schema.String),
  last_name: Schema.optional(Schema.String),
  date_of_birth: Schema.optional(Schema.String),
  relationship: Schema.optional(Schema.String),
})

/** VOB.vobRequest — POST body. */
export const VobRequest = Schema.Struct({
  transaction_type: Schema.optional(Schema.String),
  member: Member,
  patient: Schema.optional(Patient),
  service_date: Schema.optional(Schema.String),
})
export type VobRequest = Schema.Schema.Type<typeof VobRequest>

/**
 * VOB 200 body — untyped in the spec. Kept permissive on purpose; tighten once
 * a real sample response is captured.
 */
export const VobResult = Schema.Record({ key: Schema.String, value: Schema.Unknown })
export type VobResult = Schema.Schema.Type<typeof VobResult>
