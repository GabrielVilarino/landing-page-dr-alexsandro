import { AdminShell } from "@/components/admin/admin-shell";

export default function PrivateAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
