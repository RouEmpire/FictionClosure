---
name: extension-system
description: Designs a safe extension manifest, capability model, lifecycle, version compatibility, and API for community extensions. Use before implementing or expanding the plugin ecosystem.
---

# Extension System Skill

## Do not start with arbitrary code execution
First decide whether MVP extensions can be declarative or limited to a constrained API. If executable extensions are required, prove the isolation and permission model before exposing the API.

## Procedure
1. Define extension use cases and non-goals.
2. Specify manifest schema, ID/version rules, compatibility, lifecycle, and failure behavior.
3. Define capabilities and explicit permission grants.
4. Decide runtime, isolation, resource limits, and update trust.
5. Define stable API contracts and versioning/deprecation policy.
6. Add malicious/invalid extension fixtures.
7. Test install, disable, revoke, crash, update, and uninstall.

## Required questions
- Can an extension read all project files or only granted files?
- Can it write content, access network, or run commands?
- How are permissions shown and revoked?
- What happens when an extension crashes?
- How are API versions and migrations handled?

Do not represent a permission model as a sandbox unless the actual runtime enforces isolation.
