# OpenMD

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)

A fast, lightweight Markdown viewer and editor for Windows 10/11. Built with Tauri 2 + React 19.

## Features

- **Viewer-first**: Instant Markdown preview with syntax highlighting and full GFM support
- **Monaco Editor**: Full-featured editing with the same engine powering VS Code
- **Multi-tab interface**: Open multiple files simultaneously with tab management
- **Recent Files**: Sidebar with persistent history of recently opened files
- **Auto Save**: Configurable automatic saving with dirty state tracking
- **File Associations**: Opens `.md` and `.markdown` files directly from Windows Explorer
- **Single Instance**: Forwards new file opens to the existing window
- **Persistent Settings**: Window size, word wrap, font size, and auto-save preferences persist between sessions
- **Auto Updates**: Checks for updates from GitHub Releases on startup

## Screenshots

<!-- Add screenshots here -->

## Installation

Download the latest NSIS installer from [GitHub Releases](https://github.com/AomineD/OpenMD/releases) and run it.

After installation, `.md` and `.markdown` files will open with OpenMD by default.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 10+
- [Rust](https://rustup.rs/) stable
- [Tauri prerequisites for Windows](https://tauri.app/start/prerequisites/)

### Setup

```bash
git clone https://github.com/AomineD/OpenMD.git
cd OpenMD
pnpm install
```

### Run in development

```bash
pnpm tauri dev
```

### Build for production

```bash
pnpm tauri build
```

The NSIS installer will be generated at `src-tauri/target/release/bundle/nsis/`.

### Run tests

```bash
pnpm test
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) © AomineD
