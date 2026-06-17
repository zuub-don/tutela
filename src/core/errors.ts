/**
 * The exhaustive, tagged error channel for every Tutela call.
 *
 * Guardian's specs ship a different error envelope per API (`Error`,
 * `ErrorResponse`, `ErrorResponses`, `FapErrorMessage`, `IllustrationApiError`,
 * `422ErrorResponse`, ...). We normalize all of them into one discriminated
 * union so callers `Effect.catchTag("PaymentRequired", ...)` instead of
 * pattern-matching on stringly-typed status codes.
 *
 * Two Guardian-specific oddities are first-class here:
 *   - HTTP 402 (Payment Required) is used by Benefits/EOI as a *business*
 *     failure code, so it gets its own `PaymentRequired` tag.
 *   - HTTP 422 (Unprocessable) is the Retail validation path and carries a
 *     structured field-error list.
 */
import { Data } from "effect"

/** A single field-level problem, normalized from the various envelopes. */
export interface FieldError {
  readonly code?: string
  readonly field?: string
  readonly value?: string
  readonly message: string
}

/** 400 — malformed request. */
export class BadRequest extends Data.TaggedError("BadRequest")<{
  readonly message: string
  readonly errors: ReadonlyArray<FieldError>
  readonly requestId?: string
}> {}

/** 401 — invalid/expired token or API key. */
export class Unauthorized extends Data.TaggedError("Unauthorized")<{
  readonly message: string
  readonly requestId?: string
}> {}

/** 402 — Guardian business failure (EOI/Benefits "Request failed"). */
export class PaymentRequired extends Data.TaggedError("PaymentRequired")<{
  readonly message: string
  readonly errors: ReadonlyArray<FieldError>
  readonly requestId?: string
}> {}

/** 404 — no endpoint matched, or no results for the parameters. */
export class NotFound extends Data.TaggedError("NotFound")<{
  readonly message: string
  readonly requestId?: string
}> {}

/** 422 — Retail validation failure. */
export class Unprocessable extends Data.TaggedError("Unprocessable")<{
  readonly message: string
  readonly errors: ReadonlyArray<FieldError>
  readonly requestId?: string
}> {}

/** 429 — gateway throttling. */
export class RateLimited extends Data.TaggedError("RateLimited")<{
  readonly message: string
  readonly retryAfterSeconds?: number
}> {}

/** 5xx — server-side failure. */
export class ServerError extends Data.TaggedError("ServerError")<{
  readonly status: number
  readonly message: string
  readonly requestId?: string
}> {}

/** Network/connection failure before a response was received. */
export class TransportError extends Data.TaggedError("TransportError")<{
  readonly message: string
  readonly cause: unknown
}> {}

/** A 2xx body that failed schema decoding (contract drift). */
export class DecodeError extends Data.TaggedError("DecodeError")<{
  readonly message: string
  readonly cause: unknown
}> {}

/** Failure obtaining an OAuth client-credentials token. */
export class AuthError extends Data.TaggedError("AuthError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

/** The complete, closed set of failures any Tutela effect can produce. */
export type TutelaError =
  | BadRequest
  | Unauthorized
  | PaymentRequired
  | NotFound
  | Unprocessable
  | RateLimited
  | ServerError
  | TransportError
  | DecodeError
  | AuthError
