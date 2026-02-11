/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      // Add allowed image domains here
      // { protocol: 'https', hostname: 'example.com' },
    ],
  },

  // Experimental features (add as needed)
  // experimental: {},
};

module.exports = nextConfig;
