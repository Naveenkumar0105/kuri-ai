import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "service-worker.js",
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [{
      urlPattern: ({ sameOrigin, url }: { sameOrigin: boolean; url: URL }) => sameOrigin && url.pathname.startsWith("/api/"),
      handler: "NetworkOnly",
      method: "GET",
      options: { cacheName: "apis" },
    }],
  },
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
