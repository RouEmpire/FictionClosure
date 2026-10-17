---
name: architecture-design
description: Designs or reviews FictionClosure module boundaries, interfaces, storage ownership, IPC, and architectural decisions. Use before creating a subsystem or changing a core boundary.
---

# Architecture Design Skill

## Procedure
1. Inspect the actual repository and relevant docs.
2. State constraints and invariants.
3. Draw the data flow and trust boundaries in text or Mermaid.
4. Define module responsibilities and interfaces before implementation.
5. Compare at least two viable options for major decisions.
6. Assess data migration, testing, cross-platform support, failure modes, and security.
7. Create/update an ADR for changes to canonical storage, parser/FFI, IPC, MCP, extensions, or packaging.
8. Keep the design proportional to the current milestone.

## Output
- Context and constraints
- Proposed components and contracts
- Alternatives and trade-offs
- Failure and recovery behavior
- Security implications
- Tests needed
- ADR recommendation

Do not assume a library API exists without verifying the installed version and official documentation.
