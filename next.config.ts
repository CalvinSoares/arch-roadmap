import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // URLs canônicas sem barra final — alinhado ao sitemap e aos `alternates.canonical`
  trailingSlash: false,
  async redirects() {
    return [{ source: "/cheiros", destination: "/clinica", permanent: true }];
  },
};

export default nextConfig;
