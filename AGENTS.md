# AGENTS.md

This file contains high-signal context to help agents work effectively in this repository.

## Commands & Toolchain

- **Package Manager:** Use `pnpm` exclusively. Do not use `npm` or `yarn`.
- **Run Dev Server:** `pnpm dev` (Vite)
- **Build & Typecheck:** `pnpm build` (runs `tsc --noEmit && vite build`).
- **Tests/Linting:** There is currently no formal test suite or linter configured. Rely on `pnpm build` for TypeScript validation.

## Architecture & Boundaries

- `src/main.ts`: The central orchestrator (`Game` class). Binds inputs, physics, rendering, and game loops.
- `src/core/`: Low-level engine wrappers (`Engine` for Three.js, `PhysicsWorld` for Cannon-es, `InputManager`).
- `src/entities/`: Gameplay objects with physics bodies (e.g., `PlayerController`).
- `src/systems/`: High-level game mechanics (e.g., `BlockInventory`, `PrimitivePlacementSystem`, `LightingSystem`).
- `src/levels/`: Level configuration and data.

## Persistent Knowledge Base (`llm-wiki/`)

- This repository maintains a persistent, structured knowledge base in the `llm-wiki/` directory.
- **CRITICAL:** When adding new code, exploring undocumented areas, or modifying architecture, **update the `llm-wiki`!**
- Do not just read from it; actively integrate new findings, update entity pages, and revise topic summaries. Keep the knowledge compiled and current.

## Code Conventions

- Use the Vite `@/` alias for absolute imports from the `src` directory (e.g., `import { Engine } from '@/core/engine'`).
