import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: path.join(__dirname, "../"),
  outputFileTracingIncludes: {
    "/**": ["../data/demo/**/*", "../data/research/**/*"],
  },
};

export default nextConfig;
