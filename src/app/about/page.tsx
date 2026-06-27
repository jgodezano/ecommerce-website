"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary-900">About Merica House of Rocks</h1>
        <p className="text-primary-500 mt-4 max-w-2xl mx-auto text-lg">
          Your trusted supplier of premium natural stones and construction materials in Lipa City, Batangas. Quality products for residential and commercial projects.
        </p>
      </section>

      {/* Story */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Our Story</h2>
          <div className="space-y-4 text-primary-600">
            <p>
              Merica House of Rocks is your trusted supplier of premium natural stones and construction materials. We specialize in crazy cut stones, granite, pebbles, bricks, cobblestones, adobe, Vigan tiles, and more.
            </p>
            <p>
              Located along the National Highway in Banay-Banay, San Vicente, Lipa City, Batangas, we serve contractors, developers, hardware stores, and homeowners across the region with quality natural stone products.
            </p>
            <p>
              Our commitment to quality, competitive pricing, and exceptional customer service has made us a preferred supplier for construction and landscaping projects &mdash; from small home gardens to large-scale commercial developments.
            </p>
          </div>
        </div>
        <div className="bg-primary-100 rounded-2xl h-80 flex items-center justify-center">
          <span className="text-8xl opacity-30">🪨</span>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-16">
        {[
          { number: "10+", label: "Years in Business" },
          { number: "1,000+", label: "Happy Clients" },
          { number: "30+", label: "Product Varieties" },
          { number: "10+", label: "Cities Covered" },
        ].map((stat) => (
          <div key={stat.label} className="text-center p-6 bg-primary-50 rounded-xl">
            <p className="text-3xl font-bold text-accent-600">{stat.number}</p>
            <p className="text-sm text-primary-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-primary-900 text-center mb-8">Our Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { title: "Quality First", desc: "We never compromise on quality. Every product meets rigorous standards before reaching our customers.", icon: "⭐" },
            { title: "Customer Focus", desc: "Our customers are at the heart of everything we do. We listen, respond, and deliver solutions that work.", icon: "🤝" },
            { title: "Integrity", desc: "We conduct business with honesty and transparency. Our word is our bond.", icon: "🔒" },
          ].map((value) => (
            <div key={value.title} className="p-6 bg-white border border-primary-100 rounded-xl">
              <span className="text-3xl">{value.icon}</span>
              <h3 className="text-lg font-bold text-primary-900 mt-3 mb-2">{value.title}</h3>
              <p className="text-sm text-primary-600">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center bg-primary-900 rounded-2xl p-12">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Work With Us?</h2>
        <p className="text-primary-300 mb-6 max-w-xl mx-auto">Get in touch with our team for your construction material needs.</p>
        <div className="flex justify-center gap-4">
          <Link href="/contact"><Button size="lg">Contact Us</Button></Link>
          <Link href="/quote"><Button variant="outline" size="lg" className="border-primary-400 text-primary-200 hover:bg-white hover:text-primary-900">Request a Quote</Button></Link>
        </div>
      </section>
    </div>
  );
}
