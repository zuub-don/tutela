/**
 * eSuite Prefill API resource. Generic combinator over generated types.
 */
import { api } from "../core/typed.js"
import type { paths } from "../generated/prefill.js"

const call = api<paths>()

type ReqBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { requestBody: { content: { "application/json": infer B } } }
  ? B
  : never

export const prefill = {
  /** Submit prefill information for a life/disability application. */
  submit: (body: ReqBody<"/api/v1/applicationprefillinformation", "post">) =>
    call("/api/v1/applicationprefillinformation", "post", { body }),

  /** Look up prefill information by applicant details. */
  find: (query: {
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    agentWritingCode?: string
  }) => call("/api/v1/applicationprefillinformation", "get", { query }),

  /** Retrieve a stored prefill record by id. */
  getById: (applicationPrefillInformationId: string) =>
    call("/api/v1/applicationprefillinformation/{applicationPrefillInformationId}", "get", {
      path: { applicationPrefillInformationId },
    }),

  call,
}
