import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PurchaseMaterialForm } from "@/components/inventory/purchase-material-form";
import { getInventoryMovementHistory, getInventoryMovementOptions } from "@/lib/inventory";

type PembelianPageProps = {
  searchParams?: Promise<{
    itemId?: string;
    referenceKeyword?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    pageSize?: string;
  }>;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID");
};

const buildQueryString = (params: Record<string, string | undefined>) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim().length > 0) query.set(key, value);
  }
  return query.toString();
};

export default async function PembelianPage({ searchParams }: PembelianPageProps) {
  const params = (await searchParams) ?? {};
  const parsedPage = Number(params.page ?? "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedPageSize = Number(params.pageSize ?? "25");
  const pageSize = [25, 50, 100].includes(parsedPageSize) ? parsedPageSize : 25;
  const offset = (page - 1) * pageSize;

  const [movementOptions, rows] = await Promise.all([
    getInventoryMovementOptions(),
    getInventoryMovementHistory({
      movementType: "purchase",
      itemId: params.itemId || undefined,
      referenceKeyword: params.referenceKeyword || undefined,
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
      limit: pageSize + 1,
      offset,
    }),
  ]);

  const hasNextPage = rows.length > pageSize;
  const purchases = hasNextPage ? rows.slice(0, pageSize) : rows;
  const totalPurchaseValue = purchases.reduce((sum, row) => sum + (row.valueDelta ?? 0), 0);
  const totalQty = purchases.reduce((sum, row) => sum + row.qtyDelta, 0);

  const baseQuery = {
    itemId: params.itemId,
    referenceKeyword: params.referenceKeyword,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    pageSize: String(pageSize),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pembelian Bahan</h1>
          <p className="text-sm text-muted-foreground">
            Catat transaksi pembelian bahan untuk menambah stok dan memperbarui average cost.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/riwayat-stok?movementType=purchase">Lihat di Riwayat Stok</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaksi Ditampilkan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{purchases.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Qty Masuk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalQty.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Nilai Pembelian</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(totalPurchaseValue)}</p>
          </CardContent>
        </Card>
      </div>

      <PurchaseMaterialForm items={movementOptions.items} />

      <Card>
        <CardHeader>
          <CardTitle>Filter Riwayat Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-5" method="get">
            <div className="space-y-1">
              <label className="text-sm font-medium">Item</label>
              <select
                name="itemId"
                defaultValue={params.itemId ?? ""}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">Semua item</option>
                {movementOptions.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Dari tanggal</label>
              <input
                name="dateFrom"
                type="datetime-local"
                defaultValue={params.dateFrom ?? ""}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Sampai tanggal</label>
              <input
                name="dateTo"
                type="datetime-local"
                defaultValue={params.dateTo ?? ""}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Referensi</label>
              <input
                name="referenceKeyword"
                type="text"
                defaultValue={params.referenceKeyword ?? ""}
                placeholder="supplier / nomor dokumen"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Per halaman</label>
              <select
                name="pageSize"
                defaultValue={String(pageSize)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <input type="hidden" name="page" value="1" />

            <div className="md:col-span-5 flex items-center gap-2">
              <Button type="submit">Terapkan Filter</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/pembelian">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembelian ({purchases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Referensi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada riwayat pembelian sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDateTime(row.occurredAt)}</TableCell>
                    <TableCell>{row.item.name}</TableCell>
                    <TableCell>
                      {row.qtyDelta.toLocaleString("id-ID")} {row.unit.code}
                    </TableCell>
                    <TableCell>{row.unitCost === null ? "-" : formatCurrency(row.unitCost)}</TableCell>
                    <TableCell>{row.valueDelta === null ? "-" : formatCurrency(row.valueDelta)}</TableCell>
                    <TableCell>
                      {[row.referenceType, row.referenceId].filter(Boolean).join(" / ") || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Halaman {page} · Menampilkan {purchases.length} transaksi
            </p>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" disabled={page <= 1}>
                <Link
                  href={`/pembelian?${buildQueryString({
                    ...baseQuery,
                    page: String(Math.max(1, page - 1)),
                  })}`}
                >
                  Sebelumnya
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" disabled={!hasNextPage}>
                <Link
                  href={`/pembelian?${buildQueryString({
                    ...baseQuery,
                    page: String(page + 1),
                  })}`}
                >
                  Berikutnya
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
