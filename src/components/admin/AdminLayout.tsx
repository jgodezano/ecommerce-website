"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import AdminGuard from "./AdminGuard";

const sidebarLinks = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Products", href: "/admin/products", icon: "📦" },
  { label: "Inventory", href: "/admin/inventory", icon: "📋" },
  { label: "Orders", href: "/admin/orders", icon: "🛒" },
  { label: "Quotes", href: "/admin/quotes", icon: "📄" },
  { label: "Customers", href: "/admin/customers", icon: "👥" },
  { label: "Verify", href: "/admin/verify-customers", icon: "✅" },
  { label: "Reports", href: "/admin/reports", icon: "📈" },
  { label: "Delivery", href: "/admin/delivery", icon: "🚚" },
  { label: "Profile", href: "/admin/profile", icon: "👤" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login route is public and must not render inside the authenticated shell.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 min-h-screen flex flex-col shrink-0 hidden lg:flex">
          <div className="p-4 border-b border-gray-800">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MR</span>
              </div>
              <div>
                <span className="text-white font-bold text-sm">Admin Panel</span>
                <span className="block text-[10px] text-gray-400">{user?.name}</span>
              </div>
            </Link>
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  pathname === link.href
                    ? "bg-accent-500/10 text-accent-400 font-medium"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-800">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg w-full transition-colors"
            >
              <span>🚪</span>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="flex flex-col flex-1 min-w-0">
          <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MR</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">Admin</span>
            </Link>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600">Sign Out</button>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
