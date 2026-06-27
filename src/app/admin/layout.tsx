import AdminLayoutWrapper from "@/components/admin/AdminLayout";

export const metadata = {
  title: "Admin Dashboard | Merica House of Rocks",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
