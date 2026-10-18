import { resolve } from 'node:path';

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://10.249.87.243:5173',
  ],
  outputFileTracingRoot: resolve(process.cwd()),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias['@'] = resolve(process.cwd());
    return config;
  },
};

export default nextConfig;
