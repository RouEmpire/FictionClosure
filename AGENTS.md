# FictionClosure — Agent Operating Rules

## Mission
Build FictionClosure, a desktop-first, Markdown-first fiction-writing workspace. Prioritize correctness, predictable behavior, data safety, maintainability, and user trust over premature optimization.

## Project context
- Target: desktop application, Linux-first during development, with cross-platform intent.
- Proposed stack: Electrobun + Bun, TypeScript, Svelte, Tailwind CSS.
- Data model direction: Markdown files are the canonical manuscript content; structured project metadata may use JSON; SQLite may index/query/cache structured data.
- Planned capabilities include manuscript organization, character/plot/world sheets, links and search, labels/statuses, timeline/calendar, themes, keyboard-first workflows, import/export, MCP-based AI assistance, and extensions.
- Treat stack and architecture choices as proposed until verified against the current repository and official documentation.

## Source of truth
Before implementing a task, inspect:
1. Existing code and package scripts.
2. `docs/PRODUCT_SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. Relevant ADRs in `docs/ADR/`

If these disagree, do not silently pick one. Report the conflict and propose a resolution. Do not overwrite user decisions or existing behavior without explaining the impact.

## Required working loop
For each non-trivial task:
1. Restate the goal and observable acceptance criteria.
2. Inspect relevant code and current project state.
3. Identify affected modules, data formats, security boundaries, and tests.
4. Propose a small implementation plan. For broad or destructive changes, ask for approval first.
5. Implement the smallest coherent change.
6. Run applicable formatting, type checks, tests, and build commands that actually exist in the repository.
7. Report files changed, checks run and their results, known limitations, and any follow-up work.

Never claim a command passed unless it was actually run and its result was observed. If a check cannot run, say why.

## Engineering principles
- Prefer explicit types and validated boundaries. Avoid `any`; if unavoidable, isolate it and explain why.
- Keep UI, application/domain logic, persistence, and platform integration separated.
- Use small modules with explicit interfaces. Avoid circular dependencies.
- Make state transitions and error handling explicit.
- Correctness and data integrity come before performance tuning.
- Prefer readable code and boring, well-understood solutions.
- Do not add dependencies unless they solve a concrete problem. Check maintenance, license, platform compatibility, and security implications.
- Do not invent APIs. Verify the installed version and official docs for Electrobun, Bun, Svelte, MCP, and native FFI.
- Keep cross-platform assumptions explicit; test Linux behavior first, but avoid Linux-only APIs in shared modules without a platform adapter.

## Data safety
- Never delete, rewrite, migrate, or bulk-normalize user content without a backup/rollback strategy and explicit approval when loss is possible.
- Preserve unknown frontmatter fields and unrecognized Markdown constructs when round-tripping, where feasible.
- Do not treat a SQLite index as the canonical manuscript source unless an ADR explicitly changes this policy.
- Use atomic writes or a safe replacement strategy for file updates.
- Handle partial failures, duplicate events, file renames, and interrupted shutdowns.
- Migrations must be versioned, tested against old fixtures, and recoverable.
- Never run destructive commands against user data or production data.

## Security
- Treat imported files, extensions, MCP servers, tool outputs, and AI-generated content as untrusted input.
- Validate IPC messages, extension manifests, MCP arguments, file paths, and serialized data at boundaries.
- Prevent path traversal and unintended access outside an authorized project root.
- Do not execute extension code or shell commands merely because a manifest requests it.
- Do not expose secrets, full manuscript contents, or private project data to external services without clear user consent.
- Use least privilege and explicit user confirmation for destructive, external, or high-impact actions.
- Never store credentials in source control or logs.

## UI and accessibility
- Support keyboard-first workflows; keyboard shortcuts must be discoverable and avoid conflicting with OS/editor conventions.
- Provide visible focus, accessible names, sensible empty/loading/error states, and usable contrast.
- Keep interaction behavior consistent across panels.
- Do not implement visual polish at the expense of content safety or accessibility.

## Testing
- Add tests for behavior changes, edge cases, migrations, parsers, serialization, permissions, and failure paths.
- Prefer unit tests for deterministic domain logic, integration tests for module boundaries, and end-to-end tests for critical user journeys.
- Use fixtures for real-world Markdown and malformed/legacy files.
- Tests must not depend on network access unless the test explicitly covers a mocked network boundary.
- Do not weaken or delete tests simply to make a build pass.

## Architecture change protocol
Create or update an ADR when changing:
- Canonical storage or sync semantics.
- Main-process/renderer or IPC boundaries.
- Markdown parser strategy or native FFI boundary.
- Extension execution/security model.
- MCP permission and consent model.
- Cross-platform packaging strategy.
- A core dependency or framework.

An ADR must include context, decision, alternatives, consequences, and migration/rollback considerations.

## Definition of done
A task is done only when:
- Acceptance criteria are addressed.
- Relevant tests/checks have been run or the inability to run them is documented.
- No known data-loss, security, or accessibility regression is left unexplained.
- Documentation is updated when contracts or behavior change.
- The final response summarizes changes, verification, and remaining risks.
