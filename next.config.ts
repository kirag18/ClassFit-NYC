import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Docker build: produces a minimal, self-contained
  // server bundle in .next/standalone that the runtime image copies.
  output: "standalone",
};

export default nextConfig;
