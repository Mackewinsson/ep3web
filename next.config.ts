import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Browsers/tools sometimes request /es as a locale prefix; this app has no i18n routes.
      { source: "/es", destination: "/", permanent: false },
      { source: "/es/:path*", destination: "/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
