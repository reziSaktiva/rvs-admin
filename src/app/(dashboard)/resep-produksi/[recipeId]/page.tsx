import { notFound } from "next/navigation";
import { getResepProduksiRecipeDetailData } from "../data";
import { RecipeDetailContent } from "../components/recipe-detail-content";
import { RecipeSuccessToast } from "../components/recipe-success-toast";
import { errorLabel, successLabel } from "../components/view-model";

type RecipeDetailPageProps = {
  params: Promise<{
    recipeId: string;
  }>;
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function RecipeDetailPage({ params, searchParams }: RecipeDetailPageProps) {
  const { recipeId } = await params;
  const qp = (await searchParams) ?? {};

  const detail = await getResepProduksiRecipeDetailData(recipeId);
  if (!detail.recipe) notFound();

  const successMessage = successLabel(qp.success);
  const pageError = errorLabel(qp.error);
  const detailPath = `/resep-produksi/${recipeId}`;

  const readOnlyMessage = detail.access.canManage
    ? null
    : !detail.access.canManageByRole
      ? `Akun dengan role ${detail.access.roleName ?? "saat ini"} hanya bisa melihat resep ini (view-only).`
      : !detail.access.canManageByStatus
        ? "Resep berstatus diarsipkan, sehingga hanya bisa dilihat (view-only)."
        : "Mode view-only aktif pada resep ini.";

  return (
    <div className="space-y-4">
      {successMessage ? <RecipeSuccessToast message={successMessage} /> : null}
      {pageError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {pageError}
        </div>
      ) : null}
      <RecipeDetailContent
        recipe={detail.recipe}
        availableItems={detail.availableItems}
        availableUnits={detail.availableUnits}
        detailPath={detailPath}
        canManage={detail.access.canManage}
        readOnlyMessage={readOnlyMessage}
      />
    </div>
  );
}
