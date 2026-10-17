# FictionClosure Architecture

Status: Proposed — verify against the repository and current dependency documentation.

## Design goals
- Clear separation of concerns.
- Portable Markdown content.
- Safe file operations and explicit error states.
- Linux-first development with a path to other desktop platforms.
- Replaceable parser and storage adapters where practical.

## Suggested logical layers
1. **Renderer/UI** — Svelte components, view state, keyboard handling, accessibility.
2. **Application services** — use cases such as open project, save document, search, create note.
3. **Domain** — project/document identities, links, validation rules, domain errors.
4. **Persistence adapters** — filesystem, JSON metadata, SQLite index/database.
5. **Platform adapter** — Electrobun APIs, dialogs, shell integration, OS-specific behavior.
6. **Trust boundaries** — validated IPC, MCP adapter, extension host/API.

Do not force this exact directory layout if it conflicts with established conventions; preserve the logical boundaries.

## Proposed content/storage policy
- Markdown files: canonical source for manuscript and text-based planning documents.
- JSON: project-level metadata only where a stable schema is useful.
- SQLite: search index and derived/cache data by default; if it stores authoritative entities, document exactly which ones and define backup/migration semantics.
- Any index should be rebuildable from canonical data where feasible.

## IPC boundary
- Use typed request/response contracts.
- Validate inputs at runtime, not only at compile time.
- Return structured errors with stable codes and safe messages.
- Do not expose unrestricted filesystem or shell capabilities to the renderer.
- Check authorization for every path-sensitive operation.

## Markdown parser boundary
- Define a parser interface before choosing implementation details.
- Maintain golden fixtures for supported Markdown constructs.
- A native parser via FFI is optional until a concrete requirement justifies it.
- If FFI is selected, isolate unsafe/native behavior behind one adapter and test ABI, memory ownership, errors, and platform packaging.

## Search
- Start with a correct, testable search implementation.
- Keep indexing separate from canonical content.
- Define stale-index detection and rebuild behavior.
- Add performance optimizations only after measuring realistic project fixtures.

## Decisions requiring ADRs
- Canonical data ownership and project layout.
- Markdown dialect and custom syntax.
- Parser strategy and FFI.
- SQLite role and migration approach.
- IPC contract and security model.
- MCP consent and tool scope.
- Extension sandbox/execution model.
- Theme schema and compatibility.
- Packaging/update strategy.
