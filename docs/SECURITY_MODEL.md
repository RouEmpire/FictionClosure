# Security Model

## Trust levels
- Trusted application code: reviewed first-party code.
- User content: may be malformed or adversarial.
- Imported files: untrusted.
- AI output and MCP tool results: untrusted.
- Extensions: untrusted unless explicitly granted capabilities.
- External MCP servers: separate trust boundary.

## Minimum controls
- Validate data at every process/API boundary.
- Canonicalize and constrain filesystem paths to authorized roots.
- Avoid arbitrary shell execution.
- Require consent before sending manuscript content to external services.
- Scope MCP tools to the smallest useful set of actions.
- Make destructive writes and bulk operations previewable and reversible.
- Keep secrets out of logs and project files.
- Add tests for path traversal, malformed input, oversized payloads, denied permissions, and partial failures.

## Extension policy questions
- Are extensions declarative only, or can they execute code?
- If executable, which runtime and isolation model?
- Which capabilities can be requested?
- How are permissions granted, revoked, and audited?
- How are extension updates and signatures verified?
- Can extensions read the whole project, or only explicitly selected files?
