"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface CustomerUser {
  id: string;
  email: string;
  username?: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  accountStatus?: string;
  role?: string;
}

interface CustomerAuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginId: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string; accountStatus?: string }>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    companyName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authenticated");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setIsLoading(false));
  }, [fetchUser]);

  const login = useCallback(async (loginId: string, password: string, remember: boolean = false) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginId, password, remember }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        return { success: true };
      }
      if (data.accountStatus) {
        return { success: false, error: data.error, accountStatus: data.accountStatus };
      }
      return { success: false, error: data.error || "Invalid username/email or password" };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, []);

  const register = useCallback(async (data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    companyName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  }) => {
    try {
      const body: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: data.password,
        companyName: data.companyName,
        phone: data.phone,
      };
      if (data.street || data.city) {
        body.deliveryAddress = {
          street: data.street || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
        };
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (res.ok) {
        setUser(result.user);
        return { success: true, message: result.message };
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

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && user.accountStatus === "approved",
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
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
