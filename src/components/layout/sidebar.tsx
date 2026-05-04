"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
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
  badge?: number;
}

/** Menu utama; item dengan `items` menjadi grup accordion (default terbuka) */
export const standaloneNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Produk & Varian", href: "/produk", icon: Package },
  {
    label: "Stok",
    icon: ListIcon,
    items: [
      { label: "Bahan Baku", href: "/bahan-baku", icon: Warehouse },
      { label: "Pembelian Bahan", href: "/pembelian", icon: ShoppingCart },
      { label: "Riwayat Stok", href: "/riwayat-stok", icon: History },
      { label: "Kalkulator HPP", href: "/hpp", icon: BarChart3 },
      { label: "Resep Produksi", href: "/resep-produksi", icon: Layers },
      { label: "Post Produksi", href: "/produksi", icon: Factory },
    ],
  },
  { label: "Penjualan", href: "/penjualan", icon: Store },
  { label: "Laporan Profit", href: "/laporan", icon: FileBarChart },
  { label: "Tim", href: "/team", icon: Users2 },
  { label: "Pengaturan", href: "/pengaturan", icon: Settings },
];

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLeafLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const href = item.href ?? "";
  const active = isRouteActive(pathname, href);
  const Icon = item.icon;

  return (
    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
      <Link href={href}>
        {Icon ? <Icon /> : null}
        <span className="truncate">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 ? (
          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
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
    <Collapsible defaultOpen className="group/collapsible min-w-0 w-full">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={childActive}
            tooltip={item.label}
            className="group-data-[collapsible=icon]:hidden"
          >
            <CollapsibleTrigger type="button">
              {GroupIcon ? <GroupIcon /> : null}
              <span className="truncate">{item.label}</span>
              <ChevronDown className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <CollapsibleContent className="overflow-hidden">
        <SidebarMenu className="border-l border-sidebar-border ml-2.5 pl-2.5">
          {children.map((child, index) => (
            <SidebarMenuItem key={child.href ?? `${child.label}-${index}`}>
              <NavLeafLink item={child} pathname={pathname} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarNavigation({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item, index) => (
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
    </SidebarContent>
  );
}

export function Sidebar() {
  return (
    <SidebarRoot collapsible="icon" variant="sidebar" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[slot=sidebar-menu-button]:p-2!">
              <Link href="/" className="gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2 className="size-4 shrink-0" />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Revika Djaya</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarNavigation items={standaloneNavItems} />

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <p
          className={cn(
            "px-2 text-xs text-sidebar-foreground/60",
            "group-data-[collapsible=icon]:hidden"
          )}
        >
          © 2026 Revika Djaya
        </p>
      </SidebarFooter>

      <SidebarRail />
    </SidebarRoot>
  );
}
