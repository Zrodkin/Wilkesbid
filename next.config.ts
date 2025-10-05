import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@react-email/render',
    'html-to-text',
    'selderee',
    '@selderee/plugin-htmlparser2'
  ],
};

export default nextConfig;