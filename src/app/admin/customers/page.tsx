"use client";

import { useEffect, useState } from "react";
import { formatPrice, formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  order_count: number;
  quote_count: number;
  total_spent: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-primary-50 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Customer Management</h1>
          <p className="text-sm text-primary-500 mt-1">{customers.length} registered customers</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-primary-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Customer</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Email</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Phone</th>
                <th className="text-center px-6 py-3 font-semibold text-primary-700">Orders</th>
                <th className="text-center px-6 py-3 font-semibold text-primary-700">Quotes</th>
                <th className="text-right px-6 py-3 font-semibold text-primary-700">Total Spent</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {loading ? (
                <tr>
                  <td className="px-6 py-12 text-center text-primary-400" colSpan={7}>Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-primary-400" colSpan={7}>No customers found</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-primary-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-primary-900">{customer.name || `${customer.first_name} ${customer.last_name}`}</p>
                    </td>
                    <td className="px-6 py-4 text-primary-600">{customer.email}</td>
                    <td className="px-6 py-4 text-primary-600">{customer.phone || "—"}</td>
                    <td className="px-6 py-4 text-center text-primary-600 font-medium">{customer.order_count}</td>
                    <td className="px-6 py-4 text-center text-primary-600 font-medium">{customer.quote_count}</td>
                    <td className="px-6 py-4 text-right font-bold text-primary-900">{formatPrice(customer.total_spent)}</td>
                    <td className="px-6 py-4 text-primary-400 text-xs">{formatDate(customer.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
