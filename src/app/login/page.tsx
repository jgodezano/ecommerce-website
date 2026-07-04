"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { sanitizeInput } from "@/lib/utils";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useCustomerAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "reset" | "done">("email");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [identityFile, setIdentityFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    login: "",
    password: "",
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    confirmPassword: "",
    remember: false,
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(
      sanitizeInput(formData.login),
      sanitizeInput(formData.password),
      formData.remember
    );

    setLoading(false);

    if (result.success) {
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect") || "/";
      router.push(redirectTo);
    } else {
      setError(result.error || "Login failed");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const result = await register({
      firstName: sanitizeInput(formData.firstName),
      lastName: sanitizeInput(formData.lastName),
      email: sanitizeInput(formData.email),
      username: sanitizeInput(formData.username),
      password: sanitizeInput(formData.password),
      companyName: sanitizeInput(formData.companyName),
      phone: sanitizeInput(formData.phone),
      street: sanitizeInput(formData.street),
      city: sanitizeInput(formData.city),
      state: sanitizeInput(formData.state),
      zip: sanitizeInput(formData.zip),
    });

    if (result.success) {
      // Upload identity document if selected
      if (identityFile) {
        const uploadData = new FormData();
        uploadData.append("file", identityFile);
        try {
          await fetch("/api/auth/upload-identity", {
            method: "POST",
            body: uploadData,
          });
        } catch {}
      }
      setMessage("Registration successful! Your account is pending approval. You will be able to login once an administrator approves your account.");
      setIsRegister(false);
    } else {
      setError(result.error || "Registration failed");
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: forgotEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.resetLink) {
          setResetToken(new URLSearchParams(data.resetLink.split("?")[1]).get("reset") || "");
        }
        setMessage("If the account exists, a reset link has been sent. (Dev mode: check console)");
        setResetStep("reset");
      } else {
        setError(data.error || "Failed to process request");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password reset successfully! You can now login with your new password.");
        setResetStep("done");
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary-900">Reset Password</h1>
            <p className="text-sm text-primary-500 mt-2">Enter your email or username to receive a reset link</p>
          </div>

          {resetStep === "email" && (
            <form onSubmit={handleForgotPassword} className="bg-white border border-primary-100 rounded-xl p-6 space-y-4">
              <Input label="Email or Username" id="forgot-login" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                Send Reset Link
              </Button>
              <button type="button" onClick={() => { setShowForgot(false); setError(""); }} className="text-sm text-accent-600 hover:text-accent-700 w-full text-center">
                Back to Login
              </button>
            </form>
          )}

          {resetStep === "reset" && (
            <form onSubmit={handleResetPassword} className="bg-white border border-primary-100 rounded-xl p-6 space-y-4">
              <Input label="New Password" id="reset-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              {message && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{message}</p>}
              <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                Reset Password
              </Button>
            </form>
          )}

          {resetStep === "done" && (
            <div className="bg-white border border-primary-100 rounded-xl p-6 space-y-4 text-center">
              <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{message}</p>
              <Button onClick={() => { setShowForgot(false); setResetStep("email"); setMessage(""); }} size="lg" className="w-full">
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
              ? "Register to request quotes on our products"
              : "Sign in to your account"}
          </p>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}

        {isRegister ? (
          <form onSubmit={handleRegister} className="bg-white border border-primary-100 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" id="reg-fname" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
              <Input label="Last Name" id="reg-lname" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
            </div>
            <Input label="Email Address" id="reg-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            <Input label="Username" id="reg-username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
            <Input label="Contact Number" id="reg-phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g. +63 912 345 6789" required />
            <Input label="Company Name (optional)" id="reg-company" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />

            {/* Delivery Address */}
            <div className="border-t border-primary-100 pt-4">
              <h3 className="text-sm font-semibold text-primary-900 mb-3">Delivery Address</h3>
              <Input label="Street / Building" id="reg-street" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} placeholder="House number, street, barangay" required />
              <div className="grid grid-cols-3 gap-3 mt-3">
                <Input label="City" id="reg-city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
                <Input label="State/Province" id="reg-state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
                <Input label="ZIP Code" id="reg-zip" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} />
              </div>
            </div>

            <Input label="Password" id="reg-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
            <Input label="Confirm Password" id="reg-confirm" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />

            {/* Identity Document Upload */}
            <div className="border-t border-primary-100 pt-4">
              <h3 className="text-sm font-semibold text-primary-900 mb-1">Proof of Identity</h3>
              <p className="text-xs text-primary-500 mb-3">Upload a Government ID, Business Permit, or Valid Identification (JPG, PNG, PDF - max 5MB)</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 border-2 border-dashed border-primary-300 rounded-lg text-sm text-primary-500 hover:border-accent-400 hover:text-accent-600 transition-colors"
                >
                  {identityFile ? "Change File" : "Upload ID"}
                </button>
                {identityFile && (
                  <span className="text-sm text-primary-600 truncate max-w-[200px]">{identityFile.name}</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setError("File too large. Maximum size is 5MB.");
                      return;
                    }
                    setIdentityFile(file);
                    setError("");
                  }
                }}
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <Button type="submit" size="lg" className="w-full" isLoading={loading}>
              Create Account
            </Button>

            <div className="text-center text-sm text-primary-500">
              Already have an account?{" "}
              <button type="button" onClick={() => { setIsRegister(false); setError(""); }} className="text-accent-600 font-medium hover:text-accent-700">
                Sign In
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="bg-white border border-primary-100 rounded-xl p-6 space-y-4">
            <Input label="Email or Username" id="login-id" value={formData.login} onChange={(e) => setFormData({ ...formData, login: e.target.value })} required />
            <Input label="Password" id="login-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-primary-600 cursor-pointer">
                <input type="checkbox" checked={formData.remember} onChange={(e) => setFormData({ ...formData, remember: e.target.checked })} className="rounded border-primary-300 text-accent-500 focus:ring-accent-500" />
                Remember Me
              </label>
              <button type="button" onClick={() => setShowForgot(true)} className="text-accent-600 hover:text-accent-700 font-medium">
                Forgot Password?
              </button>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <Button type="submit" size="lg" className="w-full" isLoading={loading}>
              Sign In
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Demo: admin@mericahouseofrocks.ph / admin123
            </p>

            <div className="text-center text-sm text-primary-500">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => { setIsRegister(true); setError(""); }} className="text-accent-600 font-medium hover:text-accent-700">
                Sign Up
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
