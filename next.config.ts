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
};

export default nextConfig;
