/**
 * Evidence of Insurability (EOI) API — schemas.
 *
 * Modeled from `guardianlife-EOI-1.0.8_4.yaml` (`components/schemas`). The
 * request structure is a faithful subset of `EvidenceOfInsurability`; the
 * response structures (`EOIFormResponse`, `EOIStatusResponse`) match the spec
 * exactly.
 */
import { Schema } from "effect"
import { ErrorResponses, YesNo } from "./common.js"

/** EOI.Gender — enumerated `M | F`. */
export const Gender = Schema.Literal("M", "F")
export type Gender = Schema.Schema.Type<typeof Gender>

/** EOI.PersonalInformation. */
export const PersonalInformation = Schema.Struct({
  FirstName: Schema.String,
  MiddleInitial: Schema.optional(Schema.String),
  LastName: Schema.String,
  DOB: Schema.String, // ISO date, validated server-side
  Gender: Gender,
  Weight: Schema.optional(Schema.Number),
  HeightFeet: Schema.optional(Schema.Number),
  HeightInches: Schema.optional(Schema.Number),
  SocialSecurityNumber: Schema.optional(Schema.String),
})
export type PersonalInformation = Schema.Schema.Type<typeof PersonalInformation>

/** EOI.CoverageDetails. */
export const CoverageDetails = Schema.Struct({
  guarantee_issue_amount: Schema.optional(Schema.Number),
  additional_amount: Schema.optional(Schema.Number),
  conditional_amount: Schema.optional(Schema.Number),
})

/** EOI.Coverage — one elected coverage line. */
export const Coverage = Schema.Struct({
  coverage_name: Schema.String,
  coverage_code: Schema.optional(Schema.String),
  elected_amount: Schema.optional(Schema.Number),
  coverage_details: Schema.optional(CoverageDetails),
})

/** A covered person: their personal info plus elected coverages. */
export const CoveredPerson = Schema.Struct({
  personal_information: PersonalInformation,
  coverages: Schema.optional(Schema.Array(Coverage)),
})

/** EOI.event_details. */
export const EventDetails = Schema.Struct({
  event_type: Schema.optional(Schema.String),
  enrollment_start_date: Schema.optional(Schema.String),
  enrollment_end_date: Schema.optional(Schema.String),
})

/** EOI.EvidenceOfInsurability — the POST request body. */
export const EvidenceOfInsurability = Schema.Struct({
  event_details: Schema.optional(EventDetails),
  employee: CoveredPerson,
  spouse: Schema.optional(CoveredPerson),
  child: Schema.optional(Schema.Array(CoveredPerson)),
})
export type EvidenceOfInsurability = Schema.Schema.Type<typeof EvidenceOfInsurability>

/** EOI.SubmitSuccess. */
export const SubmitSuccess = Schema.Struct({
  web_form_link: Schema.optional(Schema.String),
  transaction_id: Schema.optional(Schema.String),
})

/** EOI.EOIFormResponse — 200/400 body for the submit endpoint. */
export const EOIFormResponse = Schema.Struct({
  eoi_required: Schema.optional(YesNo),
  submit_success: Schema.optional(SubmitSuccess),
  error_responses: Schema.optional(ErrorResponses),
})
export type EOIFormResponse = Schema.Schema.Type<typeof EOIFormResponse>

/** EOI.CoverageStatusDetails / EOICoverageStatus (status endpoint). */
export const CoverageStatus = Schema.Struct({
  coverage_name: Schema.optional(Schema.String),
  coverage_code: Schema.optional(Schema.String),
  coverage_status: Schema.optional(Schema.String),
  coverage_approved_amount: Schema.optional(Schema.Number),
  coverage_effective_date: Schema.optional(Schema.String),
})

export const EOICoverageStatus = Schema.Struct({
  group_policy_id: Schema.optional(Schema.String),
  employee: Schema.optional(Schema.Array(CoverageStatus)),
  spouse: Schema.optional(Schema.Array(CoverageStatus)),
  child: Schema.optional(Schema.Array(CoverageStatus)),
})

/** EOI.EOIStatusResponse — 200 body for the status endpoint. */
export const EOIStatusResponse = Schema.Struct({
  eoi_coverage_status: Schema.optional(EOICoverageStatus),
})
export type EOIStatusResponse = Schema.Schema.Type<typeof EOIStatusResponse>
