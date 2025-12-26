/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude native Node.js packages from Edge Runtime bundling
  // These packages use __dirname and other Node.js globals
  experimental: {
    serverActions: {
      allowedOrigins: undefined,
    },
    serverComponentsExternalPackages: ['sharp', 'docx', 'googleapis', 'mermaid', 'html2canvas'],
  },
  // Ensure middleware runs on Edge Runtime without Node.js dependencies
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer && nextRuntime === 'edge') {
      config.externals = config.externals || [];
      config.externals.push('sharp', 'docx', 'googleapis', 'mermaid', 'html2canvas');
    }
    return config;
  },
};

export default nextConfig;
