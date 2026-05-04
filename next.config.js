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
  async headers() {
    // Baseline hardening. CSP intentionally permissive on inline (Next.js +
    // Clerk both inject inline scripts) and on connect (Clerk telemetry,
    // Anthropic, Stripe, Resend, Meta Graph). Tighten to a nonce-based CSP
    // when there's time to enumerate every embed.
    const securityHeaders = [
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
    ];
    return [{ source: "/(.*)", headers: securityHeaders }];
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
