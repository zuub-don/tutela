/**
 * Retail Individual Products API — response schemas.
 *
 * Modeled from `guardianlife-retail-individual-product-apis-*.yaml`. Mutations
 * return the async acknowledgement envelope (`AsyncResponse`, HTTP 202); the
 * enrollment search returns `SearchEnrollmentsResponse`. Request bodies are
 * typed via the generated `paths` types in the resource.
 */
import { Schema } from "effect"

/** Retail.AsyncResponse — 202 acknowledgement for every mutation. */
export const AsyncResponse = Schema.Struct({
  correlationId: Schema.optional(Schema.String),
  primaryCustomerNumber: Schema.optional(Schema.String),
  policyNumber: Schema.optional(Schema.String),
  requestAcceptedDateTime: Schema.optional(Schema.String),
})
export type AsyncResponse = Schema.Schema.Type<typeof AsyncResponse>

/** Retail.SearchEnrollmentsResponse. */
export const SearchEnrollmentsResponse = Schema.Struct({
  primary: Schema.optional(
    Schema.Struct({
      customerNumber: Schema.optional(Schema.String),
      profileInfo: Schema.optional(
        Schema.Struct({
          firstName: Schema.optional(Schema.String),
          lastName: Schema.optional(Schema.String),
        }),
      ),
    }),
  ),
  product: Schema.optional(
    Schema.Struct({
      policyNumber: Schema.optional(Schema.String),
      planCode: Schema.optional(Schema.String),
      coverageEffectiveDate: Schema.optional(Schema.String),
      coverageEndDate: Schema.optional(Schema.String),
    }),
  ),
})
export type SearchEnrollmentsResponse = Schema.Schema.Type<
  typeof SearchEnrollmentsResponse
>
