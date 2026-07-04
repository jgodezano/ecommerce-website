"use client";

import Link from "next/link";

export default function HowToOrder() {
  const steps = [
    {
      number: "01",
      title: "Browse Our Collection",
      description: "Explore our categories of crystals, gemstones, fossils, and jewelry. Each piece is carefully selected for quality.",
      icon: "🔮",
    },
    {
      number: "02",
      title: "Select & Quote",
      description: "Add items to your quote request or contact us directly. We provide detailed quotations within 24 hours.",
      icon: "📋",
    },
    {
      number: "03",
      title: "Secure Payment",
      description: "Pay via bank transfer, GCash, credit card, or cash on delivery. Multiple payment options for your convenience.",
      icon: "💳",
    },
    {
      number: "04",
      title: "Carefully Packed & Shipped",
      description: "Every specimen is expertly packed with protective materials. Nationwide delivery with tracking available.",
      icon: "📦",
    },
  ];

  return (
    <section className="py-10 lg:py-14 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">How to Order</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">Simple steps to get the gemstones you love</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="bg-white rounded-xl p-6 border border-gray-200 relative">
              <span className="text-5xl font-black text-gray-100 absolute top-3 right-4 select-none">{step.number}</span>
              <span className="text-3xl">{step.icon}</span>
              <h3 className="text-lg font-bold text-gray-900 mt-3 mb-2 relative">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed relative">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need help? Call us:{" "}
            <a href="tel:+639209234354" className="text-primary-600 font-semibold hover:text-primary-700">0920 923 4354</a>
          </p>
        </div>
      </div>
    </section>
  );
}
