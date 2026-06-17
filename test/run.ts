/**
 * Test entry point. Runs every suite and exits non-zero on any failure
 * (the signal the Stryker command runner uses to mark a mutant killed).
 */
import { Harness } from "./harness.js"
import { transportTests } from "./transport.test.js"
import { unitTests } from "./unit.test.js"

const t = new Harness()

const main = async (): Promise<void> => {
  await unitTests(t)
  await transportTests(t)
  t.summary()
  if (t.fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
