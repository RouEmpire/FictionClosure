---
name: testing-and-verification
description: Selects and runs relevant tests, type checks, builds, and regression checks for FictionClosure changes. Use during implementation and before accepting a task.
---

# Testing and Verification Skill

## Procedure
1. Inspect package scripts and existing test setup; never assume command names.
2. Map changed behavior to unit, integration, end-to-end, and security tests.
3. Add regression tests for the bug or acceptance criterion.
4. Run the smallest relevant test set first.
5. Run broader checks when practical: format/lint, typecheck, tests, build.
6. Inspect failures; do not delete or weaken tests just to get green results.
7. Report exact commands and observed outcomes.

## Required edge-case prompts
- Empty input
- Invalid/malformed input
- Unicode and Thai text
- Missing file or permission denial
- Interrupted/failed save
- Duplicate operation
- Old schema/version
- Long content and large project
- External modification/conflict

A check that was not run must be labeled NOT RUN, not PASS.
