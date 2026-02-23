"use client";

import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// interface TopbarProps {
//   title?: string;
// }

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      {/* Left: Page Title */}
      <div>
        {/* <h1 className="text-lg font-semibold text-foreground">{title}</h1> */}
        <p className="text-xs text-muted-foreground">
          Selamat datang di Admin Revika Djaya
        </p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari..."
            className="h-9 w-64 pl-9 text-sm"
          />
        </div>

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
      </div>
    </header>
  );
}
