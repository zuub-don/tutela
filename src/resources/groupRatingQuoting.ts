/**
 * Group Rating & Quoting API resource. Generic combinator over generated types.
 */
import { api } from "../core/typed.js"
import type { paths } from "../generated/groupRatingQuoting.js"

const call = api<paths>()

type ReqBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { requestBody: { content: { "application/json": infer B } } }
  ? B
  : never

export const groupRatingQuoting = {
  /** Request a new quote. */
  requestQuote: (body: ReqBody<"/v1/quotes/requestquote", "post">) =>
    call("/v1/quotes/requestquote", "post", { body }),

  /** Update an in-flight quote by RFP uid. */
  updateQuote: (
    rfpUid: string,
    body: ReqBody<"/v1/quotes/requestquote/{rfp-uid}", "put">,
  ) =>
    call("/v1/quotes/requestquote/{rfp-uid}", "put", {
      path: { "rfp-uid": rfpUid },
      body,
    }),

  /** Retrieve a quote. */
  retrieveQuote: (body: ReqBody<"/v1/quotes/retrievequote", "post">) =>
    call("/v1/quotes/retrievequote", "post", { body }),

  /** Retrieve the generated proposal PDF. */
  retrievePdf: (body: ReqBody<"/v1/quotes/retrievepdf", "post">) =>
    call("/v1/quotes/retrievepdf", "post", { body }),

  /** Case history for a company. */
  caseHistory: (companyPartyId: string) =>
    call("/v1/quotes/casehistory/{companyPartyId}", "get", {
      path: { companyPartyId },
    }),

  /** Quote-ready notification callback. */
  quoteNotification: (body: ReqBody<"/v1/quotes/quotenotification", "post">) =>
    call("/v1/quotes/quotenotification", "post", { body }),

  /** Fully-typed escape hatch. */
  call,
}
