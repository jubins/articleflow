/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Node.js runtime globally to avoid __dirname issues
  experimental: {
    serverActions: {
      allowedOrigins: undefined,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
