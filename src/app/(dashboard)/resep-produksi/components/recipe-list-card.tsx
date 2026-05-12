import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { RecipeRow, ResepProduksiPageData } from "../data";
import { statusLabel, type RecipeStatus } from "./view-model";
import { CreateRecipeDrawer } from "./drawers/create-recipe-drawer";

type RecipeListCardProps = {
  recipes: RecipeRow[];
  selectedStatus?: RecipeStatus;
  availableUnits: ResepProduksiPageData["availableUnits"];
  categories: ResepProduksiPageData["categories"];
  products: ResepProduksiPageData["products"];
  allVariants: ResepProduksiPageData["allVariants"];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function RecipeListCard({
  recipes,
  selectedStatus,
  availableUnits,
  categories,
  products,
  allVariants,
  page,
  pageSize,
  hasNextPage,
  hasPreviousPage,
}: RecipeListCardProps) {
  const shouldShowPagination = hasPreviousPage || hasNextPage;
  const buildQuery = (nextPage: number) => {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    query.set("pageSize", String(pageSize));
    if (selectedStatus) query.set("status", selectedStatus);
    return query.toString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Daftar resep ({recipes.length})</CardTitle>
            <CardDescription>Pilih resep untuk melihat detail dan mengubah komponennya.</CardDescription>
          </div>
          <CreateRecipeDrawer
            selectedStatus={selectedStatus}
            availableUnits={availableUnits}
            categories={categories}
            products={products}
            allVariants={allVariants}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Varian</TableHead>
              <TableHead>Resep</TableHead>
              <TableHead>Hasil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Jumlah bahan</TableHead>
              <TableHead>Jumlah biaya tambahan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Belum ada resep produksi sesuai filter.
                </TableCell>
              </TableRow>
            ) : (
              recipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell>
                    {recipe.productVariant.product.name}
                    <p className="text-xs text-muted-foreground">SKU: {recipe.productVariant.sku ?? "-"}</p>
                  </TableCell>
                  <TableCell>{recipe.productVariant.size ? `${recipe.productVariant.size}` : "-"}</TableCell>
                  <TableCell>{recipe.name}</TableCell>
                  <TableCell>
                    {Number(recipe.outputQty).toLocaleString("id-ID")} {recipe.outputUnit.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant={recipe.status === "active" ? "default" : "secondary"}>
                      {statusLabel(recipe.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{recipe.materials.length}</TableCell>
                  <TableCell>{recipe.costs.length}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/resep-produksi/${recipe.id}`}>Kelola resep</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {shouldShowPagination ? (
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Halaman {page} · {recipes.length} baris
            </p>
            <Pagination className="mx-0 w-auto justify-start sm:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={`?${buildQuery(Math.max(1, page - 1))}`}
                    className={!hasPreviousPage ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href={`?${buildQuery(page + 1)}`}
                    className={!hasNextPage ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
