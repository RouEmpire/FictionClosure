# FictionClosure Product Specification

Status: Draft — validate with the product owner before treating this as binding.

## Product vision
A desktop-first, Markdown-first writing environment for long-form fiction that keeps manuscript content portable while connecting characters, plots, world rules, research, and media.

## Intended users
- Fiction writers managing long projects.
- Writers who want plain-text ownership and Git-friendly storage.
- Power users who prefer keyboard-driven workflows.
- Writers who may use AI tools but need explicit control over what content is shared or modified.

## Product principles
1. User-owned, portable content.
2. Safe and predictable edits.
3. Clear links between manuscript and planning material.
4. Searchable, navigable project structure.
5. Keyboard-first but accessible UI.
6. AI assistance is opt-in, reviewable, and reversible.
7. Extensibility without silently granting broad system access.

## Proposed initial scope
- Create/open a project.
- Browse a project tree.
- Create and edit Markdown documents.
- Save content safely and recover from common failures.
- Basic links between documents.
- Character, plot, and worldbuilding notes as Markdown-based document types/templates.
- Search documents.
- Basic project metadata and preferences.
- Linux development build and a documented cross-platform strategy.

## Later scope (not MVP unless explicitly promoted)
- PDF/EPUB import/export.
- Rich timeline/calendar.
- Advanced relationship graph.
- Vim mode and configurable shortcut system.
- Theme import compatibility with Zed themes.
- MCP server/client integration.
- Third-party extensions.
- Native Markdown parser through FFI.

## Non-goals for MVP
- Full word processor parity.
- Collaborative real-time editing.
- Automatic rewriting of user prose.
- Running arbitrary third-party extension code with unrestricted access.
- Performance optimization without a measured bottleneck.

## User stories
- As a writer, I can open a project and find its documents in a predictable tree.
- As a writer, I can edit Markdown and know when my changes are saved.
- As a writer, I can create character/plot/world notes without a proprietary data format.
- As a writer, I can search across project documents.
- As a writer, I can recover from an interrupted save or application crash without silent content loss.

## Acceptance criteria template
For each feature define:
- Given / When / Then behavior.
- Normal path.
- Empty state.
- Invalid input.
- Failure/recovery path.
- Keyboard behavior.
- Accessibility requirements.
- Data migration/compatibility impact.
- Unit/integration/e2e test evidence.

## Open questions
- What exact format stores project metadata?
- Is SQLite disposable/rebuildable index data, or authoritative for any structured records?
- Which Markdown dialect and extension syntax are supported?
- How should file renames and external edits be reconciled?
- What is the minimum supported OS/runtime version?
- Which export formats are MVP?
- What exact permissions can MCP tools and extensions request?
