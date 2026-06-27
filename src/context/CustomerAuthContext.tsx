"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface CustomerUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
}

interface CustomerAuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || "Invalid email or password" };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, []);

  const register = useCallback(async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.error || "Registration failed" };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, []);

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  return context;
}
