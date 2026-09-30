/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a production build run without disturbing a running dev server.
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

module.exports = nextConfig
