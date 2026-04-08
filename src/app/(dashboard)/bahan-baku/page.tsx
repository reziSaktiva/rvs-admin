import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { InventoryMovementForm } from "@/components/inventory/inventory-movement-form";
import { db } from "@/lib/db";
import { getInventoryMovementOptions, getRawMaterialAssetSummary } from "@/lib/inventory";
import { addRawMaterialAction } from "./actions";

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default async function BahanBakuPage() {
  const [summary, movementOptions, availableUnits] = await Promise.all([
    getRawMaterialAssetSummary(),
    getInventoryMovementOptions(),
    db.query.units.findMany({
      columns: {
        id: true,
        code: true,
        dimension: true,
      },
      orderBy: (table, { asc }) => [asc(table.code)],
    }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bahan Baku</h1>
        <p className="text-sm text-muted-foreground">
          Pantau stok dan nilai aset persediaan, lalu catat mutasi bahan secara berkala.
        </p>
        <div className="mt-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/mutasi-stok">Buka Riwayat Mutasi</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Nilai Aset</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(summary.totalAssetValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Dari {summary.items.length} item bahan baku/packaging aktif.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Item Bahan Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{movementOptions.items.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Siap dipakai untuk input mutasi stok.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Modul</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>Inventory valuation aktif</Badge>
          </CardContent>
        </Card>
      </div>

      <InventoryMovementForm
        items={movementOptions.items}
        movementTypes={movementOptions.movementTypes}
      />

      <Card>
        <CardHeader>
          <CardTitle>Tambah Bahan Baku Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addRawMaterialAction} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nama bahan</label>
              <input
                name="name"
                required
                placeholder="contoh: Plastik PP 25 micron"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">SKU (opsional)</label>
              <input
                name="sku"
                placeholder="kode unik internal"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Tipe item</label>
              <select
                name="itemType"
                defaultValue="raw_material"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="raw_material">raw_material</option>
                <option value="packaging">packaging</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Unit default</label>
              <select
                name="unitId"
                required
                defaultValue=""
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="" disabled>
                  Pilih unit
                </option>
                {availableUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} ({unit.dimension})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Harga beli awal / unit (opsional)</label>
              <input
                name="initialPrice"
                type="number"
                step="0.0001"
                placeholder="contoh: 12000"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Saldo awal qty (opsional)</label>
              <input
                name="openingQty"
                type="number"
                step="0.0001"
                placeholder="contoh: 50"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Harga unit saldo awal (opsional)</label>
              <input
                name="openingUnitCost"
                type="number"
                step="0.0001"
                placeholder="pakai jika saldo awal diisi"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit">Simpan Bahan</Button>
            </div>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Setelah bahan dibuat, item akan otomatis tersedia di halaman Pembelian Bahan dan Input
            Mutasi Stok.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Aset per Item</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Qty on hand</TableHead>
                <TableHead>Avg cost</TableHead>
                <TableHead>Nilai aset</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Belum ada data saldo bahan baku.
                  </TableCell>
                </TableRow>
              ) : (
                summary.items.map((item) => (
                  <TableRow key={item.itemId}>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.itemType}</TableCell>
                    <TableCell>
                      {item.qtyOnHand.toLocaleString("id-ID")} {item.unit.code}
                    </TableCell>
                    <TableCell>{formatCurrency(item.avgCostPerUnit)}</TableCell>
                    <TableCell>{formatCurrency(item.assetValue)}</TableCell>
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
