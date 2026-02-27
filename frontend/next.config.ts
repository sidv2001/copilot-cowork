import type { NextConfig } from "next";

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
};

export default nextConfig;
