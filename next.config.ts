import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // keep Turbopack rooted at this project (a stray pnpm-workspace.yaml lives
  // in the home directory, which otherwise triggers a build warning)
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
