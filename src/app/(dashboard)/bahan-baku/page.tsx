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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { and, desc, eq } from "drizzle-orm";
import { InventoryMovementForm } from "@/components/inventory/inventory-movement-form";
import { db } from "@/lib/db";
import { costItemInventoryMovements, units } from "@/lib/db/drizzle/schema";
import { getInventoryMovementOptions, getRawMaterialAssetSummary } from "@/lib/inventory";
import { ClipboardList, Package, ShoppingCart, Warehouse } from "lucide-react";
import { AddRawMaterialFormCard } from "@/components/inventory/add-raw-material-form-card";
import { ReferencePriceFormCard } from "@/components/inventory/reference-price-form-card";
import { setRawMaterialReferencePriceAction } from "./actions";
import { getCurrentUserActiveCompanyContext } from "@/lib/company/active-company";
import { redirect } from "next/navigation";

type BahanBakuPageProps = {
  searchParams?: Promise<{
    page?: string;
    pageSize?: string;
    referenceItemId?: string;
  }>;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

const toNumber = (value: string | number | null | undefined, fallback = 0) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const itemTypeLabel = (type: string) => {
  if (type === "raw_material") return "Bahan utama";
  if (type === "packaging") return "Kemasan";
  return type;
};

export default async function BahanBakuPage({ searchParams }: BahanBakuPageProps) {
  const activeContext = await getCurrentUserActiveCompanyContext();
  if (!activeContext) redirect("/select-company");

  const params = (await searchParams) ?? {};
  const parsedPage = Number(params.page ?? "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedPageSize = Number(params.pageSize ?? "25");
  const pageSize = [10, 25, 50].includes(parsedPageSize) ? parsedPageSize : 25;
  const offset = (page - 1) * pageSize;

  const [summary, movementOptions, availableUnits, purchaseRows] = await Promise.all([
    getRawMaterialAssetSummary(activeContext.companyId),
    getInventoryMovementOptions(activeContext.companyId),
    db.query.units.findMany({
      where: eq(units.companyId, activeContext.companyId),
      columns: {
        id: true,
        code: true,
        name: true,
        dimension: true,
      },
      orderBy: (table, { asc }) => [asc(table.code)],
    }),
    db.query.costItemInventoryMovements.findMany({
      where: and(
        eq(costItemInventoryMovements.companyId, activeContext.companyId),
        eq(costItemInventoryMovements.movementType, "purchase")
      ),
      columns: {
        itemId: true,
        unitCost: true,
        occurredAt: true,
      },
      with: {
        unit: {
          columns: {
            code: true,
          },
        },
      },
      orderBy: (table) => [desc(table.occurredAt), desc(table.createdAt)],
      limit: 500,
    }),
  ]);

  const itemsWithStock = summary.items.filter((i) => i.qtyOnHand > 0).length;
  const itemsWithoutReferencePrice = summary.items.filter((item) => item.initialPrice <= 0).length;
  const latestPurchaseByItemId = new Map<
    string,
    { unitCost: number; unitCode: string; occurredAt: string | null }
  >();
  for (const row of purchaseRows) {
    if (latestPurchaseByItemId.has(row.itemId)) continue;
    latestPurchaseByItemId.set(row.itemId, {
      unitCost: toNumber(row.unitCost, 0),
      unitCode: row.unit.code,
      occurredAt: row.occurredAt ?? null,
    });
  }
  const referencePriceOptions = movementOptions.items.map((item) => {
    const summaryItem = summary.items.find((summaryRow) => summaryRow.itemId === item.id);
    const latestPurchase = latestPurchaseByItemId.get(item.id);
    return {
      id: item.id,
      name: item.name,
      defaultUnit: item.defaultUnit,
      referencePrice: summaryItem?.initialPrice ?? 0,
      latestPurchasePrice: latestPurchase?.unitCost ?? null,
      latestPurchaseUnitCode: latestPurchase?.unitCode ?? null,
    };
  });
  const pagedRowsRaw = summary.items.slice(offset, offset + pageSize + 1);
  const hasNextPage = pagedRowsRaw.length > pageSize;
  const hasPreviousPage = page > 1;
  const pagedRows = hasNextPage ? pagedRowsRaw.slice(0, pageSize) : pagedRowsRaw;
  const shouldShowPagination = hasPreviousPage || hasNextPage;
  const buildQueryString = (nextPage: number) => {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    query.set("pageSize", String(pageSize));
    return query.toString();
  };

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Atur harga acuan bahan</CardTitle>
            <CardDescription>
              Jika HPP memberi peringatan harga bahan kosong, isi dari sini agar hitung HPP lebih akurat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReferencePriceFormCard
              items={referencePriceOptions}
              itemsWithoutReferencePrice={itemsWithoutReferencePrice}
              initialSelectedItemId={params.referenceItemId}
              action={setRawMaterialReferencePriceAction}
            />
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
                <TableHead>Harga pembelian terakhir</TableHead>
                <TableHead className="text-right">Nilai persediaan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Belum ada data stok. Tambah bahan baru lalu catat stok awal atau pembelian.
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((item) => (
                  <TableRow key={item.itemId}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell>{itemTypeLabel(item.itemType)}</TableCell>
                    <TableCell className="tabular-nums">
                      {item.qtyOnHand.toLocaleString("id-ID")} {item.unit.code}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(item.avgCostPerUnit)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(item.initialPrice)}</TableCell>
                    <TableCell className="tabular-nums">
                      {latestPurchaseByItemId.get(item.itemId)
                        ? `${formatCurrency(latestPurchaseByItemId.get(item.itemId)!.unitCost)} / ${
                            latestPurchaseByItemId.get(item.itemId)!.unitCode
                          }`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(item.assetValue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {shouldShowPagination ? (
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Halaman {page} · {pagedRows.length} baris
              </p>
              <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={`?${buildQueryString(Math.max(1, page - 1))}`}
                      className={!hasPreviousPage ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href={`?${buildQueryString(page + 1)}`}
                      className={!hasNextPage ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
