/**
 * Underwriting Data Service resource client (26 operations).
 *
 * The richest Guardian API — MVR, MIB, IRIX, FacExchange, LabPIQ, InstantID,
 * credit, existing-insurance. Built on the generic {@link api} combinator; a
 * curated subset is surfaced as named methods, and `.call` is the fully-typed
 * escape hatch for the rest.
 */
import { api } from "../core/typed.js"
import type { paths } from "../generated/underwriting.js"

const call = api<paths>()

/** Inferred JSON request body for a `(path, method)` pair. */
type ReqBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { requestBody: { content: { "application/json": infer B } } }
  ? B
  : never

export const underwriting = {
  /** Health-check monitoring endpoint. */
  health: () => call("/v1/apphealth/", "get"),

  /** Retrieve an underwriting record by id. */
  getById: (uwDataId: number) =>
    call("/v1/uwdata/{uwDataId}", "get", { path: { uwDataId } }),

  /** Create an underwriting record. */
  create: (body: ReqBody<"/v1/uwdata/", "post">) =>
    call("/v1/uwdata/", "post", { body }),

  /** Motor Vehicle Record inquiry. */
  mvrInquiry: (body: ReqBody<"/v1/uwdata/mvr/mvr-inquiry", "post">) =>
    call("/v1/uwdata/mvr/mvr-inquiry", "post", { body }),

  /** MIB inquiry. */
  mibInquiry: (body: ReqBody<"/v1/uwdata/mib/mibinquiry", "post">) =>
    call("/v1/uwdata/mib/mibinquiry", "post", { body }),

  /** InstantID consumer verification. */
  instantIdValidate: (body: ReqBody<"/v1/uwdata/instantid/validate", "post">) =>
    call("/v1/uwdata/instantid/validate", "post", { body }),

  /** Fully-typed escape hatch for any of the 26 UW operations. */
  call,
}
