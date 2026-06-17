/**
 * Group Dental Provider API resource. Generic combinator over generated types.
 */
import { api } from "../core/typed.js"
import type { paths } from "../generated/dentalProvider.js"

const call = api<paths>()

type ReqBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { requestBody: { content: { "application/json": infer B } } }
  ? B
  : never

export const dentalProvider = {
  /** Provider list with locations for the supplied criteria. */
  search: (body: ReqBody<"/api/v2/ppoprovider/dentalprovider", "post">) =>
    call("/api/v2/ppoprovider/dentalprovider", "post", { body }),

  /** Provider search results. */
  searchResult: (body: ReqBody<"/api/v2/ppoprovider/searchresult", "post">) =>
    call("/api/v2/ppoprovider/searchresult", "post", { body }),

  call,
}
