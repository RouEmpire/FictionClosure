# Test Strategy

## Layers
- Unit: domain logic, validators, parsers, serialization, search query logic.
- Integration: filesystem + metadata, SQLite migrations/index rebuild, IPC contracts.
- End-to-end: create/open project, create/edit/save document, reopen after restart, search.
- Compatibility: fixtures from older schema versions and representative Markdown documents.
- Security: path traversal, malformed messages, permission denial, untrusted import and tool results.
- Packaging smoke tests: launch, open project, save, and quit on supported target platforms.

## Quality gates
Use only commands present in the repository; document their actual names in package scripts.
1. Format/lint.
2. Type check.
3. Unit tests.
4. Integration tests.
5. Production build.
6. Targeted manual smoke test for critical workflows.

## Fixture policy
- Include Unicode and Thai text.
- Include long documents, empty files, malformed metadata, unusual line endings, and links with spaces.
- Keep fixtures deterministic and avoid personal manuscript data.
