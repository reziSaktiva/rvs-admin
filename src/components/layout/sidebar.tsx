"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CircleDot,
  Building2,
  ChevronDown,
  Factory,
  FileBarChart,
  History,
  LayoutDashboard,
  Layers,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Users2,
  Warehouse,
  ListIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface NavItem {
  label: string;
  href?: string;
  items?: NavItem[];
  icon?: LucideIcon;
  badge?: string | number;
}

type NavSection = {
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    label: "Operasional",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Produk & Varian", href: "/produk", icon: Package },
      {
        label: "Stok",
        icon: ListIcon,
        items: [
          { label: "Bahan Baku", href: "/bahan-baku", icon: Warehouse },
          { label: "Pembelian Bahan", href: "/pembelian", icon: ShoppingCart },
          { label: "Riwayat", href: "/riwayat-stok", icon: History },
          { label: "Kalkulator HPP", href: "/hpp", icon: BarChart3 },
          { label: "Resep Produksi", href: "/resep-produksi", icon: Layers },
          { label: "Post Produksi", href: "/produksi", icon: Factory },
        ],
      },
    ],
  },
  {
    label: "Bisnis",
    items: [
      { label: "Penjualan", href: "/penjualan", icon: Store, badge: "beta" },
      { label: "Laporan Profit", href: "/laporan", icon: FileBarChart, badge: "beta" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { label: "Tim", href: "/team", icon: Users2 },
      { label: "Pengaturan", href: "/pengaturan", icon: Settings, badge: "beta" },
    ],
  },
];

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLeafLink({
  item,
  pathname,
  nested = false,
}: {
  item: NavItem;
  pathname: string;
  nested?: boolean;
}) {
  const href = item.href ?? "";
  const active = isRouteActive(pathname, href);
  const Icon = item.icon;

  return (
    <SidebarMenuButton
      asChild
      isActive={active}
      tooltip={item.label}
      className={cn(
        "rounded-xl border border-transparent transition-all",
        "data-[active=true]:border-sidebar-border/70 data-[active=true]:bg-sidebar-accent/90",
        nested ? "h-9 px-2.5 text-[13px]" : "h-10"
      )}
    >
      <Link href={href} className="gap-2.5">
        <span
          className={cn(
            "flex items-center justify-center rounded-md",
            nested ? "size-6" : "size-7",
            active
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "bg-sidebar-accent/60 text-sidebar-foreground/80"
          )}
        >
          {Icon ? <Icon className={nested ? "size-3.5" : "size-4"} /> : null}
        </span>
        <span className="truncate">{item.label}</span>
        {item.badge !== undefined ? (
          <span
            className={cn(
              "ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              active
                ? "bg-sidebar-primary/15 text-sidebar-primary"
                : "bg-sidebar-accent/80 text-sidebar-foreground/70",
              "group-data-[collapsible=icon]:hidden"
            )}
          >
            {item.badge}
          </span>
        ) : null}
      </Link>
    </SidebarMenuButton>
  );
}

function NavCollapsibleGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const children = item.items ?? [];
  const GroupIcon = item.icon;
  const childActive = children.some(
    (c) => c.href !== undefined && isRouteActive(pathname, c.href)
  );

  return (
    <Collapsible defaultOpen={childActive} className="group/collapsible min-w-0 w-full">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={childActive}
            tooltip={item.label}
            className={cn(
              "h-10 rounded-xl border border-transparent transition-all",
              "data-[active=true]:border-sidebar-border/70 data-[active=true]:bg-sidebar-accent/90",
              "group-data-[collapsible=icon]:hidden"
            )}
          >
            <CollapsibleTrigger type="button" className="gap-2.5">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-md",
                  childActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "bg-sidebar-accent/60 text-sidebar-foreground/80"
                )}
              >
                {GroupIcon ? <GroupIcon className="size-4" /> : null}
              </span>
              <span className="truncate">{item.label}</span>
              <ChevronDown className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <CollapsibleContent className="overflow-hidden">
        <SidebarMenu className="ml-3 mt-1 border-l border-sidebar-border/70 pl-3">
          {children.map((child, index) => (
            <SidebarMenuItem key={child.href ?? `${child.label}-${index}`}>
              <NavLeafLink item={child} pathname={pathname} nested />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarNavigation({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <SidebarContent className="gap-3 py-2">
      {sections.map((section) => (
        <SidebarGroup key={section.label} className="px-2 py-0">
          <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/55">
            {section.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item, index) => (
                <SidebarMenuItem key={item.href ?? `${item.label}-${index}`}>
                  {item.items && item.items.length > 0 ? (
                    <NavCollapsibleGroup item={item} pathname={pathname} />
                  ) : (
                    <NavLeafLink item={item} pathname={pathname} />
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}

export function Sidebar({ companyName }: { companyName: string }) {
  return (
    <SidebarRoot
      collapsible="icon"
      variant="sidebar"
      className="border-r border-sidebar-border bg-sidebar/95 backdrop-blur"
    >
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className={cn(
                "h-auto rounded-xl border border-sidebar-border/80 bg-linear-to-r from-sidebar-accent/80 to-sidebar-accent/40 px-2.5 py-2",
                "data-[slot=sidebar-menu-button]:p-2!"
              )}
            >
              <Link href="/" className="gap-2.5">
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                  <Building2 className="size-4.5 shrink-0" />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">{companyName}</span>
                  <span className="truncate text-xs text-sidebar-foreground/65">Admin Dashboard</span>
                </div>
                <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500 group-data-[collapsible=icon]:hidden">
                  live
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarNavigation sections={navSections} />

      <SidebarFooter className="border-t border-sidebar-border px-3 py-2">
        <div
          className={cn(
            "flex items-center justify-between rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 px-2.5 py-2 text-xs",
            "group-data-[collapsible=icon]:hidden"
          )}
        >
          <div>
            <p className="font-medium text-sidebar-foreground/85">Sistem aktif</p>
            <p className="text-sidebar-foreground/60">Pantau operasional harian</p>
          </div>
          <CircleDot className="size-4 text-emerald-500" />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </SidebarRoot>
  );
}
