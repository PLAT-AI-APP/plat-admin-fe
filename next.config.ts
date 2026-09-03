import type { NextConfig } from "next";
import { IS_MOCKING, LIVE_ORIGIN, LIVE_PROXY_PATH } from "./src/api/baseUri";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },

  /**
   * 목업 구간에서만 실서버를 같은 오리진으로 중계한다.
   * 이유는 `src/api/baseUri.ts`의 `LIVE_PROXY_PATH` 주석에 있다.
   */
  async rewrites() {
    if (!IS_MOCKING || !LIVE_ORIGIN) return [];

    return [
      {
        source: `${LIVE_PROXY_PATH}/:path*`,
        destination: `${LIVE_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
