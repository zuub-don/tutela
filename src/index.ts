/**
 * Tutela — an elite, Effect-native TypeScript SDK for the Guardian Connect
 * insurance APIs (unofficial).
 *
 *   import { Tutela } from "@tutela/sdk"
 *
 *   const program = Tutela.eoi
 *     .submit()
 *     .policy(Tutela.Brand.GroupPolicyId("GP-001"))
 *     .nonce(Tutela.Brand.Nonce(crypto.randomUUID()))
 *     .body(form)
 *     .send()                                   // ← only callable once complete
 *     .pipe(Effect.catchTag("PaymentRequired", recover))
 *
 *   await Tutela.run(program, {
 *     baseUrl: "https://api.guardianlife.com",
 *     tokenUrl: "https://api.guardianlife.com/oauth/client_credential/accesstoken",
 *     clientId, clientSecret, apiKey,
 *   })
 */
import { FetchHttpClient } from "@effect/platform"
import { Effect, Layer } from "effect"
import * as ConfigModule from "./core/config.js"
import { TutelaConfig } from "./core/config.js"
import { layer as TokenProviderLayer } from "./core/auth.js"
import type { RequestContext } from "./core/http.js"
import { benefits } from "./resources/benefits.js"
import { dentalProvider } from "./resources/dentalProvider.js"
import { eoi } from "./resources/eoi.js"
import { gpsIllustration } from "./resources/gpsIllustration.js"
import { groupRatingQuoting } from "./resources/groupRatingQuoting.js"
import { hmb } from "./resources/hmb.js"
import { policy } from "./resources/policy.js"
import { prefill } from "./resources/prefill.js"
import { retail } from "./resources/retail.js"
import { underwriting } from "./resources/underwriting.js"
import { vob } from "./resources/vob.js"
import * as BenefitsSchema from "./schema/benefits.js"
import * as CommonSchema from "./schema/common.js"
import * as EOISchema from "./schema/eoi.js"
import * as RetailSchema from "./schema/retail.js"
import * as VOBSchema from "./schema/vob.js"

import * as Brand from "./core/brand.js"
import * as Errors from "./core/errors.js"

export { TutelaConfig } from "./core/config.js"
export type { TutelaError } from "./core/errors.js"
export type { RequestContext } from "./core/http.js"
export { Brand, Errors }

/**
 * The fully-wired live runtime layer: config + a `fetch`-backed HttpClient +
 * the auto-refreshing client-credentials token provider.
 */
export const layer = (
  input: ConfigModule.TutelaConfigInput,
): Layer.Layer<RequestContext> => {
  const configLive = ConfigModule.layer(input)
  const httpLive = FetchHttpClient.layer
  const tokenLive = TokenProviderLayer.pipe(
    Layer.provide(Layer.merge(httpLive, configLive)),
  )
  return Layer.mergeAll(configLive, httpLive, tokenLive)
}

/** Run a Tutela program to a Promise with a live runtime built from `input`. */
export const run = <A, E>(
  effect: Effect.Effect<A, E, RequestContext>,
  input: ConfigModule.TutelaConfigInput,
): Promise<A> => Effect.runPromise(Effect.provide(effect, layer(input)))

/**
 * The single fluent entry point. Resources return `Effect`s requiring
 * {@link RequestContext}; provide it once via {@link layer}/{@link run}.
 */
export const Tutela = {
  // Curated resources (effect/Schema validation + ergonomic builders)
  eoi,
  vob,
  benefits,
  retail,
  // Generic resources (named methods over the typed combinator)
  policy,
  underwriting,
  groupRatingQuoting,
  dentalProvider,
  gpsIllustration,
  hmb,
  prefill,
  layer,
  run,
  Config: ConfigModule,
  /** Branded id constructors (`GroupPolicyId`, `Nonce`, ...). */
  Brand,
  /** The tagged error union and its members. */
  Errors,
  /** All decoded/encoded domain schemas, grouped by API. */
  Schema: {
    Common: CommonSchema,
    EOI: EOISchema,
    VOB: VOBSchema,
    Benefits: BenefitsSchema,
    Retail: RetailSchema,
  },
} as const

export type Tutela = typeof Tutela
export { TutelaConfig as TutelaConfigTag }
