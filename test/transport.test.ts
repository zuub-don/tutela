/**
 * Integration tests for the Tutela transport + resources, against a mock
 * HttpClient layer. Drives every status-code mapping, retry behavior, decode
 * path, and the auth token lifecycle.
 */
import { HttpClient, HttpClientError, HttpClientResponse, Headers } from "@effect/platform"
import { Effect, Layer, ManagedRuntime, Option, Schema } from "effect"
import * as ConfigModule from "../src/core/config.js"
import { layer as TokenProviderLayer } from "../src/core/auth.js"
import { request, type RequestContext } from "../src/core/http.js"
import { Tutela } from "../src/index.js"
import type { Harness } from "./harness.js"

interface MockState {
  tokenCalls: number
  policyspecsCalls: number
  seen: Array<{
    method: string
    path: string
    search: string
    auth?: string
    apiKey?: string
    bodyTag?: string
    accept?: string
    contentType?: string
  }>
}

interface MockOpts {
  tokenStatus?: number
  tokenExpiresIn?: number
  omitExpiresIn?: boolean
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  })

const errEnvelope = {
  message: "boom",
  errors: [{ code: "101", field_name: "weight", message: "numbers only" }],
}

const makeMock = (opts: MockOpts = {}) => {
  const state: MockState = { tokenCalls: 0, policyspecsCalls: 0, seen: [] }
  const client = HttpClient.make((req, url) => {
    const path = url.pathname
    state.seen.push({
      method: req.method,
      path,
      search: url.search,
      auth: Option.getOrUndefined(Headers.get(req.headers, "authorization")),
      apiKey: Option.getOrUndefined(Headers.get(req.headers, "x-api-key")),
      bodyTag: (req as unknown as { body?: { _tag?: string } }).body?._tag,
      accept: Option.getOrUndefined(Headers.get(req.headers, "accept")),
      contentType: Option.getOrUndefined(Headers.get(req.headers, "content-type")),
    })
    if (path === "/boom") {
      return Effect.fail(
        new HttpClientError.RequestError({ request: req, reason: "Transport", cause: new Error("boom") }),
      )
    }
    let res: Response
    if (path === "/oauth/token") {
      state.tokenCalls++
      res =
        (opts.tokenStatus ?? 200) !== 200
          ? json(opts.tokenStatus!, { error: "nope" })
          : json(200, {
              access_token: `tok-${state.tokenCalls}`,
              token_type: "Bearer",
              ...(opts.omitExpiresIn ? {} : { expires_in: opts.tokenExpiresIn ?? 3600 }),
            })
    } else if (path === "/v1/vob") {
      res = json(200, { verified: true, plan: "PPO" })
    } else if (path.endsWith("/employees/eoi")) {
      res = json(402, errEnvelope)
    } else if (path.endsWith("/policyspecs")) {
      state.policyspecsCalls++
      res = state.policyspecsCalls === 1 ? json(401, { message: "expired" }) : json(200, { policy: "ok" })
    } else if (req.method === "POST" && path.endsWith("/employees")) {
      res = json(200, { TransmissionGUID: "txn-1", TransmissionStatusCode: "Success" })
    } else if (path.includes("/transactionstatus/")) {
      res = json(200, { TransmissionGUID: "txn-1", TransmissionStatusCode: "BOGUS" })
    } else if (path.endsWith("/cancellation")) {
      res = json(202, { correlationId: "c-1", policyNumber: "POL-1" })
    } else if (path === "/echo" || path === "/echoq") {
      res = json(200, {})
    } else if (path === "/api/v1/applicationprefillinformation") {
      res = json(200, { ok: true })
    } else if (path === "/rid") {
      res = json(400, { message: "bad" }, { "x-request-id": "RID-1" })
    } else if (path === "/cid") {
      res = json(404, { message: "nf" }, { "x-correlation-id": "CID-1" })
    } else if (path === "/msg/desc") {
      res = json(400, { error_description: "d" })
    } else if (path === "/msg/err") {
      res = json(400, { error: "e" })
    } else if (path === "/msg/none") {
      res = json(400, {})
    } else if (path === "/fields") {
      res = json(400, {
        errors: [
          { code: 123, field: "email", message: "m" },
          { field: "phone", message: "m2" },
        ],
      })
    } else if (path === "/errstr") {
      // non-object error body → decodeEnvelope returns None
      res = json(400, "plain string error")
    } else if (path === "/rl-nohdr") {
      res = json(429, { message: "slow down" })
    } else if (path === "/badjson") {
      res = new Response("not json{", { status: 200, headers: { "content-type": "application/json" } })
    } else if (path === "/nocontent") {
      res = new Response(null, { status: 204 })
    } else if (path.startsWith("/status/")) {
      const code = Number(path.split("/").pop())
      res = json(code, errEnvelope, code === 429 ? { "retry-after": "12" } : {})
    } else {
      res = json(404, { message: "no route" })
    }
    return Effect.succeed(HttpClientResponse.fromWeb(req, res))
  })
  return { client, state }
}

