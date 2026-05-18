"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  companyName: string;
}

export function DashboardLayout({ children, companyName }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar companyName={companyName} />
      <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
        <Topbar />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
