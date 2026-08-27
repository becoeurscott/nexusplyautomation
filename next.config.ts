import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.nexusplyautomation.com" }],
        destination: "https://nexusplyautomation.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
