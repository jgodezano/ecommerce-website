"use client";

import Link from "next/link";

export default function ValueAddedServices() {
  const services = [
    {
      title: "Crystal Identification",
      description: "Not sure what you're looking at? We provide expert crystal and mineral identification services for collectors and enthusiasts.",
      icon: "🔍",
      href: "/contact",
    },
    {
      title: "Custom Orders",
      description: "Looking for something specific? We source custom gemstones, fossils, and mineral specimens from around the world.",
      icon: "🌍",
      href: "/quote",
    },
    {
      title: "Bulk Wholesale",
      description: "Competitive wholesale pricing for retailers, jewelry makers, and crystal shops. Minimum orders welcome.",
      icon: "📦",
      href: "/quote",
    },
    {
      title: "Jewelry Repairs",
      description: "We offer professional restringing and repair services for your crystal jewelry and gemstone pieces.",
      icon: "🔧",
      href: "/contact",
    },
  ];

  return (
    <section className="py-10 lg:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Value-Added Services</h2>
          <p className="text-gray-500 mt-2">More than just a crystal shop &mdash; we&apos;re your gemstone partner</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className="group bg-gray-50 rounded-xl p-6 border border-gray-100 hover:bg-primary-50 hover:border-primary-200 transition-all"
            >
              <span className="text-3xl">{service.icon}</span>
              <h3 className="text-base font-bold text-gray-900 mt-3 group-hover:text-primary-600 transition-colors">{service.title}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{service.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
