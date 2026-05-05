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
import { PurchaseMaterialForm } from "@/components/inventory/purchase-material-form";
import { getInventoryMovementHistory, getInventoryMovementOptions } from "@/lib/inventory";
import { Banknote, ClipboardList, Package, ShoppingCart, Warehouse } from "lucide-react";

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
      <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Pembelian bahan</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Catat pembelian supaya stok bertambah dan harga rata-rata per satuan di gudang ikut
            diperbarui. Isi nomor nota atau nama pemasok agar mudah dicari lagi.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/bahan-baku">
              <Warehouse className="mr-2 size-4" aria-hidden />
              Bahan baku
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/riwayat-stok?movementType=purchase">
              <ClipboardList className="mr-2 size-4" aria-hidden />
              Riwayat pembelian
            </Link>
          </Button>
        </div>
      </header>

      <section
        aria-label="Panduan singkat"
        className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
      >
        <p className="font-medium text-foreground">Cara memakai halaman ini</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Isi formulir di bawah: pilih bahan, jumlah yang masuk, dan harga beli per satuan.</li>
          <li>
            Bagian bawah menampilkan riwayat pembelian; gunakan filter jika ingin melihat periode
            atau bahan tertentu.
          </li>
          <li>
            Jika bahan belum ada di daftar pilih, tambahkan dulu di halaman Bahan baku lalu kembali
            ke sini.
          </li>
        </ol>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Ringkasan filter">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="size-4 shrink-0" aria-hidden />
              <CardTitle className="text-base font-medium">Transaksi di halaman ini</CardTitle>
            </div>
            <CardDescription>Jumlah baris tabel sesuai filter dan halaman aktif.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{purchases.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingCart className="size-4 shrink-0" aria-hidden />
              <CardTitle className="text-base font-medium">Total bahan masuk</CardTitle>
            </div>
            <CardDescription>Penjumlahan jumlah (sesuai satuan di tiap baris) untuk data yang tampil.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{totalQty.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Banknote className="size-4 shrink-0" aria-hidden />
              <CardTitle className="text-base font-medium">Perkiraan nilai pembelian</CardTitle>
            </div>
            <CardDescription>Jumlah uang menurut nilai yang tercatat pada baris yang sama.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalPurchaseValue)}</p>
          </CardContent>
        </Card>
      </section>

      <PurchaseMaterialForm items={movementOptions.items} />

      <Card>
        <CardHeader>
          <CardTitle>Saring riwayat</CardTitle>
          <CardDescription>
            Persempit daftar berdasarkan bahan, rentang waktu, atau kata kunci di kolom referensi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-5" method="get">
            <FieldGroup className="contents">
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

              <Field>
                <FieldLabel htmlFor="filter-cari">Cari di catatan / nomor</FieldLabel>
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
            </FieldGroup>

            <input type="hidden" name="page" value="1" />

            <div className="md:col-span-5 flex flex-wrap items-center gap-2">
              <Button type="submit">Terapkan</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/pembelian">Hapus filter</Link>
              </Button>
            </div>
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

          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Halaman {page} · {purchases.length} baris
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
