/**
 * Group Verification of Benefits (VOB) resource client.
 * A single endpoint — modeled as a plain typed call.
 */
import { Effect, Schema } from "effect"
import { request, type RequestContext } from "../core/http.js"
import type { TutelaError } from "../core/errors.js"
import * as VOB from "../schema/vob.js"

const encodeRequest = Schema.encodeSync(VOB.VobRequest)

export interface VobResource {
  /** Real-time dental benefits verification (`POST /v1/vob`). */
  readonly verify: (
    body: VOB.VobRequest,
  ) => Effect.Effect<VOB.VobResult, TutelaError, RequestContext>
}

export const vob: VobResource = {
  verify: (body) =>
    request({
      method: "POST",
      path: "/v1/vob",
      body: encodeRequest(body),
      response: VOB.VobResult,
    }),
}
