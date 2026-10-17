# FictionClosure Development Timeline

This is a milestone-based timeline, not a calendar promise. Advance when exit criteria pass.

| Phase | Focus | Main Skills | Exit criteria |
|---|---|---|---|
| 0 | Repository reconnaissance and scope | product-spec, architecture-design | Requirements, constraints, and open decisions documented |
| 1 | Technical proof of concept | architecture-design, typescript-quality, testing-and-verification | App launches; one file can be read/written safely |
| 2 | Vertical-slice foundation | implementation-planning, svelte-ui, persistence, testing-and-verification | Create/open project, tree, edit Markdown, save, reopen |
| 3 | Document model and navigation | markdown-engine, persistence, testing-and-verification | Links/search behave correctly with fixtures |
| 4 | Writing workflow | svelte-ui, typescript-quality, testing-and-verification | Keyboard navigation, editor states, labels and notes |
| 5 | Reliability and packaging | security-review, testing-and-verification, release-readiness | Recovery, migrations, Linux package smoke tests |
| 6 | Import/export | import-export, security-review, testing-and-verification | Preview, validation, safe failure and round-trip tests |
| 7 | MCP AI assistance | mcp-integration, security-review, testing-and-verification | Consent, scoped tools, previewed edits, audit trail |
| 8 | Extension platform | extension-system, security-review, testing-and-verification | Capability model and isolation proven before third-party code |
| 9 | Release candidate | release-readiness, testing-and-verification | Documented supported platforms, known issues, backup/restore evidence |

## Rule
Do not start MCP, extensions, or FFI-heavy parser work before the core vertical slice and data-safety behavior are stable, unless a proof-of-concept demonstrates that the decision blocks the architecture.
