// next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
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
