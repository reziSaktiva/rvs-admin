import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserActiveCompanyContext } from "@/lib/company/active-company";
import { redirect } from "next/navigation";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const activeContext = await getCurrentUserActiveCompanyContext();
  if (!activeContext) redirect("/select-company");

  return <DashboardLayout companyName={activeContext.companyName}>{children}</DashboardLayout>;
}
