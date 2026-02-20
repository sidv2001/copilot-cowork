import type { NextConfig } from "next";
import { resolve } from "path";

// When building for Docker, use "standalone" output to run as a Node server.
// Otherwise, use "export" for Electrobun production builds (static files).
const outputMode =
  process.env.NEXT_OUTPUT_MODE === "standalone" ? "standalone" : "export";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: outputMode,
  // Disable image optimization for static export (webview); standalone mode can use it
  images: {
    unoptimized: outputMode === "export",
  },
  turbopack: {
    // Workspace root is one level up (the monorepo root).
    // Silences the "multiple lockfiles" warning.
    root: resolve(__dirname, ".."),
  },
};

export default nextConfig;
