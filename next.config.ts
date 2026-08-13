import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // URLs canônicas sem barra final — alinhado ao sitemap e aos `alternates.canonical`
  trailingSlash: false,
  // módulo nativo (binário .node) — externaliza no build do servidor em vez de empacotar
  serverExternalPackages: ["@node-rs/argon2"],
  async redirects() {
    return [{ source: "/cheiros", destination: "/clinica", permanent: true }];
  },
};

export default nextConfig;
