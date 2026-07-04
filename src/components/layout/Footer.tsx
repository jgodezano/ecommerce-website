"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface FooterCategory {
  id: string;
  name: string;
  slug: string;
}

export default function Footer() {
  const [categories, setCategories] = useState<FooterCategory[]>([]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories((data.categories || []).slice(0, 8)))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-primary-900 text-primary-300">
      <div className="border-b border-primary-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-lg">Stay Updated</h3>
              <p className="text-sm text-primary-400">Get the latest crystal arrivals and promos delivered to your inbox</p>
            </div>
            <form className="flex w-full sm:w-auto gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 sm:w-72 px-4 py-2.5 rounded-lg bg-primary-800 border border-primary-700 text-sm text-white placeholder-primary-400 focus:outline-none focus:border-accent-500"
              />
              <button className="px-6 py-2.5 bg-accent-500 text-white text-sm font-semibold rounded-lg hover:bg-accent-600 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">MR</span>
              </div>
              <div>
                <span className="text-lg font-bold text-white">Merica</span>
                <span className="block text-[10px] text-primary-400 -mt-0.5 tracking-wider uppercase">House of Rocks</span>
              </div>
            </div>
            <p className="text-sm text-primary-400 leading-relaxed mb-4">
              Your trusted source for authentic crystals, gemstones, minerals, and fossils in Lipa City, Batangas. Quality specimens for collectors, jewelers, and crystal enthusiasts.
            </p>
            <div className="flex items-center gap-2">
              <a href="https://www.facebook.com/Merica-House-of-Rocks-536319069905155/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-primary-800 flex items-center justify-center text-xs font-bold text-primary-400 hover:bg-accent-500 hover:text-white transition-all">
                FB
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Categories</h3>
            <ul className="space-y-2">
              {categories.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/categories/${cat.slug}`} className="text-sm text-primary-400 hover:text-accent-400 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Customer Service</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-sm text-primary-400 hover:text-accent-400 transition-colors">Help & Contact</Link></li>
              <li><Link href="/quote" className="text-sm text-primary-400 hover:text-accent-400 transition-colors">Request a Quote</Link></li>
              <li><Link href="/delivery" className="text-sm text-primary-400 hover:text-accent-400 transition-colors">Delivery Information</Link></li>
              <li><Link href="/returns" className="text-sm text-primary-400 hover:text-accent-400 transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/faq" className="text-sm text-primary-400 hover:text-accent-400 transition-colors">FAQ</Link></li>
              <li><Link href="/about" className="text-sm text-primary-400 hover:text-accent-400 transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-accent-500 text-sm mt-0.5">📍</span>
                <span className="text-sm text-primary-400">National Highway, Banay-Banay, San Vicente, Lipa City, Batangas</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-500 text-sm">📞</span>
                <div>
                  <a href="tel:+639209234354" className="text-sm text-primary-400 hover:text-accent-400 block">0920 923 4354</a>
                  <a href="tel:+639228110020" className="text-sm text-primary-400 hover:text-accent-400 block">0922 811 0020 (Enrico)</a>
                  <a href="tel:+639228110019" className="text-sm text-primary-400 hover:text-accent-400 block">0922 811 0019 (Myra)</a>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-500 text-sm">✉️</span>
                <a href="mailto:enricoamanalo@yahoo.com" className="text-sm text-primary-400 hover:text-accent-400">enricoamanalo@yahoo.com</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Store Hours</h3>
            <ul className="space-y-2 text-sm text-primary-400">
              <li className="flex justify-between"><span>Mon - Fri</span><span>6:00 AM - 6:00 PM</span></li>
              <li className="flex justify-between"><span>Saturday</span><span>7:00 AM - 5:00 PM</span></li>
              <li className="flex justify-between"><span>Sunday</span><span className="text-red-400">Closed</span></li>
            </ul>
            <div className="mt-4 pt-4 border-t border-primary-800">
              <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-2">Payment Methods</h4>
              <div className="flex flex-wrap gap-2">
                {["Visa", "MC", "GCash", "BPI", "BDO", "COD"].map((p) => (
                  <span key={p} className="px-2.5 py-1 bg-primary-800 rounded text-xs font-medium text-primary-300">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-500">&copy; {currentYear} Merica House of Rocks. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-primary-500">
            <Link href="/privacy" className="hover:text-accent-400">Privacy Policy</Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-accent-400">Terms & Conditions</Link>
            <span>|</span>
            <Link href="/delivery" className="hover:text-accent-400">Delivery Info</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
