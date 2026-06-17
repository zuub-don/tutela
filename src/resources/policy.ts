/**
 * Policy API resource client.
 *
 * Built entirely on the generic {@link api} combinator over the generated
 * `paths` type — no hand-written schemas. Demonstrates how the remaining 9
 * Guardian APIs come online with a few lines each, fully typed end to end.
 */
import { api } from "../core/typed.js"
import type { MasterAgreementNumber } from "../core/brand.js"
import type { components, paths } from "../generated/policy.js"

const call = api<paths>()

type Schemas = components["schemas"]

export const policy = {
  /** Comprehensive plan/coverage/rate details for a group policy. */
  specs: (mag: MasterAgreementNumber) =>
    call("/v4/policies/{master-agreement-number}/policyspecs", "get", {
      path: { "master-agreement-number": mag },
    }),

  /** Current compute status for a group policy. */
  computeStatus: (mag: MasterAgreementNumber) =>
    call("/v4/policies/{master-agreement-number}/computestatus", "get", {
      path: { "master-agreement-number": mag },
    }),

  /** Bill-group breakdown for a group policy. */
  billGroup: (mag: MasterAgreementNumber) =>
    call("/v4/policies/{master-agreement-number}/billgroup", "get", {
      path: { "master-agreement-number": mag },
    }),

  /** Search policies by tax id. */
  search: (
    body: Schemas["Taxid"],
    query?: { max_records_to_return?: string; record_offset?: string },
  ) => call("/v4/policies/search", "post", { body, query }),
}
