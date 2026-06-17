/**
 * Minimal zero-dependency test harness. Each `ok` is an assertion; the process
 * exits non-zero if any fail, which is how the Stryker command runner decides a
 * mutant is killed.
 */
export class Harness {
  pass = 0
  fail = 0

  section(name: string): void {
    console.log(`\n\x1b[1m${name}\x1b[0m`)
  }

  ok(cond: boolean, msg: string): void {
    if (cond) {
      this.pass++
      console.log("  \x1b[32m✓\x1b[0m", msg)
    } else {
      this.fail++
      console.error("  \x1b[31m✗\x1b[0m", msg)
    }
  }

  /** Assert an async thunk rejects/throws. */
  async throws(thunk: () => Promise<unknown> | unknown, msg: string): Promise<void> {
    try {
      await thunk()
      this.ok(false, msg + " (expected throw)")
    } catch {
      this.ok(true, msg)
    }
  }

  summary(): void {
    const total = this.pass + this.fail
    console.log(`\n${this.pass}/${total} passed${this.fail ? `, ${this.fail} FAILED` : ""}`)
  }
}
