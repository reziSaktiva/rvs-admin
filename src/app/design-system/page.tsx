"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";

// ── Section Wrapper ────────────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ── Color Swatch ───────────────────────────────────────────────────────────────
function ColorSwatch({
  label,
  bgClass,
  textClass = "text-foreground",
  border = false,
}: {
  label: string;
  bgClass: string;
  textClass?: string;
  border?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`h-14 w-full rounded-lg ${bgClass} ${border ? "border border-border" : ""}`}
      />
      <span className={`text-xs font-medium ${textClass}`}>{label}</span>
    </div>
  );
}

export default function DesignSystemPage() {
  const [switchValue, setSwitchValue] = useState(false);
  const [checkValue, setCheckValue] = useState(false);

  return (
    <DashboardLayout title="Design System">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Design System
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Preview semua komponen UI, warna, dan tipografi yang digunakan
              pada project ini.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Toggle Mode:</span>
            <ThemeToggle />
          </div>
        </div>

        <Separator />

        {/* ── TYPOGRAPHY ── */}
        <Section
          title="Typography"
          description="Skala tipografi yang digunakan di seluruh aplikasi"
        >
          <div className="space-y-4">
            <div>
              <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                Heading 1 — Revika Djaya
              </h1>
              <code className="text-xs text-muted-foreground">
                text-4xl font-extrabold
              </code>
            </div>
            <div>
              <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
                Heading 2 — Dashboard Admin
              </h2>
              <code className="text-xs text-muted-foreground">
                text-3xl font-semibold
              </code>
            </div>
            <div>
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                Heading 3 — Manajemen Produk
              </h3>
              <code className="text-xs text-muted-foreground">
                text-2xl font-semibold
              </code>
            </div>
            <div>
              <p className="leading-7 text-foreground">
                Paragraph — Lorem ipsum dolor sit amet, consectetur adipiscing
                elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
                aliqua. Ut enim ad minim veniam.
              </p>
              <code className="text-xs text-muted-foreground">
                text-base leading-7
              </code>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Small Text — Informasi tambahan atau keterangan singkat di
                bawah label.
              </p>
              <code className="text-xs text-muted-foreground">
                text-sm text-muted-foreground
              </code>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Extra Small — Metadata, timestamp, atau kode.
              </p>
              <code className="text-xs text-muted-foreground">
                text-xs text-muted-foreground
              </code>
            </div>
          </div>
        </Section>

        {/* ── COLOR PALETTE ── */}
        <Section
          title="Color Palette"
          description="Variasi warna sistem berdasarkan CSS variables"
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Core Colors
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                <ColorSwatch
                  label="Background"
                  bgClass="bg-background"
                  border
                />
                <ColorSwatch label="Foreground" bgClass="bg-foreground" />
                <ColorSwatch label="Primary" bgClass="bg-primary" />
                <ColorSwatch label="Secondary" bgClass="bg-secondary" border />
                <ColorSwatch label="Accent" bgClass="bg-accent" border />
                <ColorSwatch label="Muted" bgClass="bg-muted" border />
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Semantic Colors
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                <ColorSwatch label="Destructive" bgClass="bg-destructive" />
                <ColorSwatch label="Border" bgClass="bg-border" border />
                <ColorSwatch label="Input" bgClass="bg-input" border />
                <ColorSwatch label="Ring" bgClass="bg-ring" />
                <ColorSwatch label="Card" bgClass="bg-card" border />
                <ColorSwatch label="Popover" bgClass="bg-popover" border />
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Chart Colors
              </p>
              <div className="grid grid-cols-5 gap-3">
                <ColorSwatch label="Chart 1" bgClass="bg-chart-1" />
                <ColorSwatch label="Chart 2" bgClass="bg-chart-2" />
                <ColorSwatch label="Chart 3" bgClass="bg-chart-3" />
                <ColorSwatch label="Chart 4" bgClass="bg-chart-4" />
                <ColorSwatch label="Chart 5" bgClass="bg-chart-5" />
              </div>
            </div>
          </div>
        </Section>

        {/* ── BUTTONS ── */}
        <Section title="Buttons" description="Semua varian tombol yang tersedia">
          <div className="space-y-4">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Variants
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sizes
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg">Large</Button>
                <Button size="default">Default</Button>
                <Button size="sm">Small</Button>
                <Button size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                States
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </Section>

        {/* ── FORM ELEMENTS ── */}
        <Section
          title="Form Elements"
          description="Input, Label, Checkbox, dan Switch"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Input */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Input
              </p>
              <div className="space-y-2">
                <Label htmlFor="input-default">Label</Label>
                <Input id="input-default" placeholder="Masukkan teks..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="input-disabled">Disabled</Label>
                <Input
                  id="input-disabled"
                  placeholder="Tidak dapat diedit"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="input-password">Password</Label>
                <Input
                  id="input-password"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Checkbox & Switch */}
            <div className="space-y-4">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Checkbox
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="check-1"
                      checked={checkValue}
                      onCheckedChange={(v) => setCheckValue(v as boolean)}
                    />
                    <Label htmlFor="check-1">Aktifkan fitur ini</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="check-disabled" disabled />
                    <Label
                      htmlFor="check-disabled"
                      className="text-muted-foreground"
                    >
                      Opsi tidak tersedia
                    </Label>
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Switch
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="switch-1"
                      checked={switchValue}
                      onCheckedChange={setSwitchValue}
                    />
                    <Label htmlFor="switch-1">
                      {switchValue ? "Aktif" : "Nonaktif"}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="switch-disabled" disabled />
                    <Label
                      htmlFor="switch-disabled"
                      className="text-muted-foreground"
                    >
                      Tidak tersedia
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── CARDS ── */}
        <Section title="Cards" description="Variasi kartu konten">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Card Default</CardTitle>
                <CardDescription>Deskripsi singkat kartu</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Konten kartu berisi informasi yang relevan untuk pengguna.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Card Primary</CardTitle>
                <CardDescription>Kartu dengan aksen primary</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Digunakan untuk highlight konten penting.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Card Muted</CardTitle>
                <CardDescription>Kartu dengan background muted</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Untuk konten sekunder atau informasi tambahan.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ── BADGES ── */}
        <Section title="Badges" description="Label status dan kategori">
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
              Selesai
            </Badge>
            <Badge className="bg-amber-500 text-white hover:bg-amber-600">
              Proses
            </Badge>
            <Badge className="bg-sky-500 text-white hover:bg-sky-600">
              Baru
            </Badge>
          </div>
        </Section>

        {/* ── TABS ── */}
        <Section title="Tabs" description="Navigasi konten berdasarkan tab">
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Ikhtisar</TabsTrigger>
              <TabsTrigger value="tab2">Analitik</TabsTrigger>
              <TabsTrigger value="tab3">Laporan</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="mt-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Konten tab ikhtisar — menampilkan ringkasan data utama.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tab2" className="mt-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Konten tab analitik — grafik dan statistik performa.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tab3" className="mt-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Konten tab laporan — ekspor dan cetak laporan.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Section>

        {/* ── TOOLTIP ── */}
        <Section
          title="Tooltip"
          description="Informasi tambahan saat hover elemen"
        >
          <div className="flex flex-wrap gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover saya</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ini adalah tooltip informatif</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Klik untuk informasi lebih lanjut</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Section>

        {/* ── DARK/LIGHT MODE PREVIEW ── */}
        <Section
          title="Dark / Light Mode Toggle"
          description="Beralih antara tema terang dan gelap secara global"
        >
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="space-y-1">
              <p className="text-sm font-medium">Toggle Tema Global</p>
              <p className="text-xs text-muted-foreground">
                Menggunakan{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  next-themes
                </code>{" "}
                dengan{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  attribute=&quot;class&quot;
                </code>{" "}
                — tema disimpan di localStorage dan diterapkan ke class{" "}
                <code className="rounded bg-muted px-1 py-0.5">.dark</code>{" "}
                pada elemen{" "}
                <code className="rounded bg-muted px-1 py-0.5">&lt;html&gt;</code>
                .
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-semibold text-muted-foreground">
                Light Mode Preview
              </p>
              <div className="mt-2 flex gap-2">
                <div className="h-8 w-8 rounded bg-white shadow-sm ring-1 ring-border" />
                <div className="h-8 w-8 rounded bg-slate-900" />
                <div className="h-8 w-8 rounded bg-blue-600" />
                <div className="h-8 w-8 rounded bg-slate-100 ring-1 ring-border" />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-slate-900 p-4">
              <p className="text-xs font-semibold text-slate-400">
                Dark Mode Preview
              </p>
              <div className="mt-2 flex gap-2">
                <div className="h-8 w-8 rounded bg-slate-950" />
                <div className="h-8 w-8 rounded bg-slate-100" />
                <div className="h-8 w-8 rounded bg-blue-400" />
                <div className="h-8 w-8 rounded bg-slate-800 ring-1 ring-slate-700" />
              </div>
            </div>
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
