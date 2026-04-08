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
import { getInventoryMovementOptions, getRawMaterialAssetSummary } from "@/lib/inventory";

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default async function BahanBakuPage() {
  const [summary, movementOptions] = await Promise.all([
    getRawMaterialAssetSummary(),
    getInventoryMovementOptions(),
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
