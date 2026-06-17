/**
 * Configuration as an Effect service.
 *
 * The specs do NOT contain authoritative base URLs or a real token endpoint
 * (`tokenUrl` is the placeholder `http://example.com/oauth/token`), and every
 * environment needs its own partner-issued client credentials. So all of that
 * is supplied here as a `Context` service rather than hard-coded — which makes
 * the public-vs-internal-host problem (UW/HMB live on `*.aws.glic.com`) just a
 * matter of which `Layer` you provide.
 */
import { Config, Context, Layer, Redacted } from "effect"

export interface TutelaConfigService {
  /** Apigee gateway origin, e.g. `https://api.guardianlife.com`. */
  readonly baseUrl: string
  /** OAuth 2.0 client-credentials token endpoint (Apigee). */
  readonly tokenUrl: string
  readonly clientId: string
  readonly clientSecret: Redacted.Redacted<string>
  /** Per-app API key sent on every request alongside the bearer token. */
  readonly apiKey: Redacted.Redacted<string>
}

export class TutelaConfig extends Context.Tag("@tutela/Config")<
  TutelaConfig,
  TutelaConfigService
>() {}

export interface TutelaConfigInput {
  readonly baseUrl: string
  readonly tokenUrl: string
  readonly clientId: string
  readonly clientSecret: string
  readonly apiKey: string
}

/** Build a config layer from plain values. */
export const layer = (input: TutelaConfigInput): Layer.Layer<TutelaConfig> =>
  Layer.succeed(TutelaConfig, {
    baseUrl: input.baseUrl.replace(/\/+$/, ""),
    tokenUrl: input.tokenUrl,
    clientId: input.clientId,
    clientSecret: Redacted.make(input.clientSecret),
    apiKey: Redacted.make(input.apiKey),
  })

/**
 * Build a config layer from the environment:
 *   TUTELA_BASE_URL, TUTELA_TOKEN_URL, TUTELA_CLIENT_ID,
 *   TUTELA_CLIENT_SECRET, TUTELA_API_KEY
 */
export const fromEnv: Layer.Layer<TutelaConfig, ConfigError> = Layer.effect(
  TutelaConfig,
  Config.all({
    baseUrl: Config.string("TUTELA_BASE_URL"),
    tokenUrl: Config.string("TUTELA_TOKEN_URL"),
    clientId: Config.string("TUTELA_CLIENT_ID"),
    clientSecret: Config.redacted("TUTELA_CLIENT_SECRET"),
    apiKey: Config.redacted("TUTELA_API_KEY"),
  }).pipe(
    Config.map((c) => ({ ...c, baseUrl: c.baseUrl.replace(/\/+$/, "") })),
  ),
)

// Re-export the Config error type for ergonomic signatures.
import type { ConfigError } from "effect/ConfigError"
export type { ConfigError }
