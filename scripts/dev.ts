/**
 * Copilot Cowork - Development Script
 *
 * Starts the Next.js dev server and launches Electrobun in development mode.
 * In dev mode, the Electrobun window points to http://localhost:3000 (Next.js dev server).
 */
import { spawn, type Subprocess } from "bun";
import { resolve } from "path";

const frontendDir = resolve(import.meta.dir, "..", "frontend");

console.log("[dev] Starting Next.js dev server...");

const nextDev: Subprocess = spawn(["bun", "run", "dev"], {
  cwd: frontendDir,
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env, PORT: "3000" },
});

// Give Next.js a few seconds to start
await new Promise((resolve) => setTimeout(resolve, 4000));

console.log("[dev] Starting Electrobun dev mode...");

// Run build:dev first, then electrobun dev
const rootDir = resolve(import.meta.dir, "..");

const buildDev: Subprocess = spawn(["bun", "run", "build:dev"], {
  cwd: rootDir,
  stdout: "inherit",
  stderr: "inherit",
  // Do NOT set NODE_ENV=development here — Next.js build requires NODE_ENV=production
});

const buildExitCode = await buildDev.exited;
if (buildExitCode !== 0) {
  console.error("[dev] build:dev failed! Continuing to launch Electrobun with previous build artifacts...");
}

const electrobunDev: Subprocess = spawn(["electrobun", "dev"], {
  cwd: rootDir,
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env, NODE_ENV: "development", COPILOT_COWORK_DEV_SERVER: "1" },
});

// Handle cleanup on exit
process.on("SIGINT", () => {
  console.log("\n[dev] Shutting down...");
  nextDev.kill();
  electrobunDev.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  nextDev.kill();
  electrobunDev.kill();
  process.exit(0);
});

await electrobunDev.exited;
nextDev.kill();
