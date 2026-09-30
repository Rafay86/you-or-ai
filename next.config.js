/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `npm run build:static` writes a fully static site to ./out for Firebase Hosting, Netlify, S3, etc.
  ...(process.env.STATIC_EXPORT ? { output: 'export' } : {}),
  // Lets a production build run without disturbing a running dev server.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
}

module.exports = nextConfig
