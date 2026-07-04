"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <section className="text-center mb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary-900">About Merica House of Rocks</h1>
        <p className="text-primary-500 mt-4 max-w-2xl mx-auto text-lg">
          Your trusted source for authentic crystals, gemstones, minerals, and fossils in Lipa City, Batangas. Quality specimens for collectors, jewelers, and crystal enthusiasts.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Our Story</h2>
          <div className="space-y-4 text-primary-600">
            <p>
              Merica House of Rocks is your trusted source for authentic crystals, gemstones, minerals, fossils, and crystal jewelry. We specialize in raw crystals, polished gemstones, tumbled stones, geodes, and more.
            </p>
            <p>
              Located along the National Highway in Banay-Banay, San Vicente, Lipa City, Batangas, we serve collectors, jewelry makers, crystal enthusiasts, and retailers across the region with quality specimens.
            </p>
            <p>
              Our commitment to authenticity, fair pricing, and exceptional customer service has made us a preferred supplier for crystal and gemstone enthusiasts &mdash; from hobbyist collectors to professional jewelry designers.
            </p>
          </div>
        </div>
        <div className="bg-primary-100 rounded-2xl h-80 flex items-center justify-center">
          <span className="text-8xl opacity-30">💎</span>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-16">
        {[
          { number: "10+", label: "Years in Business" },
          { number: "1,000+", label: "Happy Customers" },
          { number: "30+", label: "Product Varieties" },
          { number: "10+", label: "Cities Covered" },
        ].map((stat) => (
          <div key={stat.label} className="text-center p-6 bg-primary-50 rounded-xl">
            <p className="text-3xl font-bold text-accent-600">{stat.number}</p>
            <p className="text-sm text-primary-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold text-primary-900 text-center mb-8">Our Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { title: "Authenticity First", desc: "We guarantee the authenticity of every specimen. No imitations or synthetics sold as natural.", icon: "💎" },
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

      <section className="text-center bg-primary-900 rounded-2xl p-12">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Your Collection?</h2>
        <p className="text-primary-300 mb-6 max-w-xl mx-auto">Get in touch with our team for your crystal and gemstone needs.</p>
        <div className="flex justify-center gap-4">
          <Link href="/contact"><Button size="lg">Contact Us</Button></Link>
          <Link href="/quote"><Button variant="outline" size="lg" className="border-primary-400 text-primary-200 hover:bg-white hover:text-primary-900">Request a Quote</Button></Link>
        </div>
      </section>
    </div>
  );
}
