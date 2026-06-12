import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/escanear",
        destination: "/scanner",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://seal-app-6y47g.ondigitalocean.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
