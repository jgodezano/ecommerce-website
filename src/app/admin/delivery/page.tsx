"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  min_order_for_free: number | null;
  estimated_days: string;
}

export default function AdminDeliveryPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", fee: "", minOrderForFree: "", estimatedDays: "" });

  useEffect(() => {
    fetch("/api/admin/delivery")
      .then((res) => res.json())
      .then((data) => setZones(data.zones || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (zone: DeliveryZone) => {
    setEditingId(zone.id);
    setEditForm({
      name: zone.name,
      fee: String(zone.fee),
      minOrderForFree: zone.min_order_for_free ? String(zone.min_order_for_free) : "",
      estimatedDays: zone.estimated_days || "",
    });
  };

  const saveEdit = async (zoneId: string) => {
    try {
      await fetch("/api/admin/delivery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId,
          name: editForm.name,
          fee: parseFloat(editForm.fee) || 0,
          minOrderForFree: editForm.minOrderForFree ? parseFloat(editForm.minOrderForFree) : null,
          estimatedDays: editForm.estimatedDays,
        }),
      });
      const res = await fetch("/api/admin/delivery");
      const data = await res.json();
      setZones(data.zones || []);
      setEditingId(null);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-primary-50 p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-primary-900 mb-6">Delivery Management</h1>
      <div className="bg-white rounded-xl border border-primary-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary-50">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-primary-700">Zone</th>
              <th className="text-left px-6 py-3 font-semibold text-primary-700">Delivery Fee</th>
              <th className="text-left px-6 py-3 font-semibold text-primary-700">Free Shipping Min</th>
              <th className="text-left px-6 py-3 font-semibold text-primary-700">Estimated Time</th>
              <th className="text-right px-6 py-3 font-semibold text-primary-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100">
            {loading ? (
              <tr>
                <td className="px-6 py-12 text-center text-primary-400" colSpan={5}>Loading...</td>
              </tr>
            ) : zones.length === 0 ? (
              <tr>
                <td className="px-6 py-12 text-center text-primary-400" colSpan={5}>No delivery zones configured.</td>
              </tr>
            ) : (
              zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-primary-50">
                  <td className="px-6 py-4 font-medium text-primary-900">
                    {editingId === zone.id ? (
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded border border-primary-300 px-2 py-1 text-sm focus:outline-none focus:border-accent-500" />
                    ) : zone.name}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === zone.id ? (
                      <input type="number" value={editForm.fee} onChange={(e) => setEditForm({ ...editForm, fee: e.target.value })}
                        className="w-24 rounded border border-primary-300 px-2 py-1 text-sm focus:outline-none focus:border-accent-500" />
                    ) : zone.fee === 0 ? <span className="text-green-600 font-medium">Free</span> : formatPrice(zone.fee)}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === zone.id ? (
                      <input type="number" value={editForm.minOrderForFree} onChange={(e) => setEditForm({ ...editForm, minOrderForFree: e.target.value })}
                        className="w-24 rounded border border-primary-300 px-2 py-1 text-sm focus:outline-none focus:border-accent-500" />
                    ) : zone.min_order_for_free ? formatPrice(zone.min_order_for_free) : "—"}
                  </td>
                  <td className="px-6 py-4 text-primary-600">
                    {editingId === zone.id ? (
                      <input value={editForm.estimatedDays} onChange={(e) => setEditForm({ ...editForm, estimatedDays: e.target.value })}
                        className="w-32 rounded border border-primary-300 px-2 py-1 text-sm focus:outline-none focus:border-accent-500" />
                    ) : zone.estimated_days}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === zone.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => saveEdit(zone.id)} className="px-3 py-1.5 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-lg">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-50 rounded-lg">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(zone)} className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 rounded-lg">Edit</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
