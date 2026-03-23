// next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/legal/privacy", destination: "/privacy-policy", permanent: false },
      { source: "/legal/terms", destination: "/terms-of-service", permanent: false },
    ];
  },
  experimental: {
    turbo: {
      resolveAlias: {
        "@": ".",
        "@components": "./components",
        "@lib": "./lib",
      },
    },
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    config.resolve.alias["@components"] = path.resolve(__dirname, "components");
    config.resolve.alias["@lib"] = path.resolve(__dirname, "lib");
    return config;
  },
};

module.exports = nextConfig;
