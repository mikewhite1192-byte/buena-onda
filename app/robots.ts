import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/start/", "/playground/", "/owner/", "/portal/"],
    },
    sitemap: "https://buenaonda.ai/sitemap.xml",
  };
}
