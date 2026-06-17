/**
 * The transport core: one `request` combinator every resource is built on.
 *
 * Responsibilities:
 *   - attach the bearer token (from {@link TokenProvider}) and the per-app
 *     `x-api-key` to every call;
 *   - decode 2xx bodies through the operation's `Schema` (contract-checked);
 *   - normalize non-2xx status codes into the tagged {@link TutelaError} union,
 *     lifting Guardian's various error envelopes into a uniform shape;
 *   - transparently refresh the token and retry once on a 401.
 */
import { Headers, HttpClient, HttpClientRequest } from "@effect/platform"
import { Effect, Redacted, Schema } from "effect"
import { TutelaConfig } from "./config.js"
import { TokenProvider } from "./auth.js"
import {
  BadRequest,
  DecodeError,
  type FieldError,
  NotFound,
  PaymentRequired,
  RateLimited,
  ServerError,
  TransportError,
  type TutelaError,
  Unauthorized,
  Unprocessable,
} from "./errors.js"

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface RequestSpec<A, I> {
  readonly method: Method
  /** Path relative to the configured `baseUrl`, beginning with `/`. */
  readonly path: string
  /** Query parameters; `undefined` values are dropped. */
  readonly query?: Record<string, string | undefined>
  /** JSON request body (already encoded to plain data). */
  readonly body?: unknown
  /** Schema used to decode a 2xx response body. */
  readonly response: Schema.Schema<A, I>
}

export type RequestContext =
  | TutelaConfig
  | TokenProvider
  | HttpClient.HttpClient

// A deliberately permissive view over the many error envelopes Guardian ships.
const ErrorEnvelope = Schema.Struct({
  message: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
  error_description: Schema.optional(Schema.String),
  code: Schema.optional(Schema.Union(Schema.String, Schema.Number)),
  errors: Schema.optional(
    Schema.Array(
      Schema.Struct({
        code: Schema.optional(Schema.Union(Schema.String, Schema.Number)),
        field: Schema.optional(Schema.String),
        field_name: Schema.optional(Schema.String),
        value: Schema.optional(Schema.String),
        message: Schema.optional(Schema.String),
      }),
    ),
  ),
})

const decodeEnvelope = Schema.decodeUnknownOption(ErrorEnvelope)

const requestId = (headers: Headers.Headers): string | undefined =>
  Headers.get(headers, "x-request-id").pipe(
    (o) =>
      o._tag === "Some"
        ? o.value
        : Headers.get(headers, "x-correlation-id").pipe((c) =>
            c._tag === "Some" ? c.value : undefined,
          ),
  )

const toFieldErrors = (
  body: unknown,
): { message: string; errors: ReadonlyArray<FieldError> } => {
  const parsed = decodeEnvelope(body)
  if (parsed._tag === "None") {
    return { message: "Request failed", errors: [] }
  }
  const env = parsed.value
  const message =
    env.message ?? env.error_description ?? env.error ?? "Request failed"
  const errors: ReadonlyArray<FieldError> = (env.errors ?? []).map((e) => ({
    code: e.code === undefined ? undefined : String(e.code),
    field: e.field ?? e.field_name,
    value: e.value,
    message: e.message ?? message,
  }))
  return { message, errors }
}

const construct = (method: Method, url: string): HttpClientRequest.HttpClientRequest => {
  switch (method) {
    case "GET":
      return HttpClientRequest.get(url)
    case "POST":
      return HttpClientRequest.post(url)
    case "PUT":
      return HttpClientRequest.put(url)
    case "PATCH":
      return HttpClientRequest.patch(url)
    case "DELETE":
      return HttpClientRequest.del(url)
  }
}

/**
 * Execute a typed request. The error channel is the full {@link TutelaError}
 * union; success is the decoded `A`.
 */
export const request = <A, I>(
  spec: RequestSpec<A, I>,
): Effect.Effect<A, TutelaError, RequestContext> => {
  const once = Effect.scoped(Effect.gen(function* () {
    const config = yield* TutelaConfig
    const tokens = yield* TokenProvider
    const client = yield* HttpClient.HttpClient
    const token = yield* tokens.accessToken

    const cleanQuery = Object.fromEntries(
      Object.entries(spec.query ?? {}).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    )

    let httpReq = construct(spec.method, `${config.baseUrl}${spec.path}`).pipe(
      HttpClientRequest.setHeaders({
        Authorization: `Bearer ${Redacted.value(token)}`,
        "x-api-key": Redacted.value(config.apiKey),
        Accept: "application/json",
      }),
      HttpClientRequest.setUrlParams(cleanQuery),
    )
    if (spec.body !== undefined) {
      httpReq = HttpClientRequest.bodyUnsafeJson(httpReq, spec.body)
    }

    const response = yield* client.execute(httpReq).pipe(
      Effect.mapError(
        (cause): TutelaError =>
          new TransportError({
            message: "HTTP transport failure",
            cause,
          }),
      ),
    )

    const status = response.status
    const rid = requestId(response.headers)

    if (status >= 200 && status < 300) {
      const body =
        status === 204
          ? {}
          : yield* response.json.pipe(
              Effect.mapError(
                (cause): TutelaError =>
                  new TransportError({ message: "Failed reading body", cause }),
              ),
            )
      return yield* Schema.decodeUnknown(spec.response)(body).pipe(
        Effect.mapError(
          (cause): TutelaError =>
            new DecodeError({
              message: "Response body did not match the expected schema",
              cause,
            }),
        ),
      )
    }

    const raw = yield* response.json.pipe(Effect.orElseSucceed(() => ({})))
    const { message, errors } = toFieldErrors(raw)

    switch (status) {
      case 400:
        return yield* Effect.fail(new BadRequest({ message, errors, requestId: rid }))
      case 401:
        return yield* Effect.fail(new Unauthorized({ message, requestId: rid }))
      case 402:
        return yield* Effect.fail(new PaymentRequired({ message, errors, requestId: rid }))
      case 404:
        return yield* Effect.fail(new NotFound({ message, requestId: rid }))
      case 422:
        return yield* Effect.fail(new Unprocessable({ message, errors, requestId: rid }))
      case 429: {
        const ra = Headers.get(response.headers, "retry-after")
        return yield* Effect.fail(
          new RateLimited({
            message,
            retryAfterSeconds: ra._tag === "Some" ? Number(ra.value) : undefined,
          }),
        )
      }
      default:
        return yield* Effect.fail(new ServerError({ status, message, requestId: rid }))
    }
  }))

  // Refresh-and-retry once on a stale token.
  return once.pipe(
    Effect.catchTag("Unauthorized", (err) =>
      Effect.flatMap(TokenProvider, (t) => t.invalidate).pipe(
        Effect.zipRight(once),
        Effect.catchTag("Unauthorized", () => Effect.fail(err)),
      ),
    ),
  )
}
