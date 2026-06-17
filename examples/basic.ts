/**
 * Tutela usage example. Provide real credentials to `Tutela.run`.
 */
import { Effect } from "effect"
import { Tutela } from "../src/index.js"
import type { EvidenceOfInsurability } from "../src/schema/eoi.js"

const form: EvidenceOfInsurability = {
  employee: {
    personal_information: {
      FirstName: "Ada",
      LastName: "Lovelace",
      DOB: "1815-12-10",
      Gender: "F",
    },
  },
}

const program = Tutela.eoi
  .submit()
  .policy(Tutela.Brand.GroupPolicyId("GP-00420"))
  .nonce(Tutela.Brand.Nonce("nonce-abc-123"))
  .body(form)
  .send() // ✓ all required fields provided
  .pipe(
    Effect.tap((res) => Effect.log(`eoi_required=${res.eoi_required ?? "?"}`)),
    Effect.catchTag("PaymentRequired", (e) =>
      Effect.logError(`business failure: ${e.message}`).pipe(
        Effect.as({ eoi_required: "N" as const }),
      ),
    ),
    Effect.catchTag("Unauthorized", () =>
      Effect.die("check client credentials / api key"),
    ),
  )

// --- Type-state guard demonstration -----------------------------------------
// Uncommenting the next line is a COMPILE error:
//   "Tutela: cannot send — missing required field(s): nonce | body"
//
// Tutela.eoi.submit().policy(Tutela.Brand.GroupPolicyId("GP-1")).send()
// ----------------------------------------------------------------------------

export const main = (): Promise<unknown> =>
  Tutela.run(program, {
    baseUrl: "https://api.guardianlife.com",
    tokenUrl: "https://api.guardianlife.com/oauth/client_credential/accesstoken",
    clientId: "REPLACE_ME",
    clientSecret: "REPLACE_ME",
    apiKey: "REPLACE_ME",
  })
