"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { cn } from "@/lib/utils";
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  HeartIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

interface HeaderCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  featured: boolean;
}

export default function Header() {
  const [categories, setCategories] = useState<HeaderCategory[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMega, setActiveMega] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const topCategories = categories.filter((c) => c.featured);
  const otherCategories = categories.filter((c) => !c.featured);
  const { cart, toggleCart } = useCart();
  const { user: customer, isAuthenticated: isCustomer, logout: customerLogout } = useCustomerAuth();
  const megaTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleMegaEnter = (menu: string) => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setActiveMega(menu);
  };

  const handleMegaLeave = () => {
    megaTimeout.current = setTimeout(() => setActiveMega(null), 150);
  };

  useEffect(() => {
    return () => {
      if (megaTimeout.current) clearTimeout(megaTimeout.current);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* TOP BAR */}
      <div className="bg-primary-900 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-9">
          <div className="flex items-center gap-4">
            <a href="mailto:enricoamanalo@yahoo.com" className="flex items-center gap-1.5 hover:text-accent-400 transition-colors">
              <EnvelopeIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">enricoamanalo@yahoo.com</span>
            </a>
            <a href="tel:+639209234354" className="flex items-center gap-1.5 hover:text-accent-400 transition-colors">
              <PhoneIcon className="w-3.5 h-3.5" />
              <span>0920 923 4354</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-primary-300">
              <MapPinIcon className="w-3.5 h-3.5" />
              <select className="bg-transparent border-none text-xs py-0 focus:outline-none cursor-pointer">
                <option>Lipa City, Batangas</option>
              </select>
            </div>
            <span className="text-primary-500 hidden md:inline">|</span>
            {isCustomer ? (
              <>
                <Link href="/account" className="hover:text-accent-400 transition-colors">{customer?.name || "My Account"}</Link>
                <span className="text-primary-500">|</span>
                <button onClick={customerLogout} className="hover:text-accent-400 transition-colors">Sign Out</button>
              </>
            ) : (
              <Link href="/login" className="hover:text-accent-400 transition-colors">My Account</Link>
            )}
            <span className="text-primary-500">|</span>
            <Link href="/account/wishlist" className="hover:text-accent-400 transition-colors hidden sm:inline">Wishlist</Link>
            <span className="text-primary-500 hidden sm:inline">|</span>
            <Link href="/contact" className="hover:text-accent-400 transition-colors hidden sm:inline">Help</Link>
          </div>
        </div>
      </div>

      {/* MAIN HEADER - Logo + Search + Cart */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 h-16 lg:h-20">
            {/* Mobile menu */}
            <button
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-accent-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">MR</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-gray-900 leading-tight">Merica</span>
                <span className="block text-[10px] text-gray-500 -mt-0.5 tracking-wider uppercase">House of Rocks</span>
              </div>
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto lg:mx-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands, categories..."
                  className="w-full h-10 lg:h-12 pl-4 pr-12 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 bg-gray-50"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 lg:h-10 w-8 lg:w-10 flex items-center justify-center bg-accent-500 text-white rounded-md hover:bg-accent-600 transition-colors"
                >
                  <MagnifyingGlassIcon className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Right icons */}
            <div className="flex items-center gap-1 lg:gap-2">
              {isCustomer ? (
                <Link href="/account" className="hidden sm:flex flex-col items-center px-2 lg:px-3 py-1 text-gray-600 hover:text-accent-500 rounded-lg hover:bg-gray-50 transition-colors">
                  <UserIcon className="w-5 h-5" />
                  <span className="text-[10px] font-medium mt-0.5">{customer?.firstName || "Account"}</span>
                </Link>
              ) : (
                <Link href="/login" className="hidden sm:flex flex-col items-center px-2 lg:px-3 py-1 text-gray-600 hover:text-accent-500 rounded-lg hover:bg-gray-50 transition-colors">
                  <UserIcon className="w-5 h-5" />
                  <span className="text-[10px] font-medium mt-0.5">Account</span>
                </Link>
              )}
              <Link href="/account/wishlist" className="hidden sm:flex flex-col items-center px-2 lg:px-3 py-1 text-gray-600 hover:text-accent-500 rounded-lg hover:bg-gray-50 transition-colors relative">
                <HeartIcon className="w-5 h-5" />
                <span className="text-[10px] font-medium mt-0.5">Wishlist</span>
              </Link>
              <button
                onClick={toggleCart}
                className="flex flex-col items-center px-2 lg:px-3 py-1 text-gray-600 hover:text-accent-500 rounded-lg hover:bg-gray-50 transition-colors relative"
              >
                <ShoppingCartIcon className="w-5 h-5" />
                <span className="text-[10px] font-medium mt-0.5">Cart</span>
                {cart.itemCount > 0 && (
                  <span className="absolute -top-0.5 right-0 lg:right-1 w-4 h-4 bg-accent-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cart.itemCount > 9 ? "9+" : cart.itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MEGA MENU NAVIGATION */}
      <nav className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center">
            <li className="relative">
              <button
                onMouseEnter={() => handleMegaEnter("shop")}
                onMouseLeave={handleMegaLeave}
                className="flex items-center gap-1 px-4 py-3 text-sm font-semibold text-gray-700 hover:text-accent-500 hover:bg-gray-50 transition-colors"
              >
                <Bars3Icon className="w-4 h-4" />
                Shop Products
                <ChevronDownIcon className="w-3 h-3" />
              </button>
              {activeMega === "shop" && (
                <div
                  onMouseEnter={() => handleMegaEnter("shop")}
                  onMouseLeave={handleMegaLeave}
                  className="absolute top-full left-0 w-[700px] bg-white shadow-xl border border-gray-200 rounded-b-xl p-6 grid grid-cols-3 gap-6 animate-slide-down"
                >
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-accent-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg group-hover:bg-accent-100 transition-colors">
                        {["🪨", "💎", "🔮", "🧱", "🏛️", "⛰️", "🏺"][categories.indexOf(cat)]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-accent-600">{cat.name}</p>
                        <p className="text-xs text-gray-400">{cat.productCount} products</p>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href="/contact"
                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-accent-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg group-hover:bg-accent-100 transition-colors">
                      📞
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 group-hover:text-accent-600">Contact Us</p>
                      <p className="text-xs text-gray-400">Get in touch</p>
                    </div>
                  </Link>
                </div>
              )}
            </li>
            {topCategories.slice(0, 5).map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="block px-4 py-3 text-sm font-medium text-gray-600 hover:text-accent-500 hover:bg-gray-50 transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li className="relative">
              <button
                onMouseEnter={() => handleMegaEnter("more")}
                onMouseLeave={handleMegaLeave}
                className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-accent-500 hover:bg-gray-50 transition-colors"
              >
                More <ChevronDownIcon className="w-3 h-3" />
              </button>
              {activeMega === "more" && (
                <div
                  onMouseEnter={() => handleMegaEnter("more")}
                  onMouseLeave={handleMegaLeave}
                  className="absolute top-full left-0 w-48 bg-white shadow-xl border border-gray-200 rounded-b-xl py-2 animate-slide-down"
                >
                  <Link href="/estimator" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-accent-50 hover:text-accent-600">Project Estimator</Link>
                  <Link href="/gallery" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-accent-50 hover:text-accent-600">Project Gallery</Link>
                  <Link href="/quote" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-accent-50 hover:text-accent-600">Request a Quote</Link>
                  <Link href="/about" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-accent-50 hover:text-accent-600">About Us</Link>
                  <Link href="/contact" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-accent-50 hover:text-accent-600">Contact</Link>
                  <Link href="/delivery" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-accent-50 hover:text-accent-600">Delivery Info</Link>
                </div>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-gray-200 bg-white max-h-[80vh] overflow-y-auto animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Categories</p>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="block px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-accent-50 hover:text-accent-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <Link href="/estimator" className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-accent-50" onClick={() => setMobileMenuOpen(false)}>Project Estimator</Link>
              <Link href="/gallery" className="block px-3 py-2.5 text-sm text-gray-600 rounded-lg hover:bg-accent-50" onClick={() => setMobileMenuOpen(false)}>Project Gallery</Link>
              <Link href="/quote" className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-accent-50" onClick={() => setMobileMenuOpen(false)}>Request a Quote</Link>
              <Link href="/about" className="block px-3 py-2.5 text-sm text-gray-600 rounded-lg hover:bg-accent-50" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
              <Link href="/contact" className="block px-3 py-2.5 text-sm text-gray-600 rounded-lg hover:bg-accent-50" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
