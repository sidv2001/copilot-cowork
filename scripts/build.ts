/**
 * Copilot Cowork - Production Build Script
 *
 * 1. Builds the Next.js frontend as a static export
 * 2. Runs the Electrobun build to bundle everything into a desktop app
 */
import { spawn } from "bun";
import { resolve } from "path";

const rootDir = resolve(import.meta.dir, "..");
const frontendDir = resolve(rootDir, "frontend");

// Step 1: Build Next.js static export
console.log("[build] Building Next.js frontend...");
const nextBuild = spawn(["bun", "run", "build"], {
  cwd: frontendDir,
  stdout: "inherit",
  stderr: "inherit",
});

const nextExitCode = await nextBuild.exited;
if (nextExitCode !== 0) {
  console.error("[build] Next.js build failed!");
  process.exit(1);
}
console.log("[build] Next.js build complete.");

// Step 2: Install root deps
console.log("[build] Installing root dependencies...");
const bunInstall = spawn(["bun", "install"], {
  cwd: rootDir,
  stdout: "inherit",
  stderr: "inherit",
});

const installExitCode = await bunInstall.exited;
if (installExitCode !== 0) {
  console.error("[build] bun install failed!");
  process.exit(1);
}

// Step 3: Run Electrobun build
console.log("[build] Running Electrobun build...");
const electrobunBuild = spawn(["electrobun", "build"], {
  cwd: rootDir,
  stdout: "inherit",
  stderr: "inherit",
});

const ebExitCode = await electrobunBuild.exited;
if (ebExitCode !== 0) {
  console.error("[build] Electrobun build failed!");
  process.exit(1);
}

console.log("[build] Production build complete!");
