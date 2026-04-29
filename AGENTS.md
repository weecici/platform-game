# Schema & Conventions (`AGENTS.md`)

This file tells LLM agents how the `llm-wiki/` is structured, what the conventions are, and what workflows to follow when ingesting sources, answering questions, or maintaining the wiki.

The codebase is the immutable source of truth. The `llm-wiki/` is a persistent, compounding artifact managed by LLM agents.

## Operations

### Ingest Workflow

When you learn something new from the codebase or add a new feature:

1. **Read** the relevant source files.
2. **Create or Update** relevant pages in `llm-wiki/entities/`, `llm-wiki/concepts/`, or `llm-wiki/infrastructure/`.
3. **Update** `llm-wiki/index.md` to ensure every page is cataloged with a 1-line summary.
4. **Append** an entry to `llm-wiki/log.md` detailing the ingest event. Prefix the entry with `## [YYYY-MM-DD] ingest | Topic`.

### Query Workflow

When asked questions against the wiki:

1. Read `llm-wiki/index.md` to locate relevant pages.
2. Read the specific pages to synthesize an answer.
3. **Important:** If your exploration or analysis discovers something new or valuable (like a cross-system connection), file that answer back into the wiki as a new concept page.

### Lint Workflow

Periodically check for health:

- Flag contradictions.
- Look for orphan pages (no inbound links) and add cross-references.

## Formatting Rules

1. **Frontmatter:** Every `.md` file in the wiki must start with YAML frontmatter containing `tags`, `source_files`, and `last_updated`.
2. **Cross-Linking:** Use explicit relative Markdown links (e.g., `[Level Manager](../entities/level-manager.md)`) whenever mentioning another entity or concept.

## Repository Toolchain

- **Package Manager:** `pnpm` exclusively.
- **Run Dev Server:** `pnpm dev`
- **Build & Typecheck:** `pnpm build`
