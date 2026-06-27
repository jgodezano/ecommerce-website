"use client";

import Link from "next/link";

export default function ValueAddedServices() {
  const services = [
    {
      title: "Free Estimation",
      description: "We provide free estimation of your material requirements. Just tell us your project specs and we'll calculate what you need.",
      icon: "📐",
      href: "/contact",
    },
    {
      title: "Detailed Quotation",
      description: "Get a full and detailed quotation for your orders. We respond within 24 hours with competitive pricing.",
      icon: "📋",
      href: "/quote",
    },
    {
      title: "Professional Installation",
      description: "We render professional installation of your chosen products. Experienced team for natural stone and masonry work.",
      icon: "👷",
      href: "/contact",
    },
    {
      title: "Sign & Seal Services",
      description: "We offer signing and sealing of Electronics Plan/Permit by a Professional Electronics Engineer.",
      icon: "🔏",
      href: "/contact",
    },
  ];

  return (
    <section className="py-10 lg:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Value-Added Services</h2>
          <p className="text-gray-500 mt-2">More than just a supplier &mdash; we&apos;re your construction partner</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className="group bg-gray-50 rounded-xl p-6 border border-gray-100 hover:bg-accent-50 hover:border-accent-200 transition-all"
            >
              <span className="text-3xl">{service.icon}</span>
              <h3 className="text-base font-bold text-gray-900 mt-3 group-hover:text-accent-600 transition-colors">{service.title}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{service.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
