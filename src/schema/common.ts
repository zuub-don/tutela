/**
 * Shared response/error schemas, modeled from the recurring component shapes
 * across the Guardian specs (`Error`, `ErrorResponses`).
 */
import { Schema } from "effect"

/** A single field-level error, as in EOI's `Error` component. */
export const ApiError = Schema.Struct({
  code: Schema.String,
  field_name: Schema.optional(Schema.String),
  value: Schema.optional(Schema.String),
  message: Schema.String,
})
export type ApiError = Schema.Schema.Type<typeof ApiError>

/** EOI's `ErrorResponses` — a list wrapper. */
export const ErrorResponses = Schema.Struct({
  errors: Schema.optional(Schema.Array(ApiError)),
})
export type ErrorResponses = Schema.Schema.Type<typeof ErrorResponses>

/** A yes/no flag rendered as `"Y" | "N"` throughout Guardian's payloads. */
export const YesNo = Schema.Literal("Y", "N")
export type YesNo = Schema.Schema.Type<typeof YesNo>
