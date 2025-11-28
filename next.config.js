/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable SWC minification to avoid file access issues
  swcMinify: false,
  // Use webpack 5 but without some optimizations
  webpack: (config, { isServer }) => {
    // Disable caching that might cause file permission issues
    config.cache = false
    return config
  },
  // Experimental features
  experimental: {
    // Disable SWC if it's causing issues
    forceSwcTransforms: false,
  },
}

module.exports = nextConfig

