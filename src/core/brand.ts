/**
 * Branded primitive types.
 *
 * Guardian's APIs traffic in a dozen different "string ids" — master agreement
 * numbers, group policy ids, policy numbers, customer numbers, transaction ids.
 * At runtime they are all `string`; at the type level they must never be
 * interchangeable. We nominally brand each one so the compiler rejects passing
 * a `PolicyNumber` where a `MasterAgreementNumber` is expected — a whole class
 * of integration bugs erased before the code ever runs.
 */
import { Brand } from "effect"

/** A group master agreement number, e.g. `GRP-00420`. */
export type MasterAgreementNumber = string & Brand.Brand<"MasterAgreementNumber">
export const MasterAgreementNumber = Brand.refined<MasterAgreementNumber>(
  (s) => s.length > 0,
  (s) => Brand.error(`MasterAgreementNumber must be non-empty, received "${s}"`),
)

/** A group policy id (the `group_policy_id` path param on EOI). */
export type GroupPolicyId = string & Brand.Brand<"GroupPolicyId">
export const GroupPolicyId = Brand.refined<GroupPolicyId>(
  (s) => s.length > 0,
  (s) => Brand.error(`GroupPolicyId must be non-empty, received "${s}"`),
)

/** An individual policy number (Retail). */
export type PolicyNumber = string & Brand.Brand<"PolicyNumber">
export const PolicyNumber = Brand.nominal<PolicyNumber>()

/** A primary customer number (Retail). */
export type CustomerNumber = string & Brand.Brand<"CustomerNumber">
export const CustomerNumber = Brand.nominal<CustomerNumber>()

/** A transaction id returned by EOI submit; the spec restricts it to digits. */
export type TransactionId = string & Brand.Brand<"TransactionId">
export const TransactionId = Brand.refined<TransactionId>(
  (s) => /^\d+$/.test(s),
  (s) => Brand.error(`TransactionId must be all digits, received "${s}"`),
)

/** A per-request replay nonce (EOI requires a `nonce` query param). */
export type Nonce = string & Brand.Brand<"Nonce">
export const Nonce = Brand.nominal<Nonce>()

/**
 * Convenience: brand a literal at a call-site without ceremony.
 * `brand(MasterAgreementNumber, "GRP-00420")` throws on invalid input —
 * use the smart constructor's `.either`/`.option` variants when you need
 * to handle failure as a value.
 */
export const brand = <A extends Brand.Brand<any>>(
  ctor: Brand.Brand.Constructor<A>,
  value: Brand.Brand.Unbranded<A>,
): A => ctor(value)
