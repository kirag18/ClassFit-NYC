import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Docker build: produces a minimal, self-contained
  // server bundle in .next/standalone that the runtime image copies.
  output: "standalone",

  // lib/db.ts opens the SQLite file via a path built at runtime
  // (`join(process.cwd(), "data", "classfit.db")`), which the build's file
  // tracer can't see statically -- so without this the database is left out
  // of the serverless bundle and every query 500s in production.
  outputFileTracingIncludes: {
    "/**/*": ["./data/**"],
  },
};

export default nextConfig;
