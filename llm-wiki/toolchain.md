# Toolchain & Infrastructure

- **Bundler:** Vite (`vite.config.ts`), configured to build to `ES2020` and output to the `dist/` directory.
- **Types:** TypeScript (`tsconfig.json`). Typechecking is enforced during the `build` script via `tsc --noEmit`.
- **Environment Management:** The repo includes a `flake.nix` and `.envrc`, indicating Nix is used for reproducible development environments (likely supplying Node.js and `pnpm`).

## Runtime Tooling

- **Debug Interface:** Uses `lil-gui` to render an interactive debugging panel (`src/ui/debug-ui.ts`) at runtime, allowing real-time affine transformations (translate, rotate, scale) of primitives.

## Assets

- **Models:** Uses standard WebGL formats (like `.gltf` for the player character via `GLTFLoader`) but importantly references Apple's `.usdz` format for decorative static models (trees, clouds) in `level-data.ts`.
