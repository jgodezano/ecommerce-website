"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { sanitizeInput, sanitizePhone } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useCustomerAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/account/profile");
      return;
    }
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setCompanyName(user.companyName || "");
    }
  }, [isLoading, isAuthenticated, user, router]);

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
          companyName: sanitizeInput(companyName),
          ...(showPasswordForm && currentPassword && newPassword ? {
            currentPassword,
            newPassword,
          } : {}),
        }),
      });

      if (res.ok) {
        await refreshUser();
        setMessage({ type: "success", text: "Profile updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
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

  const accountStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      pending: "text-yellow-600 bg-yellow-50",
      approved: "text-green-600 bg-green-50",
      rejected: "text-red-600 bg-red-50",
      suspended: "text-orange-600 bg-orange-50",
    };
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${styles[status || "pending"] || "text-gray-600 bg-gray-50"}`}>
        {(status || "pending").charAt(0).toUpperCase() + (status || "pending").slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-primary-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">My Profile</h1>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm text-primary-500">Account Status:</span>
        {accountStatusBadge(user.accountStatus)}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-primary-100 rounded-xl p-6 space-y-4">
        <Input label="Email" id="profile-email" type="email" value={user.email} disabled />
        <Input label="Username" id="profile-username" value={user.username || ""} disabled />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" id="profile-fname" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Last Name" id="profile-lname" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>

        <Input label="Phone Number" id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(sanitizePhone(e.target.value))} placeholder="e.g. +63 912 345 6789" />
        <Input label="Company Name" id="profile-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />

        <div className="border-t border-primary-100 pt-4">
          <button type="button" onClick={() => setShowPasswordForm(!showPasswordForm)} className="text-sm text-accent-600 hover:text-accent-700 font-medium">
            {showPasswordForm ? "Cancel Password Change" : "Change Password"}
          </button>

          {showPasswordForm && (
            <div className="mt-4 space-y-4">
              <Input label="Current Password" id="profile-current-pass" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <Input label="New Password" id="profile-new-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
              <Input label="Confirm New Password" id="profile-confirm-pass" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
          )}
        </div>

        {message && (
          <p className={`text-sm px-3 py-2 rounded-lg ${message.type === "success" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
            {message.text}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="lg" isLoading={saving}>
            Save Changes
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.push("/account")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
