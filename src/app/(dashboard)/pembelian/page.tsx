import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PurchaseMaterialForm } from "@/components/inventory/purchase-material-form";
import { getInventoryMovementHistory, getInventoryMovementOptions } from "@/lib/inventory";
import { Banknote, ClipboardList, Package, Plus, Warehouse } from "lucide-react";

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
  const selectedItemId = params.itemId && params.itemId !== "all" ? params.itemId : undefined;
  const parsedPage = Number(params.page ?? "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedPageSize = Number(params.pageSize ?? "25");
  const pageSize = [25, 50, 100].includes(parsedPageSize) ? parsedPageSize : 25;
  const offset = (page - 1) * pageSize;

  const [movementOptions, rows] = await Promise.all([
    getInventoryMovementOptions(),
    getInventoryMovementHistory({
      movementType: "purchase",
      itemId: selectedItemId,
      referenceKeyword: params.referenceKeyword || undefined,
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
      limit: pageSize + 1,
      offset,
    }),
  ]);

  const hasNextPage = rows.length > pageSize;
  const purchases = hasNextPage ? rows.slice(0, pageSize) : rows;
  const hasPreviousPage = page > 1;
  const shouldShowPagination = hasPreviousPage || hasNextPage;
  const totalPurchaseValue = purchases.reduce((sum, row) => sum + (row.valueDelta ?? 0), 0);
  const totalQty = purchases.reduce((sum, row) => sum + row.qtyDelta, 0);

  const baseQuery = {
    itemId: selectedItemId,
    referenceKeyword: params.referenceKeyword,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    pageSize: String(pageSize),
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Inventory
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Pembelian bahan</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Catat pembelian agar stok dan biaya bahan ter-update otomatis. Mulai dari form sederhana,
            lalu gunakan filter jika ingin audit riwayat lebih detail.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 size-4" aria-hidden />
                Catat pembelian baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Catat pembelian bahan</DialogTitle>
                <DialogDescription>
                  Isi bahan, jumlah masuk, dan harga beli per satuan. Setelah disimpan, stok dan biaya
                  rata-rata akan ter-update otomatis.
                </DialogDescription>
              </DialogHeader>
              <PurchaseMaterialForm items={movementOptions.items} />
            </DialogContent>
          </Dialog>
          <Button asChild size="sm" variant="outline">
            <Link href="/bahan-baku">
              <Warehouse className="mr-2 size-4" aria-hidden />
              Kelola bahan
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/riwayat-stok?movementType=purchase">
              <ClipboardList className="mr-2 size-4" aria-hidden />
              Riwayat lengkap
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Ringkasan pembelian">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="size-4 shrink-0" aria-hidden />
              <CardTitle className="text-base font-medium">Baris transaksi tampil</CardTitle>
            </div>
            <CardDescription>Sesuai filter dan halaman yang sedang dibuka.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{purchases.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Banknote className="size-4 shrink-0" aria-hidden />
              <CardTitle className="text-base font-medium">Total nilai pembelian</CardTitle>
            </div>
            <CardDescription>
              Akumulasi nilai dari data yang tampil pada tabel saat ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(totalPurchaseValue)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Total qty masuk: {totalQty.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filter riwayat pembelian</CardTitle>
          <CardDescription>
            Mulai dari filter cepat. Untuk rentang tanggal, buka bagian filter lanjutan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" method="get">
            <FieldGroup className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Field>
                <FieldLabel htmlFor="filter-bahan">Nama bahan</FieldLabel>
                <Select name="itemId" defaultValue={selectedItemId ?? "all"}>
                  <SelectTrigger id="filter-bahan" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua bahan</SelectItem>
                    {movementOptions.items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="filter-cari">Cari referensi</FieldLabel>
                <Input
                  id="filter-cari"
                  name="referenceKeyword"
                  type="text"
                  defaultValue={params.referenceKeyword ?? ""}
                  placeholder="mis. nama toko, nomor nota"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="filter-ukuran">Baris per halaman</FieldLabel>
                <Select name="pageSize" defaultValue={String(pageSize)}>
                  <SelectTrigger id="filter-ukuran" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>&nbsp;</FieldLabel>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Terapkan
                  </Button>
                  <Button asChild type="button" variant="ghost">
                    <Link href="/pembelian">Reset</Link>
                  </Button>
                </div>
              </Field>
            </FieldGroup>

            <details className="rounded-md border border-border bg-muted/30 p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Filter lanjutan (tanggal)
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="filter-dari">Mulai tanggal & jam</FieldLabel>
                  <Input
                    id="filter-dari"
                    name="dateFrom"
                    type="datetime-local"
                    defaultValue={params.dateFrom ?? ""}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="filter-sampai">Sampai tanggal & jam</FieldLabel>
                  <Input
                    id="filter-sampai"
                    name="dateTo"
                    type="datetime-local"
                    defaultValue={params.dateTo ?? ""}
                  />
                </Field>
              </div>
            </details>

            <input type="hidden" name="page" value="1" />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar pembelian</CardTitle>
          <CardDescription>
            Menampilkan {purchases.length} baris untuk halaman {page}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Bahan</TableHead>
                <TableHead>Jumlah masuk</TableHead>
                <TableHead>Harga per satuan</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Referensi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada data pembelian yang cocok. Ubah filter atau catat pembelian baru di
                    atas.
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDateTime(row.occurredAt)}</TableCell>
                    <TableCell className="font-medium">{row.item.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {row.qtyDelta.toLocaleString("id-ID")} {row.unit.code}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.unitCost === null ? "-" : formatCurrency(row.unitCost)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.valueDelta === null ? "-" : formatCurrency(row.valueDelta)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {[row.referenceType, row.referenceId].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {shouldShowPagination ? (
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Halaman {page} · {purchases.length} baris
              </p>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" disabled={!hasPreviousPage}>
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
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
