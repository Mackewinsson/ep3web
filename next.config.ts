import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Browsers/tools sometimes request /es as a locale prefix; this app has no i18n routes.
      { source: "/es", destination: "/", permanent: false },
      { source: "/es/:path*", destination: "/:path*", permanent: false },
      {
        source: "/",
        has: [{ type: "host", value: "transportesep3.cl" }],
        destination: "https://www.transportesep3.cl/",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "transportesep3.cl" }],
        destination: "https://www.transportesep3.cl/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
