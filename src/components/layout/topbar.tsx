"use client";

import { Bell, LogOut, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    <header className="flex h-16 items-center justify-between border-b border-border bg-sidebar px-6">
      {/* Left: Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari..."
          className="h-9 w-96 pl-9 text-sm"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
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
