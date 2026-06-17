/**
 * Evidence of Insurability (EOI) resource client.
 *
 * Showcases the type-state submit builder: `.send()` is only callable once the
 * group policy, nonce, and body have all been supplied.
 */
import { Effect, Schema } from "effect"
import type { GroupPolicyId, Nonce } from "../core/brand.js"
import { request, type RequestContext } from "../core/http.js"
import {
  type CarriesProvided,
  ProvidedFields,
  type WhenComplete,
} from "../core/request-builder.js"
import type { TutelaError } from "../core/errors.js"
import * as EOI from "../schema/eoi.js"

type SubmitField = "policy" | "nonce" | "body"
type SubmitRequired = "policy" | "nonce" | "body"

interface SubmitValues {
  policy?: GroupPolicyId
  nonce?: Nonce
  body?: EOI.EvidenceOfInsurability
}

const encodeBody = Schema.encodeSync(EOI.EvidenceOfInsurability)

/**
 * Fluent, type-state request builder for `POST /v3/policies/{id}/employees/eoi`.
 * Each setter widens the phantom `Provided` union; `send()` is gated on all
 * required fields being present.
 */
export class EoiSubmitBuilder<Provided extends SubmitField = never>
  implements CarriesProvided<Provided>
{
  declare readonly [ProvidedFields]?: Provided
  private constructor(private readonly values: SubmitValues) {}

  /** @internal */
  static start(): EoiSubmitBuilder<never> {
    return new EoiSubmitBuilder({})
  }

  policy(id: GroupPolicyId): EoiSubmitBuilder<Provided | "policy"> {
    return new EoiSubmitBuilder({ ...this.values, policy: id }) as EoiSubmitBuilder<
      Provided | "policy"
    >
  }

  nonce(nonce: Nonce): EoiSubmitBuilder<Provided | "nonce"> {
    return new EoiSubmitBuilder({ ...this.values, nonce }) as EoiSubmitBuilder<
      Provided | "nonce"
    >
  }

  body(form: EOI.EvidenceOfInsurability): EoiSubmitBuilder<Provided | "body"> {
    return new EoiSubmitBuilder({ ...this.values, body: form }) as EoiSubmitBuilder<
      Provided | "body"
    >
  }

  send(
    this: WhenComplete<EoiSubmitBuilder<Provided>, SubmitRequired, Provided>,
  ): Effect.Effect<EOI.EOIFormResponse, TutelaError, RequestContext> {
    const self = this as unknown as EoiSubmitBuilder<SubmitRequired>
    const v = self.values
    return request({
      method: "POST",
      path: `/v3/policies/${v.policy}/employees/eoi`,
      query: { nonce: v.nonce as string },
      body: encodeBody(v.body!),
      response: EOI.EOIFormResponse,
    })
  }
}

export interface EoiResource {
  /** Begin a type-state EOI submission. */
  readonly submit: () => EoiSubmitBuilder<never>
  /** Look up the underwriting status of a prior submission. */
  readonly status: (args: {
    readonly policy: GroupPolicyId
    readonly transactionId: string
    readonly source: string
    readonly nonce: Nonce
  }) => Effect.Effect<EOI.EOIStatusResponse, TutelaError, RequestContext>
}

export const eoi: EoiResource = {
  submit: () => EoiSubmitBuilder.start(),
  status: ({ policy, transactionId, source, nonce }) =>
    request({
      method: "GET",
      path: `/v3/policies/${policy}/employees/eoi/${transactionId}/status`,
      query: { source, nonce: nonce as string },
      response: EOI.EOIStatusResponse,
    }),
}
