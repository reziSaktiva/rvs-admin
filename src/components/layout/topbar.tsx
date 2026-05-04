"use client";

import { Bell, LogOut, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { logout } from "@/app/(auth)/actions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTransition } from "react";

export function Topbar() {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-4 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        <SidebarTrigger className="-ml-1 text-foreground md:flex" />
        <Separator orientation="vertical" className="hidden h-6 md:block" />
        {/* Search */}
        <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari..." className="h-9 w-full pl-9 text-sm" />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        {/* Notification */}
        <div className="relative">
          <Button variant="outline" size="icon" aria-label="Notifikasi">
            <Bell className="h-4 w-4" />
          </Button>
          <Badge className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center p-0 text-[10px]">
            3
          </Badge>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          RD
        </div>

        {/* Logout */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Keluar"
              onClick={handleLogout}
              disabled={isPending}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Keluar</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
