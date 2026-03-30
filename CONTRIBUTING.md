# Contributing to OpenMD

Thank you for your interest in contributing!

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 10+
- [Rust](https://rustup.rs/) stable toolchain
- [Tauri prerequisites for Windows](https://tauri.app/start/prerequisites/)

## Local Setup

```bash
git clone https://github.com/AomineD/OpenMD.git
cd OpenMD
pnpm install
pnpm tauri dev
```

## Running Tests

```bash
pnpm test
```

## Code Style

- **TypeScript strict mode** — no `any`, no implicit types
- **Tailwind CSS** for all styling — no inline styles
- **English names** for all files, variables, and components
- **Zustand** for shared state — no React Context for global state
- **`@/` alias** for imports from `src/`
- **Monaco always lazy** — never import Monaco in the main bundle

## Pull Request Guidelines

1. Create a feature branch from `main` (e.g., `feature/my-feature`)
2. Keep commits focused — one logical change per commit
3. Run `pnpm test` and ensure all tests pass before submitting
4. Describe what changed and why in the PR description
5. No unrelated refactors or style changes in the same PR

## Reporting Issues

Open an issue at [github.com/AomineD/OpenMD/issues](https://github.com/AomineD/OpenMD/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- OpenMD version and Windows version
