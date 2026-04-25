# Changelog

## [Unreleased]

### Added

- Client-side stress testing — renders the component in the iframe using React Profiler for timing and `performance.measureUserAgentSpecificMemory()` for heap tracking.
- Progressive results — timing/determinism findings appear immediately while memory detection and SSR run in parallel.
- Memory leak detection with early exit when signal is clear (definite leak or stable).
- `runId` scoping to prevent stale message races during auto-run.
- COOP/COEP headers (`credentialless`) on observatory routes for cross-origin isolation.

### Changed

- Switched CLI imports from static ESM to dynamic `await import()` for broader compatibility.
- Extracted shared `httpUtils` (`readBody`, `jsonResponse`) from plugin modules.

### Removed

- `StressModal` component (replaced by progressive `HealthPanel` UI).

## [0.2.0] - 2026-04-09

### Changed

- Externalized React from all build outputs — React is now resolved from the host project's `node_modules` at runtime, reducing package size by 32% (146 KB → 99 KB compressed).
- Replaced static file server with virtual modules for serving the Observatory UI through Vite's transform pipeline.
- Inlined CSS directly into served HTML instead of referencing via a virtual module.

### Fixed

- Replaced deprecated `external` option with `deps.neverBundle` in tsdown config.
- Replaced deprecated `inlineDynamicImports` with `codeSplitting: false` in Vite UI build config.
- Derived `__dirname` from `import.meta.url` for ESM compatibility in Vite config.
- Shared `@/` resolve aliases across all Vite configs so production builds resolve the same paths as dev.
- Removed deprecated `baseUrl` from tsconfig for TypeScript 6 compatibility.

### Internal

- Reorganized `src/ui/` into `components/`, `hooks/`, and `lib/` subdirectories.
- Switched all internal imports to absolute paths using `@/` alias.
- Added build check to CI workflow.
- Added Dependabot configuration for automated dependency updates.
- Fixed publish workflow for OIDC trusted publishing (Node 24, automatic provenance).

## [0.1.0] - 2026-04-06

### Added

- Initial release.
- CLI (`npx reactoscope path/to/Component.tsx`) and Vite plugin usage.
- Automatic TypeScript prop extraction and editable controls.
- Stress testing with render timing analysis.
- AI feedback via local Ollama integration.
- Visual snapshot diffing.

[Unreleased]: https://github.com/BAJ-/reactoscope/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/BAJ-/reactoscope/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/BAJ-/reactoscope/releases/tag/v0.1.0
