# Data Model

Status: Draft. This document describes concepts, not a finalized schema.

## Core concepts
- Project: root directory and project-level metadata.
- Document: Markdown file with stable identity if required.
- DocumentLink: a parsed or explicitly maintained reference between documents.
- Tag/Label: optional categorization or workflow status.
- SearchEntry: derived index entry, rebuildable from source.
- Character/Plot/World note: initially document templates/types, not necessarily separate database tables.
- MediaAsset: path/reference to an image or other attached file.
- AppPreference: user-level settings, distinct from project metadata.

## Invariants
- A document's path may change; path should not be treated as a permanent identity if links must survive renames.
- Never silently discard unknown metadata fields during serialization.
- Index data must be distinguishable from canonical user data.
- Define behavior for missing files, duplicate identifiers, moved folders, and external edits.
- Use schema versions for persisted structured data.
- Validate all external data at runtime.

## Required design work
Before implementation, decide:
1. Which entities need stable IDs.
2. How IDs are generated and preserved during import/copy.
3. How relative links resolve after a rename or move.
4. Whether SQLite stores authoritative records or derived indexes.
5. How backup, restore, and migration work.
