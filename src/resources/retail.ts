/**
 * Retail Individual Products API (dental) — curated resource.
 *
 * Mutations decode the async acknowledgement (`AsyncResponse`, 202); the
 * enrollment search decodes `SearchEnrollmentsResponse`. Path ids are branded
 * and every mutation takes a replay `nonce` (query param). Request bodies are
 * typed via the generated `paths` types; `.call` is the escape hatch.
 */
import { Schema } from "effect"
import { api } from "../core/typed.js"
import { request } from "../core/http.js"
import type { CustomerNumber, Nonce, PolicyNumber } from "../core/brand.js"
import type { paths } from "../generated/retail.js"
import * as R from "../schema/retail.js"

const call = api<paths>()
const enc = encodeURIComponent

type ReqBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { requestBody: { content: { "application/json": infer Body } } }
  ? Body
  : never

/** `/v1/customer/{primary-customer-number}/policy/{policy-number}` prefix. */
const policyPath = (customer: CustomerNumber, policy: PolicyNumber): string =>
  `/v1/customer/${enc(customer)}/policy/${enc(policy)}`

export const retail = {
  /** Enroll a new individual customer/policy. */
  createPolicy: (nonce: Nonce, body: ReqBody<"/v1/customer/policy", "post">) =>
    request({
      method: "POST",
      path: "/v1/customer/policy",
      query: { nonce },
      body,
      response: R.AsyncResponse,
    }),

  /** Update an existing customer/policy. */
  updatePolicy: (
    customer: CustomerNumber,
    policy: PolicyNumber,
    nonce: Nonce,
    body: ReqBody<"/v1/customer/{primary-customer-number}/policy/{policy-number}", "put">,
  ) =>
    request({
      method: "PUT",
      path: policyPath(customer, policy),
      query: { nonce },
      body,
      response: R.AsyncResponse,
    }),

  /** Cancel a policy. */
  cancel: (
    customer: CustomerNumber,
    policy: PolicyNumber,
    nonce: Nonce,
    body: ReqBody<
      "/v1/customer/{primary-customer-number}/policy/{policy-number}/cancellation",
      "post"
    >,
  ) =>
    request({
      method: "POST",
      path: `${policyPath(customer, policy)}/cancellation`,
      query: { nonce },
      body,
      response: R.AsyncResponse,
    }),

  /** Reinstate a cancelled policy. */
  reinstate: (
    customer: CustomerNumber,
    policy: PolicyNumber,
    nonce: Nonce,
    body: ReqBody<
      "/v1/customer/{primary-customer-number}/policy/{policy-number}/reinstatement",
      "post"
    >,
  ) =>
    request({
      method: "POST",
      path: `${policyPath(customer, policy)}/reinstatement`,
      query: { nonce },
      body,
      response: R.AsyncResponse,
    }),

  /** Add a dependent to a policy. */
  addDependent: (
    customer: CustomerNumber,
    policy: PolicyNumber,
    nonce: Nonce,
    body: ReqBody<
      "/v1/customer/{primary-customer-number}/policy/{policy-number}/dependent/",
      "post"
    >,
  ) =>
    request({
      method: "POST",
      path: `${policyPath(customer, policy)}/dependent/`,
      query: { nonce },
      body,
      response: R.AsyncResponse,
    }),

  /** Apply a payment to a policy. */
  applyPayment: (
    customer: CustomerNumber,
    policy: PolicyNumber,
    nonce: Nonce,
    body: ReqBody<
      "/v1/customer/{primary-customer-number}/policy/{policy-number}/payment/apply",
      "post"
    >,
  ) =>
    request({
      method: "POST",
      path: `${policyPath(customer, policy)}/payment/apply`,
      query: { nonce },
      body,
      response: R.AsyncResponse,
    }),

  /** Search enrollments; decodes SearchEnrollmentsResponse. */
  listPolicies: (nonce: Nonce, body: ReqBody<"/v1/customer/policies", "post">) =>
    request({
      method: "POST",
      path: "/v1/customer/policies",
      query: { nonce },
      body,
      response: R.SearchEnrollmentsResponse,
    }),

  /** Search dental providers by plan type (untyped passthrough). */
  searchProviders: (planType: string, body: Record<string, unknown>) =>
    request({
      method: "POST",
      path: `/v6/providers/plans/${enc(planType)}/search`,
      body,
      response: Schema.Unknown,
    }),

  /** Fully-typed escape hatch for the remaining operations. */
  call,
}
