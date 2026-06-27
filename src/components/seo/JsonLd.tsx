import { Product } from "@/types";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Merica House of Rocks",
    url: "https://mericahouseofrocks.ph",
    logo: "https://mericahouseofrocks.ph/logo.png",
    description: "Your trusted supplier of bricks, blocks, and construction materials since 2010.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+63-912-345-6789",
      contactType: "sales",
      availableLanguage: ["English", "Filipino"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Construction Ave",
      addressLocality: "Manila",
      addressCountry: "PH",
    },
    sameAs: [
      "https://facebook.com/Merica-House-of-Rocks-536319069905155/",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductSchema({ product }: { product: Product }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      "@type": "Brand",
      name: "Merica House of Rocks",
    },
    category: product.category,
    weight: {
      "@type": "QuantitativeValue",
      value: parseFloat(product.weight),
      unitCode: "KGM",
    },
    offers: {
      "@type": "Offer",
      url: `https://mericahouseofrocks.ph/products/${product.slug}`,
      priceCurrency: "PHP",
      price: product.price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      availability: product.stockStatus === "in_stock"
        ? "https://schema.org/InStock"
        : product.stockStatus === "low_stock"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    image: product.images[0],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
