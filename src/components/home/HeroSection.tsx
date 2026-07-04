"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const slides = [
  {
    title: "Premium Crystals, Gemstones & Fossils",
    subtitle: "Your trusted source for authentic mineral specimens, polished gemstones, crystal jewelry, and fossils in Lipa City, Batangas.",
    cta: "Shop Products",
    href: "/categories/raw-crystals",
    cta2: "Request a Quote",
    href2: "/quote",
    accent: "from-primary-500 to-primary-600",
    bg: "bg-gradient-to-r",
    image: "💎",
  },
  {
    title: "Wholesale Orders for Retailers & Designers",
    subtitle: "Competitive wholesale pricing for jewelry makers, crystal shops, and collectors. From tumbled stones to large geodes — we supply all your gemstone needs.",
    cta: "Get a Quote",
    href: "/quote",
    cta2: "Browse Products",
    href2: "/categories/tumbled-stones",
    accent: "from-primary-800 to-primary-900",
    bg: "bg-gradient-to-r",
    image: "📿",
  },
  {
    title: "Visit Our Showroom in Lipa City, Batangas",
    subtitle: "Located along the National Highway in Banay-Banay, San Vicente. Call us at 0920 923 4354 for inquiries and custom orders.",
    cta: "Contact Us",
    href: "/contact",
    cta2: "View Products",
    href2: "/categories/geodes-clusters",
    accent: "from-primary-700 to-primary-800",
    bg: "bg-gradient-to-r",
    image: "🔮",
  },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative bg-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="relative min-h-[400px] sm:min-h-[450px] lg:min-h-[500px] flex items-center">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 flex items-center transition-all duration-700 ease-in-out ${
                i === current ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
                <div className="order-2 lg:order-1">
                  <div className="inline-block px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-600 text-sm font-medium mb-4">
                    Lipa City&apos;s Premier Gemstone & Mineral Source
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight text-balance">
                    {slide.title}
                  </h1>
                  <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-xl leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-6">
                    <Link href={slide.href}>
                      <Button size="lg" className="text-base px-8 py-3.5">
                        {slide.cta}
                      </Button>
                    </Link>
                    <Link href={slide.href2}>
                      <Button variant="outline" size="lg" className="text-base px-8 py-3.5 border-gray-300 text-gray-700 hover:bg-primary-900 hover:text-white hover:border-primary-900">
                        {slide.cta2}
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                  <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 gem-gradient-light rounded-2xl flex items-center justify-center">
                    <span className="text-8xl sm:text-9xl opacity-60">{slide.image}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-primary-500 hover:border-primary-500 shadow-sm transition-all z-10"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-primary-500 hover:border-primary-500 shadow-sm transition-all z-10"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center gap-2 pb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === current ? "bg-primary-500 w-6" : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
