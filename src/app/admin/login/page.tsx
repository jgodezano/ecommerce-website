"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { sanitizeInput } from "@/lib/utils";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(sanitizeInput(email), sanitizeInput(password));
    setLoading(false);
    if (result.success) {
      router.push("/admin");
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">BM</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <Input
            label="Email"
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@mericahouseofrocks.ph"
            required
          />
          <Input
            label="Password"
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" isLoading={loading}>
            Sign In
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Demo: admin@mericahouseofrocks.ph / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
