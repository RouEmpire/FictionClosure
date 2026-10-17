---
name: release-readiness
description: Checks whether a FictionClosure build is ready for a release candidate, including packaging, migration safety, user documentation, and known risks. Use before tagging or distributing a build.
---

# Release Readiness Skill

## Procedure
1. Confirm the target version and supported OS/runtime matrix.
2. Run the repository's documented quality gates.
3. Verify clean install, launch, project creation/open, edit/save/reopen, and graceful quit.
4. Verify migrations, backup/restore, and failure recovery.
5. Review permissions, external data sharing, and extension/MCP defaults.
6. Review release notes, known issues, and upgrade instructions.
7. Check packaging/signing/update assumptions for each target platform.
8. Produce a go/no-go report.

## Go/no-go blockers
- Unexplained data-loss risk.
- Failed critical save/reopen journey.
- Unvalidated migration.
- Critical security issue.
- Unsupported platform claim.
- Tests reported as passing without evidence.

Do not claim cross-platform readiness based only on a Linux build.
