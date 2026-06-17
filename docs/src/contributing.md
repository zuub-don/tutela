# Contributing

## Commands

```sh
pnpm install
pnpm gen           # regenerate src/generated/ from the OpenAPI specs
pnpm typecheck     # tsc, no emit
pnpm test          # mock-HttpClient suite (81 assertions)
pnpm mutation      # StrykerJS over src/core/**
pnpm build         # → dist/
```

Requires Effect `^3.21` and `@effect/platform` `^0.72` (peer dependencies), and
Node ≥ 18.

## Adding or updating an API

1. Drop the OpenAPI spec into the specs directory and run `pnpm gen` — this
   regenerates the `src/generated/<api>.ts` type module.
2. A **generic** resource is a thin file over `api<paths>()` with named methods
   and a `.call` escape hatch (see `resources/policy.ts`).
3. To make it **curated**, add an `effect/Schema` model for the response
   envelopes under `schema/` and decode through the lower-level `request`
   combinator (see `resources/benefits.ts`).

## Continuous integration

[`.github/workflows/ci.yml`](https://github.com/zuub-don/tutela/blob/main/.github/workflows/ci.yml)
runs on every push and PR to `main`:

- **build** — `typecheck` → `test` → `build`
- **mutation** — StrykerJS, enforcing the 90% break threshold

These docs are built and published to GitHub Pages by
[`.github/workflows/docs.yml`](https://github.com/zuub-don/tutela/blob/main/.github/workflows/docs.yml)
on changes under `docs/`.

## Building the docs locally

```sh
mdbook serve docs --open   # live-reloading preview
mdbook build docs          # → docs/book/
```
