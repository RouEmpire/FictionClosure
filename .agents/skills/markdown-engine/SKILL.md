---
name: markdown-engine
description: Designs and tests Markdown parsing, document links, custom syntax, and optional native parser/FFI integration. Use for Markdown behavior or parser changes.
---

# Markdown Engine Skill

## Principles
- Define the supported Markdown dialect and custom syntax explicitly.
- Preserve source text whenever possible; avoid destructive normalization.
- Maintain golden fixtures for headings, links, code fences, tables, Unicode, Thai text, malformed syntax, and unknown constructs.
- Separate parse representation from canonical source text.
- Treat FFI as an isolated adapter, not a dependency throughout the app.
- Verify ABI, memory ownership, error handling, platform builds, and packaging before relying on native code.
- Do not choose a native parser solely on assumed performance benefits.

## Procedure
1. State the syntax/behavior being added.
2. Add fixtures and expected results first.
3. Define parser interface and error semantics.
4. Implement or adapt parser.
5. Test round-trip preservation and edge cases.
6. Run platform-specific smoke tests when native code is involved.

If the parser strategy is still uncertain, build a small benchmark/prototype and record the decision in an ADR before integrating it broadly.
