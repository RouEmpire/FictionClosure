---
name: import-export
description: Implements import/export pipelines for Markdown, PDF, EPUB, and project archives with validation, preview, and safe failure handling. Use when adding a file format.
---

# Import/Export Skill

## Procedure
1. Define supported input/output versions and fidelity expectations.
2. Treat source files and archives as untrusted.
3. Preview changes before modifying an existing project.
4. Validate archive paths, file sizes, encodings, and references.
5. Avoid overwriting existing files without an explicit conflict policy.
6. Preserve source files and unknown metadata wherever possible.
7. Test Unicode/Thai text, links, images, code blocks, malformed files, duplicate names, and interrupted operations.
8. Document known fidelity limitations.

## Acceptance checks
- Import failures leave the project unchanged.
- Export failure does not corrupt source documents.
- Overwrite behavior is explicit.
- Large or malicious inputs fail safely.
- Round-trip tests document what is and is not preserved.
