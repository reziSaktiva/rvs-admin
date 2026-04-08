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
import {
  getInventoryMovementHistory,
  getInventoryMovementOptions,
  INVENTORY_MOVEMENT_TYPES,
  type StockMovementType,
} from "@/lib/inventory";

type MutasiStokPageProps = {
  searchParams?: Promise<{
    itemId?: string;
    movementType?: string;
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

const movementTypeLabel: Record<StockMovementType, string> = {
  opening: "Saldo awal",
  purchase: "Pembelian",
  production_in: "Masuk produksi",
  production_out: "Keluar produksi",
  sale_out: "Keluar penjualan",
  adjustment_in: "Penyesuaian masuk",
  adjustment_out: "Penyesuaian keluar",
  return_in: "Retur masuk",
  return_out: "Retur keluar",
  transfer_in: "Transfer masuk",
  transfer_out: "Transfer keluar",
};

const toDateTimeLocal = (value: Date) => {
  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const buildQueryString = (params: Record<string, string | undefined>) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim().length > 0) query.set(key, value);
  }
  return query.toString();
};

export default async function MutasiStokPage({ searchParams }: MutasiStokPageProps) {
  const params = (await searchParams) ?? {};
  const parsedPage = Number(params.page ?? "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedPageSize = Number(params.pageSize ?? "25");
  const pageSize = [25, 50, 100].includes(parsedPageSize) ? parsedPageSize : 25;
  const offset = (page - 1) * pageSize;

  const isValidMovementType =
    !!params.movementType &&
    INVENTORY_MOVEMENT_TYPES.includes(params.movementType as StockMovementType);
  const movementType = isValidMovementType ? (params.movementType as StockMovementType) : undefined;

  const [movementOptions, movementRows] = await Promise.all([
    getInventoryMovementOptions(),
    getInventoryMovementHistory({
      itemId: params.itemId || undefined,
      movementType,
      referenceKeyword: params.referenceKeyword || undefined,
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
      limit: pageSize + 1,
      offset,
    }),
  ]);
  const hasNextPage = movementRows.length > pageSize;
  const movements = hasNextPage ? movementRows.slice(0, pageSize) : movementRows;

  const baseQuery = {
    itemId: params.itemId,
    movementType: isValidMovementType ? params.movementType : undefined,
    referenceKeyword: params.referenceKeyword,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    pageSize: String(pageSize),
  };

  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const presets = [
    {
      label: "Hari ini",
      href: `/mutasi-stok?${buildQueryString({
        ...baseQuery,
        dateFrom: toDateTimeLocal(startOfToday),
        dateTo: toDateTimeLocal(endOfToday),
        page: "1",
      })}`,
    },
    {
      label: "7 hari terakhir",
      href: `/mutasi-stok?${buildQueryString({
        ...baseQuery,
        dateFrom: toDateTimeLocal(sevenDaysAgo),
        dateTo: toDateTimeLocal(now),
        page: "1",
      })}`,
    },
    {
      label: "Bulan ini",
      href: `/mutasi-stok?${buildQueryString({
        ...baseQuery,
        dateFrom: toDateTimeLocal(firstDayThisMonth),
        dateTo: toDateTimeLocal(now),
        page: "1",
      })}`,
    },
  ];

  const exportCsvHref = `/api/inventory/movements?${buildQueryString({
    itemId: params.itemId,
    movementType: isValidMovementType ? params.movementType : undefined,
    referenceKeyword: params.referenceKeyword,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    limit: "5000",
    offset: "0",
    format: "csv",
  })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Riwayat Mutasi Stok</h1>
          <p className="text-sm text-muted-foreground">
            Lihat jejak mutasi stok bahan baku berdasarkan tanggal, tipe, item, dan referensi.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/bahan-baku">Kembali ke Bahan Baku</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-6" method="get">
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
              <label className="text-sm font-medium">Tipe mutasi</label>
              <select
                name="movementType"
                defaultValue={params.movementType ?? ""}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">Semua tipe</option>
                {INVENTORY_MOVEMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {movementTypeLabel[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Tanggal dari</label>
              <input
                name="dateFrom"
                type="datetime-local"
                defaultValue={params.dateFrom ?? ""}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Tanggal sampai</label>
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
                placeholder="PO-..., production, catatan..."
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

            <div className="md:col-span-6 flex flex-wrap items-center gap-2">
              <Button type="submit">Terapkan Filter</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/mutasi-stok">Reset</Link>
              </Button>
              {presets.map((preset) => (
                <Button asChild key={preset.label} type="button" variant="outline" size="sm">
                  <Link href={preset.href}>{preset.label}</Link>
                </Button>
              ))}
              <Button asChild type="button" variant="secondary" size="sm">
                <Link href={exportCsvHref}>Export CSV</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Mutasi ({movements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit cost</TableHead>
                <TableHead>Value delta</TableHead>
                <TableHead>Referensi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Tidak ada data mutasi sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDateTime(movement.occurredAt)}</TableCell>
                    <TableCell>{movement.item.name}</TableCell>
                    <TableCell>{movementTypeLabel[movement.movementType]}</TableCell>
                    <TableCell>
                      {movement.qtyDelta.toLocaleString("id-ID")} {movement.unit.code}
                    </TableCell>
                    <TableCell>
                      {movement.unitCost === null ? "-" : formatCurrency(movement.unitCost)}
                    </TableCell>
                    <TableCell>
                      {movement.valueDelta === null ? "-" : formatCurrency(movement.valueDelta)}
                    </TableCell>
                    <TableCell>
                      {[movement.referenceType, movement.referenceId].filter(Boolean).join(" / ") || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Halaman {page} · Menampilkan {movements.length} data
            </p>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={page <= 1}
              >
                <Link
                  href={`/mutasi-stok?${buildQueryString({
                    ...baseQuery,
                    page: String(Math.max(1, page - 1)),
                  })}`}
                >
                  Sebelumnya
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={!hasNextPage}
              >
                <Link
                  href={`/mutasi-stok?${buildQueryString({
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
