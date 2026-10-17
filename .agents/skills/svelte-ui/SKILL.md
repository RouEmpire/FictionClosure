---
name: svelte-ui
description: Builds accessible, keyboard-friendly Svelte interfaces using the repository's established Svelte and Tailwind conventions. Use for renderer components and interaction design.
---

# Svelte UI Skill

## Principles
- Inspect installed Svelte version and existing component patterns first.
- Keep domain and persistence logic out of presentation components.
- Model loading, empty, success, dirty, saving, and error states explicitly.
- Use accessible names, semantic controls, visible focus, and adequate contrast.
- Support keyboard operation and document shortcut conflicts.
- Avoid unnecessary global stores; keep state ownership clear.
- Use Tailwind utilities consistently with the existing design system.
- Do not invent design tokens or APIs without checking the project.

## Procedure
1. Review user flow and acceptance criteria.
2. Define component responsibilities and state transitions.
3. Implement responsive layout and keyboard behavior.
4. Test empty, long-content, narrow-window, and error states.
5. Run available checks and perform a focused visual/manual review.

Never mark an action as saved until the persistence layer confirms success.
