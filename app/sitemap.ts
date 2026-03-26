import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://buenaonda.ai", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://buenaonda.ai/about", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://buenaonda.ai/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://buenaonda.ai/privacy-policy", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://buenaonda.ai/terms-of-service", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://buenaonda.ai/affiliates", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