const makeRuntime = (client: HttpClient.HttpClient) => {
  const cfg = ConfigModule.layer({
    baseUrl: "https://api.test",
    tokenUrl: "https://api.test/oauth/token",
    clientId: "id",
    clientSecret: "sec",
    apiKey: "key",
  })
  const http = Layer.succeed(HttpClient.HttpClient, client)
  const token = TokenProviderLayer.pipe(Layer.provide(Layer.merge(http, cfg)))
  return ManagedRuntime.make(Layer.mergeAll(cfg, http, token))
}

export const transportTests = async (t: Harness): Promise<void> => {
  const main = makeMock()
  const rt = makeRuntime(main.client)
  const run = <A, E>(eff: Effect.Effect<A, E, RequestContext>) => rt.runPromise(eff)
  const probe = (path: string) =>
    run(Effect.either(request({ method: "GET", path, response: Schema.Unknown })))
  const probeM = (method: "PUT" | "PATCH" | "DELETE", path: string) =>
    run(Effect.either(request({ method, path, response: Schema.Unknown })))

  t.section("transport · happy path & auth headers")
  const vob = (await run(Tutela.vob.verify({ member: { member_id: "M1" } }))) as { verified?: unknown }
  t.ok(vob.verified === true, "VOB verify decodes a body")
  const vobReq = main.state.seen.find((s) => s.path === "/v1/vob")
  t.ok(vobReq?.auth === "Bearer tok-1", "bearer token injected")
  t.ok(vobReq?.apiKey === "key", "x-api-key injected")
  t.ok(vobReq?.accept?.includes("application/json") === true, "data request sends Accept: application/json")
  t.ok(main.state.tokenCalls === 1, "token endpoint hit once")
  await run(Tutela.vob.verify({ member: { member_id: "M2" } }))
  t.ok(main.state.tokenCalls === 1, "token cached across calls")

  t.section("transport · status → tagged error mapping")
  const cases: Array<[number, string]> = [
    [400, "BadRequest"],
    [404, "NotFound"],
    [422, "Unprocessable"],
    [429, "RateLimited"],
    [500, "ServerError"],
  ]
  for (const [code, tag] of cases) {
    const r = await probe(`/status/${code}`)
    t.ok(r._tag === "Left" && r.left._tag === tag, `${code} → ${tag}`)
  }
  const rl = await probe("/status/429")
  t.ok(rl._tag === "Left" && rl.left._tag === "RateLimited" && rl.left.retryAfterSeconds === 12, "429 carries retry-after")
  const br = await probe("/status/400")
  t.ok(
    br._tag === "Left" && br.left._tag === "BadRequest" && br.left.errors[0]?.field === "weight",
    "error envelope normalized into field errors",
  )
  const se = await probe("/status/503")
  t.ok(se._tag === "Left" && se.left._tag === "ServerError" && se.left.status === 503, "unknown 5xx → ServerError w/ status")

  t.section("transport · 402 PaymentRequired (EOI)")
  const eoi = await run(
    Effect.either(
      Tutela.eoi
        .submit()
        .policy(Tutela.Brand.GroupPolicyId("GP1"))
        .nonce(Tutela.Brand.Nonce("n1"))
        .body({ employee: { personal_information: { FirstName: "A", LastName: "B", DOB: "2000-01-01", Gender: "F" } } })
        .send(),
    ),
  )
  t.ok(eoi._tag === "Left" && eoi.left._tag === "PaymentRequired", "402 → PaymentRequired")
  t.ok(eoi._tag === "Left" && eoi.left._tag === "PaymentRequired" && eoi.left.errors.length === 1, "carries field errors")

  t.section("transport · 401 refresh + retry")
  const specs = (await run(Tutela.policy.specs(Tutela.Brand.MasterAgreementNumber("00000420")))) as { policy?: unknown }
  t.ok(specs.policy === "ok", "succeeds after transparent 401 retry")
  t.ok(main.state.policyspecsCalls === 2, "data request retried exactly once")
  t.ok(main.state.tokenCalls === 2, "token re-fetched on 401")

  // permanent 401 → gives up with Unauthorized
  const perm = await probe("/status/401")
  t.ok(perm._tag === "Left" && perm.left._tag === "Unauthorized", "permanent 401 → Unauthorized (retry gives up)")
  t.ok(perm._tag === "Left" && perm.left._tag === "Unauthorized" && perm.left.message === "boom", "Unauthorized carries the envelope message")
  const unp = await probe("/status/422")
  t.ok(
    unp._tag === "Left" && unp.left._tag === "Unprocessable" && unp.left.errors.length === 1,
    "Unprocessable carries field errors",
  )

  t.section("transport · transport & decode errors")
  const boom = await probe("/boom")
  t.ok(boom._tag === "Left" && boom.left._tag === "TransportError", "connection failure → TransportError")
  t.ok(
    boom._tag === "Left" && boom.left._tag === "TransportError" && boom.left.message.includes("transport"),
    "TransportError carries a descriptive message",
  )
  const drift = await run(
    Effect.either(Tutela.benefits.transactionStatus(Tutela.Brand.MasterAgreementNumber("00000001"), "g1")),
  )
  t.ok(drift._tag === "Left" && drift.left._tag === "DecodeError", "out-of-enum value → DecodeError")
  t.ok(
    drift._tag === "Left" && drift.left._tag === "DecodeError" && drift.left.message.includes("schema"),
    "DecodeError carries a descriptive message",
  )

  t.section("transport · http method construction")
  for (const method of ["PUT", "PATCH", "DELETE"] as const) {
    await probeM(method, "/echo")
    t.ok(
      main.state.seen.some((s) => s.path === "/echo" && s.method === method),
      `${method} requests are constructed correctly`,
    )
  }

  t.section("transport · request body presence")
  const vobSeen = main.state.seen.find((s) => s.path === "/v1/vob")
  t.ok(vobSeen?.bodyTag !== undefined && vobSeen.bodyTag !== "Empty", "POST with a body sends a non-empty body")
  const getSeen = main.state.seen.find((s) => s.method === "GET")
  t.ok(getSeen?.bodyTag === "Empty", "GET sends no body")

  t.section("transport · curated decode")
  const txn = await run(Tutela.benefits.processTransaction(Tutela.Brand.GroupPolicyId("GP9"), {} as never))
  t.ok(txn.TransmissionStatusCode === "Success", "Benefits decodes TransmissionResponse")
  const ack = await run(
    Tutela.retail.cancel(
      Tutela.Brand.CustomerNumber("CUST-1"),
      Tutela.Brand.PolicyNumber("POL-1"),
      Tutela.Brand.Nonce("n2"),
      {} as never,
    ),
  )
  t.ok(ack.correlationId === "c-1", "Retail decodes AsyncResponse (202)")

  t.section("transport · url building")
  await run(Effect.either(request({ method: "GET", path: "/echoq", query: { keep: "1", drop: undefined }, response: Schema.Unknown })))
  const echo = main.state.seen.find((s) => s.path === "/echoq")
  t.ok(echo?.search.includes("keep=1") === true, "query param kept")
  t.ok(echo?.search.includes("drop") === false, "undefined query param dropped")
  await run(Tutela.policy.specs(Tutela.Brand.MasterAgreementNumber("A B"))).catch(() => undefined)
  t.ok(
    main.state.seen.some((s) => s.path.includes("/v4/policies/A%20B/policyspecs")),
    "path params are URL-encoded",
  )
  // query via the typed combinator (exercises toQuery: stringify + drop undefined)
  await run(Tutela.prefill.find({ firstName: "Ada", lastName: undefined }))
  const pf = main.state.seen.find((s) => s.path === "/api/v1/applicationprefillinformation")
  t.ok(pf?.search.includes("firstName=Ada") === true, "combinator query value stringified")
  t.ok(pf?.search.includes("lastName") === false, "combinator query drops undefined")

  t.section("transport · requestId & error-envelope normalization")
  const rid = await probe("/rid")
  t.ok(rid._tag === "Left" && rid.left._tag === "BadRequest" && rid.left.requestId === "RID-1", "x-request-id captured")
  const cid = await probe("/cid")
  t.ok(cid._tag === "Left" && cid.left._tag === "NotFound" && cid.left.requestId === "CID-1", "falls back to x-correlation-id")
  const md = await probe("/msg/desc")
  t.ok(md._tag === "Left" && md.left._tag === "BadRequest" && md.left.message === "d", "message ← error_description")
  const me = await probe("/msg/err")
  t.ok(me._tag === "Left" && me.left._tag === "BadRequest" && me.left.message === "e", "message ← error")
  const mn = await probe("/msg/none")
  t.ok(mn._tag === "Left" && mn.left._tag === "BadRequest" && mn.left.message === "Request failed", "message ← default")
  t.ok(mn._tag === "Left" && mn.left._tag === "BadRequest" && mn.left.errors.length === 0, "absent errors array defaults to empty")
  const fields = await probe("/fields")
  t.ok(
    fields._tag === "Left" &&
      fields.left._tag === "BadRequest" &&
      fields.left.errors[0]?.code === "123" &&
      fields.left.errors[0]?.field === "email",
    "numeric code stringified & field mapped",
  )
  t.ok(
    fields._tag === "Left" && fields.left._tag === "BadRequest" && fields.left.errors[0]?.message === "m",
    "per-error message preserved (not overwritten by top-level)",
  )
  t.ok(
    fields._tag === "Left" && fields.left._tag === "BadRequest" && fields.left.errors[1]?.code === undefined,
    "missing error code stays undefined (not stringified)",
  )
  const estr = await probe("/errstr")
  t.ok(
    estr._tag === "Left" &&
      estr.left._tag === "BadRequest" &&
      estr.left.message === "Request failed" &&
      estr.left.errors.length === 0,
    "non-object error body → default message, no field errors",
  )
  const nc = await run(Effect.either(request({ method: "GET", path: "/nocontent", response: Schema.Struct({}) })))
  t.ok(nc._tag === "Right", "204 No Content → empty object without reading the body")
  const bad = await probe("/badjson")
  t.ok(
    bad._tag === "Left" && bad.left._tag === "TransportError" && bad.left.message.includes("reading"),
    "malformed 2xx body → TransportError (failed reading body)",
  )
  const r300 = await probe("/status/300")
  t.ok(r300._tag === "Left" && r300.left._tag === "ServerError" && r300.left.status === 300, "300 is not treated as success")
  const rlNoHdr = await probe("/rl-nohdr")
  t.ok(
    rlNoHdr._tag === "Left" && rlNoHdr.left._tag === "RateLimited" && rlNoHdr.left.retryAfterSeconds === undefined,
    "429 without retry-after → undefined retryAfterSeconds",
  )

  t.section("auth · client-credentials request shape")
  const tok = main.state.seen.find((s) => s.path === "/oauth/token")
  t.ok(tok?.method === "POST", "token fetched via POST")
  t.ok(tok?.auth?.startsWith("Basic ") === true, "token request uses Basic client-credentials auth")
  const decodedBasic = tok?.auth?.startsWith("Basic ") ? atob(tok.auth.slice(6)) : ""
  t.ok(decodedBasic === "id:sec", "Basic auth encodes clientId:clientSecret")
  t.ok(tok?.accept?.includes("application/json") === true, "token request sends Accept: application/json")
  t.ok(tok?.contentType?.includes("x-www-form-urlencoded") === true, "token request body is form-urlencoded")

  await rt.dispose()

  t.section("auth · failure & expiry")
  const failRt = makeRuntime(makeMock({ tokenStatus: 500 }).client)
  const authErr = await failRt.runPromise(Effect.either(Tutela.vob.verify({ member: {} })))
  t.ok(authErr._tag === "Left" && authErr.left._tag === "AuthError", "token endpoint failure → AuthError")
  t.ok(
    authErr._tag === "Left" && authErr.left._tag === "AuthError" && authErr.left.message.includes("client-credentials"),
    "AuthError carries a descriptive message",
  )
  await failRt.dispose()

  const expiring = makeMock({ tokenExpiresIn: 0 })
  const expRt = makeRuntime(expiring.client)
  await expRt.runPromise(Tutela.vob.verify({ member: {} }))
  await expRt.runPromise(Tutela.vob.verify({ member: {} }))
  t.ok(expiring.state.tokenCalls === 2, "expired token (ttl 0) is re-fetched each call")
  await expRt.dispose()

  // No expires_in → default TTL applies, so the token is cached (1 fetch).
  const noExp = makeMock({ omitExpiresIn: true })
  const noExpRt = makeRuntime(noExp.client)
  await noExpRt.runPromise(Tutela.vob.verify({ member: {} }))
  await noExpRt.runPromise(Tutela.vob.verify({ member: {} }))
  t.ok(noExp.state.tokenCalls === 1, "missing expires_in falls back to the default TTL (token cached)")
  await noExpRt.dispose()
}
