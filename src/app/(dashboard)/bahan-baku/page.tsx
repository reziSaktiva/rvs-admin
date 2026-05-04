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
import { addRawMaterialAction } from "./actions";
import { ClipboardList, Package, ShoppingCart, Warehouse } from "lucide-react";

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

const itemTypeLabel = (type: string) => {
  if (type === "raw_material") return "Bahan utama";
  if (type === "packaging") return "Kemasan";
  return type;
};

const dimensionHint = (dimension: string) => {
  const map: Record<string, string> = {
    count: "dihitung per buah / pasang / kemasan",
    weight: "berat",
    volume: "isi cairan",
    length: "panjang",
  };
  return map[dimension] ?? dimension;
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
            Halaman ini untuk mengelola bahan yang dipakai produksi atau kemasan: lihat perkiraan
            nilai persediaan, menambah nama bahan baru, dan mencatat masuk atau keluar stok.
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
        <p className="font-medium text-foreground">Alur yang disarankan</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>
            Tambah nama bahan di bawah jika belum ada di daftar (pastikan satuan seperti kg atau pcs
            sudah tersedia di sistem).
          </li>
          <li>Untuk pembelian rutin gunakan menu Pembelian bahan agar tercatat rapi beserta referensi.</li>
          <li>
            Gunakan formulir &quot;Perubahan stok&quot; untuk koreksi, produksi, atau penyesuaian lain
            sesuai jenis perubahan.
          </li>
        </ol>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Ringkasan">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Warehouse className="size-4 shrink-0" aria-hidden />
              <CardTitle className="text-base font-medium">Perkiraan nilai persediaan</CardTitle>
            </div>
            <CardDescription>
              Perkiraan uang yang &quot;terikat&quot; di gudang (bahan utama & kemasan yang punya
              saldo).
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
              <CardTitle className="text-base font-medium">Bahan siap dipakai</CardTitle>
            </div>
            <CardDescription>
              Bahan aktif yang bisa dipilih di form di halaman ini dan di pembelian.
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
              {availableUnits.length === 0 ? "Satuan belum diatur" : "Tip pencatatan"}
            </CardTitle>
            <CardDescription>
              {availableUnits.length === 0 ? (
                <>
                  Dropdown satuan kosong. Minta admin menambahkan satuan (misalnya kg, pcs) ke
                  database atau menjalankan skrip seed satuan.
                </>
              ) : (
                <>
                  Pembelian rutin lebih rapi lewat menu Pembelian bahan. Form di halaman ini cocok
                  untuk koreksi, produksi, dan penyesuaian lain.
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

      <InventoryMovementForm
        items={movementOptions.items}
        movementTypes={movementOptions.movementTypes}
      />

      <Card>
        <CardHeader>
          <CardTitle>Tambah bahan baru</CardTitle>
          <CardDescription>
            Isi nama dan satuan wajib. Kode SKU membantu pencarian internal. Harga dan stok awal bisa
            dikosongkan lalu diisi nanti lewat pembelian atau form perubahan stok.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableUnits.length === 0 ? (
            <p className="text-sm text-amber-700 dark:text-amber-500">
              Belum ada satuan di sistem. Tambahkan data satuan terlebih dahulu agar form ini bisa
              digunakan.
            </p>
          ) : null}
          <form action={addRawMaterialAction} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5 md:col-span-2 xl:col-span-2">
              <label htmlFor="bb-name" className="text-sm font-medium">
                Nama bahan <span className="text-destructive">*</span>
              </label>
              <input
                id="bb-name"
                name="name"
                required
                placeholder="Contoh: Benang PE 20s"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bb-sku" className="text-sm font-medium">
                Kode internal (opsional)
              </label>
              <input
                id="bb-sku"
                name="sku"
                placeholder="Contoh: BB-BENANG-01"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              <p className="text-xs text-muted-foreground">Boleh dikosongkan jika tidak memakai kode.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bb-type" className="text-sm font-medium">
                Kelompok bahan
              </label>
              <select
                id="bb-type"
                name="itemType"
                defaultValue="raw_material"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="raw_material">Bahan utama (kain, benang, bahan olahan, dll.)</option>
                <option value="packaging">Kemasan (plastik, dus, label, dll.)</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2 xl:col-span-2">
              <label htmlFor="bb-unit" className="text-sm font-medium">
                Satuan utama <span className="text-destructive">*</span>
              </label>
              <select
                id="bb-unit"
                name="unitId"
                required
                defaultValue=""
                disabled={availableUnits.length === 0}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="" disabled>
                  Pilih satuan
                </option>
                {availableUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} — {unit.name} ({dimensionHint(unit.dimension)})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Stok dan harga akan dihitung dalam satuan ini kecuali Anda mengubahnya di tempat lain.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bb-initial-price" className="text-sm font-medium">
                Perkiraan harga per satuan (opsional)
              </label>
              <input
                id="bb-initial-price"
                name="initialPrice"
                type="number"
                step="0.0001"
                min="0"
                placeholder="Contoh: 15000"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              <p className="text-xs text-muted-foreground">
                Dipakai untuk perhitungan HPP sampai ada harga lain yang tercatat.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bb-opening-qty" className="text-sm font-medium">
                Stok awal (opsional)
              </label>
              <input
                id="bb-opening-qty"
                name="openingQty"
                type="number"
                step="0.0001"
                min="0"
                placeholder="Contoh: 100"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              <p className="text-xs text-muted-foreground">Isi jika mulai mencatat dari saldo yang sudah ada.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bb-opening-cost" className="text-sm font-medium">
                Harga per satuan untuk stok awal (opsional)
              </label>
              <input
                id="bb-opening-cost"
                name="openingUnitCost"
                type="number"
                step="0.0001"
                min="0"
                placeholder="Wajib jika stok awal diisi"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              <p className="text-xs text-muted-foreground">
                Jika dikosongkan, akan memakai &quot;perkiraan harga per satuan&quot; di atas bila ada.
              </p>
            </div>

            <div className="flex items-end md:col-span-2 xl:col-span-1">
              <Button type="submit" disabled={availableUnits.length === 0}>
                Simpan bahan
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground">
            Setelah disimpan, bahan ini muncul di daftar pilih form perubahan stok dan di halaman
            pembelian bahan.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stok dan nilai per bahan</CardTitle>
          <CardDescription>
            Jumlah di gudang, perkiraan harga pokok rata-rata per satuan, dan nilai persediaan untuk
            tiap jenis bahan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama bahan</TableHead>
                <TableHead>Kelompok</TableHead>
                <TableHead>Jumlah stok</TableHead>
                <TableHead>Harga pokok rata-rata</TableHead>
                <TableHead className="text-right">Nilai persediaan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Belum ada saldo bahan. Tambah bahan baru atau catat pembelian / stok awal untuk
                    mulai melihat ringkasan.
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
