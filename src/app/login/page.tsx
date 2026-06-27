"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { sanitizeInput, sanitizeEmail } from "@/lib/utils";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useCart } from "@/context/CartContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useCustomerAuth();
  const { addItem, toggleCart } = useCart();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = sanitizeEmail(formData.email);
    const password = sanitizeInput(formData.password);

    let result;
    if (isRegister) {
      result = await register({
        firstName: sanitizeInput(formData.firstName),
        lastName: sanitizeInput(formData.lastName),
        email,
        password,
      });
    } else {
      result = await login(email, password);
    }

    setLoading(false);

    if (result.success) {
      const pendingJson = sessionStorage.getItem("pendingCartItem");
      if (pendingJson) {
        try {
          const pendingItem = JSON.parse(pendingJson);
          addItem(pendingItem);
          sessionStorage.removeItem("pendingCartItem");
          toggleCart();
        } catch {}
      }
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect") || "/";
      router.push(redirectTo);
    } else {
      setError(result.error || "Something went wrong");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">MR</span>
          </div>
          <h1 className="text-2xl font-bold text-primary-900">
            {isRegister ? "Create an Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-primary-500 mt-2">
            {isRegister
              ? "Sign up for faster checkout and order tracking"
              : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-primary-100 rounded-xl p-6 space-y-4">
          {isRegister && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" id="reg-fname" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: sanitizeInput(e.target.value) })} required />
              <Input label="Last Name" id="reg-lname" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: sanitizeInput(e.target.value) })} required />
            </div>
          )}
          <Input label="Email" id="login-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: sanitizeEmail(e.target.value) })} required />
          <Input label="Password" id="login-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: sanitizeInput(e.target.value) })} required />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" isLoading={loading}>
            {isRegister ? "Create Account" : "Sign In"}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Demo: demo@mericahouseofrocks.ph / demo123
          </p>

          <div className="text-center text-sm text-primary-500">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => setIsRegister(false)} className="text-accent-600 font-medium hover:text-accent-700">
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => setIsRegister(true)} className="text-accent-600 font-medium hover:text-accent-700">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
