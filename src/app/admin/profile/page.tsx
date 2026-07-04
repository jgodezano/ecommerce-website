"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { sanitizeInput, sanitizePhone } from "@/lib/utils";

export default function AdminProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAdminAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: sanitizeInput(firstName),
          lastName: sanitizeInput(lastName),
          phone: sanitizePhone(phone),
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profile updated successfully" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your personal information</p>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <Input
          label="Email"
          id="admin-profile-email"
          type="email"
          value={user.email}
          disabled
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            id="admin-profile-fname"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Last Name"
            id="admin-profile-lname"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <Input
          label="Phone Number"
          id="admin-profile-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(sanitizePhone(e.target.value))}
          placeholder="e.g. +63 912 345 6789"
        />

        {message && (
          <p className={`text-sm px-3 py-2 rounded-lg ${message.type === "success" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
            {message.text}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="lg" isLoading={saving}>
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/admin")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
