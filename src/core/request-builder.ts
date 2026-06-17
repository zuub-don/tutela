/**
 * Type-state builder machinery.
 *
 * A request builder carries, in a phantom type parameter, the set of required
 * fields that have been provided so far. Terminal methods (`.send()`) are gated
 * with a `this`-type guard that only resolves to the builder itself once every
 * required field is present — otherwise it resolves to a descriptive string
 * literal type that the real builder is not assignable to, yielding a precise
 * compile error *at the call-site* rather than a runtime surprise.
 *
 *   eoi.submit().policy(id).body(form).send()   // ✓ compiles
 *   eoi.submit().policy(id).send()              // ✗ "missing required field(s): nonce | body"
 */

/** Unique phantom carrier so the `Provided` type parameter is load-bearing. */
export declare const ProvidedFields: unique symbol

export interface CarriesProvided<P extends string> {
  readonly [ProvidedFields]?: P
}

/** Human-readable compile error produced when a terminal method is premature. */
export type MissingFields<K extends string> =
  `Tutela: cannot send — missing required field(s): ${K}`

/**
 * Resolves to `Self` when `Provided ⊇ Required`, else to a `MissingFields`
 * error type. Use as the `this` parameter of a terminal builder method:
 *
 *   send(this: WhenComplete<MyBuilder<P>, Required, P>): Effect<...>
 */
export type WhenComplete<
  Self,
  Required extends string,
  Provided extends string,
> = [Exclude<Required, Provided>] extends [never]
  ? Self
  : MissingFields<Exclude<Required, Provided>>
