import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getResepProduksiPageData } from "./data";
import { RecipeFilterCard } from "./components/recipe-filter-card";
import { RecipeListCard } from "./components/recipe-list-card";
import { errorLabel, isRecipeStatus } from "./components/view-model";

type ResepProduksiPageProps = {
  searchParams?: Promise<{
    recipeId?: string;
    status?: "draft" | "active" | "archived";
    error?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function ResepProduksiPage({ searchParams }: ResepProduksiPageProps) {
  const params = (await searchParams) ?? {};
  const parsedPage = Number(params.page ?? "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedPageSize = Number(params.pageSize ?? "25");
  const pageSize = [10, 25, 50].includes(parsedPageSize) ? parsedPageSize : 25;
  const statusParam = params.status as string | undefined;
  const selectedStatus = statusParam === "__all" ? undefined : isRecipeStatus(statusParam) ? statusParam : undefined;
  const { recipeRows, availableItems, availableUnits, categories, products, allVariants, hasNextPage } =
    await getResepProduksiPageData(selectedStatus, { page, pageSize });
  const hasPreviousPage = page > 1;

  const pageError = errorLabel(params.error);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resep produksi</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar bahan (BOM) dan biaya tambahan untuk menghitung HPP dengan lebih akurat.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/hpp">Buka Kalkulator HPP</Link>
        </Button>
      </div>

      {pageError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {pageError}
        </div>
      ) : null}
      <RecipeFilterCard selectedStatus={selectedStatus} />
      <RecipeListCard
        recipes={recipeRows}
        selectedStatus={selectedStatus}
        availableItems={availableItems}
        availableUnits={availableUnits}
        categories={categories}
        products={products}
        allVariants={allVariants}
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </div>
  );
}
