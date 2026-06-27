"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="section-padding bg-gradient-to-r from-accent-600 to-accent-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="heading-2 text-white text-balance">
            Ready to Start Your Construction Project?
          </h2>
          <p className="text-lg text-white/80 mt-4 max-w-xl mx-auto">
            Get a personalized quote for your material requirements. Our team will respond within 24 hours with competitive pricing.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link href="/quote">
              <Button size="lg" variant="secondary" className="text-base px-8 py-3.5">
                Request a Quote
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-base px-8 py-3.5 border-white/40 text-white hover:bg-white hover:text-primary-900">
                Talk to an Expert
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
