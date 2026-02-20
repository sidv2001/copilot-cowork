# Copilot Cowork

A desktop application built with **Electrobun** (backend) and **Next.js** (frontend), powered by **Bun**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Runtime | [Electrobun](https://blackboard.sh/electrobun/docs/) v1.13.1 |
| JS Runtime | [Bun](https://bun.sh/) |
| Frontend | [Next.js](https://nextjs.org/) 16 + React 19 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) v4 |
| Language | TypeScript |

## Project Structure

```
copilot-cowork/
├── src/
│   ├── bun/
│   │   └── index.ts          # Electrobun main process (creates windows, menus)
│   └── ui/
│       ├── index.ts           # Webview bridge (Electrobun <-> browser APIs)
│       └── index.html         # Fallback HTML shell for production builds
├── frontend/                  # Next.js app (the actual UI)
│   ├── src/app/
│   │   ├── page.tsx           # Home page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── next.config.ts         # Next.js config (static export enabled)
│   └── package.json
├── scripts/
│   ├── dev.ts                 # Development script (starts Next.js + Electrobun)
│   └── build.ts               # Production build script
├── electrobun.config.ts       # Electrobun build configuration
├── package.json               # Root package.json with all scripts
└── tsconfig.json
```

## Prerequisites

- [Bun](https://bun.sh/) installed globally
- Windows 11+, macOS 14+, or Ubuntu 22.04+

## Getting Started

### Install dependencies

```bash
bun install
```

This also installs frontend dependencies via the `postinstall` script.

### Development mode

**Option A** — Run the Next.js dev server only (for rapid UI iteration):

```bash
bun run dev:next
```

Then open http://localhost:3000 in your browser.

**Option B** — Run the full desktop app in dev mode:

```bash
bun run dev
```

This starts the Next.js dev server on port 3000, then launches Electrobun pointing the window at `http://localhost:3000`.

### Production build

Build the Next.js static export and package the Electrobun desktop app:

```bash
bun run build:prod
```

### Quick start (build + launch)

```bash
bun start
```

## How It Works

### Development Flow

1. Next.js dev server runs on `http://localhost:3000` with hot reload
2. Electrobun opens a native window pointing to the dev server
3. Edit `frontend/src/app/` files — changes appear instantly

### Production Flow

1. Next.js builds a static export to `frontend/out/`
2. Electrobun bundles everything: the bun main process, webview bridge, and static files
3. The app loads UI via `views://` protocol from the bundled assets

### Architecture

```
┌─────────────────────────────────────┐
│         Electrobun (Native)         │
│  ┌───────────────────────────────┐  │
│  │   Bun Main Process            │  │
│  │   src/bun/index.ts            │  │
│  │   - Window management         │  │
│  │   - Application menus         │  │
│  │   - Native APIs               │  │
│  └──────────┬────────────────────┘  │
│             │ IPC / views://        │
│  ┌──────────▼────────────────────┐  │
│  │   System WebView              │  │
│  │   ┌────────────────────────┐  │  │
│  │   │  Next.js Frontend      │  │  │
│  │   │  (React + Tailwind)    │  │  │
│  │   └────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Scripts Reference

| Script | Description |
|--------|------------|
| `bun run dev` | Full desktop dev mode (Next.js + Electrobun) |
| `bun run dev:next` | Next.js dev server only (port 3000) |
| `bun run build:frontend` | Build Next.js static export |
| `bun run build:dev` | Electrobun dev build |
| `bun run build:prod` | Full production build (Next.js + Electrobun) |
| `bun start` | Build and launch in dev mode |

## Learn More

- [Electrobun Docs](https://blackboard.sh/electrobun/docs/)
- [Electrobun GitHub](https://github.com/blackboardsh/electrobun)
- [Next.js Docs](https://nextjs.org/docs)
- [Bun Docs](https://bun.sh/docs)
