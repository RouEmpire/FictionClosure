---
name: implementation-planning
description: Breaks a feature into small, dependency-aware implementation tasks with clear acceptance criteria and verification steps. Use before medium or large coding tasks.
---

# Implementation Planning Skill

## Procedure
1. Confirm the product acceptance criteria.
2. Inspect repository state, scripts, and existing patterns.
3. Divide work into small vertical slices that keep the app buildable.
4. Order tasks by dependency and risk; put uncertain integrations behind spikes.
5. For each task specify files/modules likely affected, expected behavior, tests, and rollback strategy.
6. Identify what is explicitly out of scope.
7. Prefer one coherent task at a time; do not generate a broad rewrite.

## Task template
- Goal
- Prerequisites
- Expected changes
- Acceptance criteria
- Tests/checks
- Risk and rollback
- Definition of done

## Stop condition
If the task requires a major unresolved architectural decision, return to `architecture-design` before implementation.
