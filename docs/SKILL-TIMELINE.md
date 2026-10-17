# Skill Adoption Timeline

## Phase 0 — Discovery (before coding)
Use:
- `/product-spec`
- `/architecture-design`
- `/implementation-planning`

Deliverables:
- Scope and non-goals
- Acceptance criteria
- Architecture diagram and first ADRs
- Task backlog with risk labels

Gate: no unresolved question about canonical manuscript storage or save safety.

## Phase 1 — Technical spike
Use:
- `/architecture-design`
- `/typescript-quality`
- `/testing-and-verification`
- `/security-review` for file/IPC boundaries

Build a throwaway or isolated proof that the chosen desktop shell can launch, access a project directory through a safe boundary, and write/reopen a file. Verify official docs and installed versions.

Gate: known-good build command, typed IPC example, safe file write/reopen test.

## Phase 2 — MVP vertical slice
Use:
- `/implementation-planning`
- `/svelte-ui`
- `/typescript-quality`
- `/persistence`
- `/testing-and-verification`

Implement project open/create, document tree, Markdown editing, save status, and reopen after restart.

Gate: a user can create a project, edit, save, quit, relaunch, and recover the same content.

## Phase 3 — Navigation and document model
Use:
- `/markdown-engine`
- `/persistence`
- `/svelte-ui`
- `/testing-and-verification`

Implement links, document metadata, search, character/plot/world templates, and index rebuild.

Gate: fixture-driven parsing/search tests pass; derived data can be rebuilt.

## Phase 4 — Writing workflow and usability
Use:
- `/svelte-ui`
- `/typescript-quality`
- `/testing-and-verification`

Implement keyboard shortcuts, status labels, themes, timeline/calendar only if MVP scope still supports it.

Gate: keyboard and accessibility review; no save-state ambiguity.

## Phase 5 — Reliability and first Linux release
Use:
- `/security-review`
- `/persistence`
- `/testing-and-verification`
- `/release-readiness`

Test migrations, external file changes, interrupted writes, packaging, and backup/restore.

Gate: critical save/reopen journey passes on the target Linux setup; known issues documented.

## Phase 6 — Import/export
Use:
- `/import-export`
- `/security-review`
- `/testing-and-verification`

Add formats one at a time. Start with the simplest high-value format; do not promise perfect round-tripping without tests.

Gate: safe preview, conflict handling, failure leaves source project unchanged.

## Phase 7 — MCP integration
Use:
- `/mcp-integration`
- `/security-review`
- `/testing-and-verification`

Begin with read-only, narrowly scoped tools. Add write actions only with explicit previews and user approval.

Gate: consent flow, permission denial, malformed response, timeout, and revoke tests pass.

## Phase 8 — Extensions
Use:
- `/extension-system`
- `/security-review`
- `/testing-and-verification`

Design the capability model and failure isolation before enabling third-party executable code.

Gate: an extension cannot exceed its granted permissions in tests; disable/revoke behavior works.

## Phase 9 — Release candidate
Use:
- `/release-readiness`
- `/testing-and-verification`
- relevant feature Skills for unresolved issues

Gate: all release blockers closed or explicitly accepted by the product owner.
