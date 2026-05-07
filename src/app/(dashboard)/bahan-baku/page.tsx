import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryMovementForm } from "@/components/inventory/inventory-movement-form";
import { db } from "@/lib/db";
import { getInventoryMovementOptions, getRawMaterialAssetSummary } from "@/lib/inventory";
import { ClipboardList, Package, ShoppingCart, Warehouse } from "lucide-react";
import { AddRawMaterialFormCard } from "@/components/inventory/add-raw-material-form-card";

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

const itemTypeLabel = (type: string) => {
  if (type === "raw_material") return "Bahan utama";
  if (type === "packaging") return "Kemasan";
  return type;
};

export default async function BahanBakuPage() {
  const [summary, movementOptions, availableUnits] = await Promise.all([
    getRawMaterialAssetSummary(),
    getInventoryMovementOptions(),
    db.query.units.findMany({
      columns: {
        id: true,
        code: true,
        name: true,
        dimension: true,
      },
      orderBy: (table, { asc }) => [asc(table.code)],
    }),
  ]);

  const itemsWithStock = summary.items.filter((i) => i.qtyOnHand > 0).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Bahan baku</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Kelola semua bahan produksi dan kemasan di sini: tambah bahan baru, lihat stok, dan catat
            stok masuk atau keluar.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/riwayat-stok">
              <ClipboardList className="mr-2 size-4" aria-hidden />
              Riwayat stok
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/pembelian">
              <ShoppingCart className="mr-2 size-4" aria-hidden />
              Pembelian bahan
            </Link>
          </Button>
        </div>
      </header>

      <section
        aria-label="Panduan singkat"
        className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
      >
        <p className="font-medium text-foreground">Mulai dari sini</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>
            Tambah bahan baru jika nama bahan belum ada di daftar (pastikan satuan seperti kg atau pcs
            sudah tersedia).
          </li>
          <li>Untuk pembelian rutin, pakai menu Pembelian bahan agar nota dan pemasok lebih rapi.</li>
          <li>
            Pakai menu &quot;Perubahan stok&quot; untuk koreksi, hasil produksi, retur, atau penyesuaian
            stok lainnya.
          </li>
        </ol>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Ringkasan">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Warehouse className="size-4 shrink-0" aria-hidden />
              <CardTitle className="text-base font-medium">Nilai stok saat ini</CardTitle>
            </div>
            <CardDescription>
              Perkiraan nilai uang dari bahan yang saat ini masih ada di gudang.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatCurrency(summary.totalAssetValue)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {summary.items.length} jenis bahan tercatat · {itemsWithStock} di antaranya masih ada
              stok
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="size-4 shrink-0" aria-hidden />
              <CardTitle className="text-base font-medium">Bahan aktif</CardTitle>
            </div>
            <CardDescription>
              Bahan yang bisa dipilih saat catat stok atau saat pembelian.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{movementOptions.items.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Tambah lewat formulir di bawah jika bahan Anda belum muncul.
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              {availableUnits.length === 0 ? "Satuan belum diatur" : "Catatan penting"}
            </CardTitle>
            <CardDescription>
              {availableUnits.length === 0 ? (
                <>
                  Daftar satuan kosong. Minta pengelola sistem menambahkan satuan (misalnya kg,
                  pcs) terlebih dahulu.
                </>
              ) : (
                <>
                  Pembelian rutin lebih rapi lewat menu Pembelian bahan. Form perubahan stok cocok
                  untuk koreksi, hasil produksi, atau penyesuaian manual.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {availableUnits.length === 0 ? (
              <p className="text-sm text-amber-700 dark:text-amber-500">
                Tanpa satuan, formulir tambah bahan tidak bisa disimpan.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Penambahan Bahan Baru</CardTitle>
            <CardDescription>
              Tambahkan bahan baru ke sistem. Isi nama bahan, kode, jenis, dan satuan utama. Data ini akan otomatis terlihat di form perubahan stok.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Sheet>
              <SheetTrigger asChild>
                <Button>Tambah bahan baru</Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
                <SheetHeader>
                  <SheetTitle>Form penambahan bahan baru</SheetTitle>
                  <SheetDescription>
                    Isi nama bahan, kode, jenis, dan satuan utama. Data ini akan otomatis terlihat di form perubahan stok.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-4">
                  <AddRawMaterialFormCard availableUnits={availableUnits} />
                </div>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Perubahan stok</CardTitle>
            <CardDescription>
              Catat stok masuk atau keluar bahan. Gunakan ini untuk koreksi stok, hasil produksi, retur,
              atau transfer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Sheet>
              <SheetTrigger asChild>
                <Button>Catat perubahan stok</Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
                <SheetHeader>
                  <SheetTitle>Form perubahan stok</SheetTitle>
                  <SheetDescription>
                    Isi bahan, jenis perubahan, dan jumlah. Sistem akan menghitung stok masuk/keluar
                    secara otomatis.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-4">
                  <InventoryMovementForm
                    items={movementOptions.items}
                    movementTypes={movementOptions.movementTypes}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar bahan dan stok</CardTitle>
          <CardDescription>
            Lihat jumlah stok, harga rata-rata, dan nilai stok untuk tiap bahan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama bahan</TableHead>
                <TableHead>Kelompok</TableHead>
                <TableHead>Jumlah stok</TableHead>
                <TableHead>Harga rata-rata per satuan</TableHead>
                <TableHead>Harga acuan bahan</TableHead>
                <TableHead className="text-right">Nilai persediaan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada data stok. Tambah bahan baru lalu catat stok awal atau pembelian.
                  </TableCell>
                </TableRow>
              ) : (
                summary.items.map((item) => (
                  <TableRow key={item.itemId}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell>{itemTypeLabel(item.itemType)}</TableCell>
                    <TableCell className="tabular-nums">
                      {item.qtyOnHand.toLocaleString("id-ID")} {item.unit.code}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(item.avgCostPerUnit)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(item.initialPrice)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(item.assetValue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
