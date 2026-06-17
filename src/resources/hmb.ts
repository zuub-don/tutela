/**
 * HMB membership API resource.
 *
 * HMB's spec does not declare its path parameters (the generated type shows
 * `path?: never`), so the generic combinator can't carry them. We drop to the
 * lower-level `request` combinator and build the URLs by hand, while still
 * deriving response types from the generated spec.
 */
import { Schema } from "effect"
import type { Effect } from "effect"
import { api } from "../core/typed.js"
import { request, type RequestContext } from "../core/http.js"
import type { TutelaError } from "../core/errors.js"
import type { paths } from "../generated/hmb.js"

const call = api<paths>()

type Ok<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends {
  responses: { 200: { content: { "application/json": infer B } } }
}
  ? B
  : unknown

type ReqBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { requestBody: { content: { "application/json": infer B } } }
  ? B
  : never

const getRaw = <A>(path: string): Effect.Effect<A, TutelaError, RequestContext> =>
  request({ method: "GET", path, response: Schema.Unknown }) as unknown as Effect.Effect<
    A,
    TutelaError,
    RequestContext
  >

const enc = encodeURIComponent

export const hmb = {
  /** Create membership information (path-free, so it uses the typed combinator). */
  createMembership: (body: ReqBody<"/membershipinfo", "post">) =>
    call("/membershipinfo", "post", { body }),

  /** All members matching a first/last name. */
  members: (firstName: string, lastName: string) =>
    getRaw<Ok<"/members/{member_first_nm}/{member_last_nm}", "get">>(
      `/members/${enc(firstName)}/${enc(lastName)}`,
    ),

  /** Earnings for a member. */
  earningsByMember: (memberId: string) =>
    getRaw<Ok<"/membershipearningsinfo/{memberId}", "get">>(
      `/membershipearningsinfo/${enc(memberId)}`,
    ),

  /** A specific earning record. */
  earning: (earningId: string) =>
    getRaw<Ok<"/membershipearninginfo/{earning_id}", "get">>(
      `/membershipearninginfo/${enc(earningId)}`,
    ),

  /** Earnings by unified party id. */
  earningsByUpi: (unifiedPartyId: string) =>
    getRaw<Ok<"/membershipearningsinfobyupi/{unfd_prty_id}", "get">>(
      `/membershipearningsinfobyupi/${enc(unifiedPartyId)}`,
    ),
}
