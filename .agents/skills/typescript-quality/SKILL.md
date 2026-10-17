---
name: typescript-quality
description: Implements and reviews TypeScript with explicit types, narrow interfaces, safe error handling, and maintainable module boundaries. Use for TypeScript changes.
---

# TypeScript Quality Skill

## Rules
- Prefer `unknown` at untrusted boundaries and validate before use.
- Avoid `any`, unsafe casts, non-null assertions, and swallowed exceptions.
- Use discriminated unions for state and result variants where helpful.
- Keep platform APIs behind adapters and domain logic independent of UI.
- Avoid hidden global mutable state and circular dependencies.
- Keep public types small and document invariants.
- Follow the repository's existing formatter, lint, and module conventions.

## Procedure
1. Inspect nearby code and installed TypeScript configuration.
2. Define input/output types and error behavior.
3. Implement the smallest change.
4. Add tests for invalid input and failure cases.
5. Run available typecheck/lint/test scripts.
6. Report checks that could not run.

Do not add a new library for a problem that a small, clear existing pattern already solves.
