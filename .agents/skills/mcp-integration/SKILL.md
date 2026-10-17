---
name: mcp-integration
description: Designs opt-in MCP integration for AI-assisted writing with scoped tools, user consent, previews, and auditability. Use when adding MCP clients, servers, or AI tool actions.
---

# MCP Integration Skill

## Safety-first design
- Separate read-only tools from write-capable tools.
- Expose the smallest useful tool surface.
- Validate every tool argument at runtime.
- Treat server responses and model-generated content as untrusted.
- Make the project/files included in a request visible to the user.
- Require confirmation before applying edits, bulk changes, deletion, or external transmission of sensitive content.
- Prefer proposed patches/previews over direct silent writes.
- Keep a record of what action was requested and whether the user approved it, without logging unnecessary manuscript contents.
- Handle timeout, disconnect, malformed responses, and partial tool failure.

## Procedure
1. Specify user benefit and exact tool list.
2. Define permissions, consent, and data-flow diagram.
3. Define typed input/output schemas and error behavior.
4. Mock the MCP boundary in tests.
5. Test denied permission, invalid arguments, timeout, and partial failure.
6. Add user-visible controls to revoke or disable integration.

Do not enable broad filesystem or shell tools by default.
