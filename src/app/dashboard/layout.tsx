import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";
import { DashboardShell } from "./DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <ToastProvider>
      <DashboardShell username={user.username}>{children}</DashboardShell>
    </ToastProvider>
  );
}
