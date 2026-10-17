---
name: persistence
description: Implements safe project-file, JSON metadata, and SQLite persistence with migrations, indexing, and recovery behavior. Use whenever stored data or save semantics change.
---

# Persistence Skill

## Invariants
- Markdown is the canonical manuscript source unless an ADR explicitly changes that.
- Treat SQLite as derived/index data by default; document any authoritative records.
- Use schema versions for structured persisted data.
- Preserve unknown metadata when feasible.
- Writes must avoid partial/truncated user files.
- Never silently overwrite externally changed content.
- Define behavior for duplicate events, missing files, rename/move, and interrupted shutdown.

## Procedure
1. Identify canonical versus derived data.
2. Define serialization schema and versioning.
3. Plan atomic write, conflict detection, and recovery.
4. Add fixtures for old versions and malformed data.
5. Test migration, restart, partial failure, and index rebuild.
6. Document backup/restore behavior.

Ask before any migration or operation that can lose or rewrite user content.
