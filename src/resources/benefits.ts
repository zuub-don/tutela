/**
 * Benefits API (LIMRA LDEx) — curated resource.
 *
 * Responses are decoded through `effect/Schema` (runtime contract checking);
 * path ids are branded; the large request bodies are typed via the generated
 * `paths` types. A typed `.call` escape hatch covers the internal/edge endpoints
 * not surfaced as named methods.
 */
import { Schema } from "effect"
import { api } from "../core/typed.js"
import { request } from "../core/http.js"
import type { GroupPolicyId, MasterAgreementNumber } from "../core/brand.js"
import type { paths } from "../generated/benefits.js"
import * as B from "../schema/benefits.js"

const call = api<paths>()
const enc = encodeURIComponent

type ReqBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { requestBody: { content: { "application/json": infer Body } } }
  ? Body
  : never

export const benefits = {
  /** Submit a group benefits transaction; decodes the TransmissionResponse. */
  processTransaction: (
    groupPolicyId: GroupPolicyId,
    body: ReqBody<"/group/benefits/v4/policies/{group-policy-id}/employees", "post">,
  ) =>
    request({
      method: "POST",
      path: `/group/benefits/v4/policies/${enc(groupPolicyId)}/employees`,
      body,
      response: B.TransmissionResponse,
    }),

  /** Poll a submitted transaction by its transmission GUID. */
  transactionStatus: (mag: MasterAgreementNumber, transmissionGuid: string) =>
    request({
      method: "GET",
      path: `/group/benefits/v4/policies/${enc(mag)}/employees/transactionstatus/${enc(transmissionGuid)}`,
      response: B.TransmissionResponse,
    }),

  /** Signal enrollment completion for a policy. */
  enrollmentComplete: (
    mag: MasterAgreementNumber,
    body: ReqBody<
      "/group/benefits/v4/policies/{master-agreement-number}/employees/enrollment-complete",
      "post"
    >,
  ) =>
    request({
      method: "POST",
      path: `/group/benefits/v4/policies/${enc(mag)}/employees/enrollment-complete`,
      body,
      response: B.EnrollmentCompleteResponse,
    }),

  /**
   * Search employees within a policy. Returns the full `Transmission` graph,
   * which we pass through untyped (`Schema.Unknown`) rather than re-deriving.
   */
  searchEmployees: (
    groupPolicyId: GroupPolicyId,
    body: ReqBody<"/group/benefits/v4/policies/{group-policy-id}/employees/search", "post">,
  ) =>
    request({
      method: "POST",
      path: `/group/benefits/v4/policies/${enc(groupPolicyId)}/employees/search`,
      body,
      response: Schema.Unknown,
    }),

  /** Fetch async employee-search results by reference id. */
  searchResults: (groupPolicyId: GroupPolicyId, referenceId: string) =>
    request({
      method: "GET",
      path: `/group/benefits/v4/policies/${enc(groupPolicyId)}/employees/search/results/${enc(referenceId)}`,
      response: Schema.Unknown,
    }),

  /** Fully-typed escape hatch (e.g. the `/internal/...` status endpoint). */
  call,
}
