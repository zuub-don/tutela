/**
 * GPS Illustration API resource. Generic combinator over generated types.
 */
import { api } from "../core/typed.js"
import type { paths } from "../generated/gpsIllustration.js"

const call = api<paths>()

type ReqBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { requestBody: { content: { "application/json": infer B } } }
  ? B
  : never

export const gpsIllustration = {
  /** Generate a life-product illustration. */
  illustrate: (body: ReqBody<"/v1/illustration", "post">) =>
    call("/v1/illustration", "post", { body }),

  call,
}
