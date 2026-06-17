/**
 * Pure unit tests for branded constructors and config (no HTTP/runtime).
 */
import { Effect, Redacted } from "effect"
import * as Brand from "../src/core/brand.js"
import * as ConfigModule from "../src/core/config.js"
import { TutelaConfig } from "../src/core/config.js"
import type { Harness } from "./harness.js"

export const unitTests = async (t: Harness): Promise<void> => {
  t.section("brand · smart constructors")
  t.ok(Brand.TransactionId.either("12345")._tag === "Right", "TransactionId accepts all-digits")
  t.ok(Brand.TransactionId.either("12a45")._tag === "Left", "TransactionId rejects non-digits")
  t.ok(Brand.TransactionId.either("")._tag === "Left", "TransactionId rejects empty")
  t.ok(Brand.MasterAgreementNumber.either("")._tag === "Left", "MasterAgreementNumber rejects empty")
  t.ok(Brand.MasterAgreementNumber.either("GRP-1")._tag === "Right", "MasterAgreementNumber accepts non-empty")
  const gpiErr = Brand.GroupPolicyId.either("")
  t.ok(gpiErr._tag === "Left", "GroupPolicyId rejects empty")
  t.ok(
    gpiErr._tag === "Left" && JSON.stringify(gpiErr.left).includes("non-empty"),
    "GroupPolicyId error message is descriptive",
  )
  t.ok(Brand.Nonce("abc") === "abc", "Nonce is a nominal passthrough")
  t.ok(Brand.brand(Brand.PolicyNumber, "P1") === "P1", "brand() helper applies a constructor")
  const manErr = Brand.MasterAgreementNumber.either("")
  t.ok(
    manErr._tag === "Left" && JSON.stringify(manErr.left).includes("non-empty"),
    "MasterAgreementNumber error message is descriptive",
  )
  const txErr = Brand.TransactionId.either("x")
  t.ok(
    txErr._tag === "Left" && JSON.stringify(txErr.left).includes("digits"),
    "TransactionId error message mentions digits",
  )

  t.section("config · layer")
  const cfg = Effect.runSync(
    Effect.provide(
      TutelaConfig,
      ConfigModule.layer({
        baseUrl: "https://api.test///",
        tokenUrl: "https://api.test/oauth/token",
        clientId: "id",
        clientSecret: "shh",
        apiKey: "k",
      }),
    ),
  )
  t.ok(cfg.baseUrl === "https://api.test", "trailing slashes trimmed from baseUrl")
  t.ok(Redacted.value(cfg.clientSecret) === "shh", "clientSecret value preserved (Redacted)")
  t.ok(Redacted.value(cfg.apiKey) === "k", "apiKey value preserved (Redacted)")
  t.ok(String(cfg.clientSecret).includes("shh") === false, "Redacted secret hidden from toString")

  t.section("config · fromEnv")
  process.env.TUTELA_BASE_URL = "https://env.test//"
  process.env.TUTELA_TOKEN_URL = "https://env.test/token"
  process.env.TUTELA_CLIENT_ID = "cid"
  process.env.TUTELA_CLIENT_SECRET = "csec"
  process.env.TUTELA_API_KEY = "akey"
  const envCfg = Effect.runSync(Effect.provide(TutelaConfig, ConfigModule.fromEnv))
  t.ok(envCfg.baseUrl === "https://env.test", "fromEnv trims baseUrl")
  t.ok(envCfg.tokenUrl === "https://env.test/token", "fromEnv reads tokenUrl")
  t.ok(envCfg.clientId === "cid", "fromEnv reads clientId")
  t.ok(Redacted.value(envCfg.clientSecret) === "csec", "fromEnv reads clientSecret")
  t.ok(Redacted.value(envCfg.apiKey) === "akey", "fromEnv reads apiKey")
}
