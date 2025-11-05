import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'x-dtlife-app', value: 'dtlife-new' },
        ],
      },
    ]
  },
};

export default nextConfig;
