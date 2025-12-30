/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      '@mantine/core',
      '@mantine/form',
      '@mantine/hooks',
      '@mantine/modals',
      '@mantine/notifications',
    ],
  },
};

export default nextConfig;
