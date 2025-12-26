/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Node.js runtime globally to avoid __dirname issues
  experimental: {
    serverActions: {
      allowedOrigins: undefined,
    },
  },
};

export default nextConfig;
