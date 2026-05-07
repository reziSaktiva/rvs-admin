import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecipeRow, ResepProduksiPageData } from "../data";
import { statusLabel, type RecipeStatus } from "./view-model";
import { ManageRecipeDrawer } from "./drawers/manage-recipe-drawer";
import { CreateRecipeDrawer } from "./drawers/create-recipe-drawer";

type RecipeListCardProps = {
  recipes: RecipeRow[];
  selectedStatus?: RecipeStatus;
  availableItems: ResepProduksiPageData["availableItems"];
  availableUnits: ResepProduksiPageData["availableUnits"];
  categories: ResepProduksiPageData["categories"];
  products: ResepProduksiPageData["products"];
  allVariants: ResepProduksiPageData["allVariants"];
};

export function RecipeListCard({
  recipes,
  selectedStatus,
  availableItems,
  availableUnits,
  categories,
  products,
  allVariants,
}: RecipeListCardProps) {
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
                    <ManageRecipeDrawer
                      recipe={recipe}
                      selectedStatus={selectedStatus}
                      availableItems={availableItems}
                      availableUnits={availableUnits}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
