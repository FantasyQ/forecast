import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: `${version}+${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local"}`,
  },
};

export default nextConfig;
