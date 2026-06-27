import { MetadataRoute } from "next";
import { categories } from "@/data/categories";
import { products } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://mericahouseofrocks.ph";

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/quote`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${baseUrl}/cart`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  const categoryPages = categories.map((cat) => ({
    url: `${baseUrl}/categories/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const productPages = products.map((prod) => ({
    url: `${baseUrl}/products/${prod.slug}`,
    lastModified: new Date(prod.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
