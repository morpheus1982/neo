# Changelog

## v1.0.0 — 2026-02-26

### Added
- AI semantic labeling for schema endpoints via `neo label`.
  - Heuristic labels from method/path/trigger context.
  - Optional label input/merge flow using JSON over stdin or `NEO_ENDPOINT_LABELS`.
  - `--dry-run` mode prints the labeling prompt.
- Multi-step workflow support via `neo workflow`:
  - `neo workflow discover` builds reusable workflows from response→request dependencies.
  - `neo workflow show` renders workflow steps and field transitions.
  - `neo workflow run` executes workflow steps with optional parameter overrides.
- Label output is surfaced in `neo schema show`.

### Changed
- Removed popup UI from the extension surface (no popup entry in manifest/build).
- Cleanup of docs and command references to reflect CLI-first workflow.
- Version bump to `1.0.0`.

### Fixed
- Dependency command now correctly handles dependency link objects in `neo deps`.

## v0.6.x (previous release line)
- Streaming capture bridge, schema generation/versioning, export/import, OpenAPI and HAR output, and dependency graphing.

## v0.1.x (bootstrap)
- Initial capture interceptor + CDP execution stack for API replay.
