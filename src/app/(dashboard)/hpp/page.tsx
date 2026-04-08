import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HppCalculator } from "@/components/hpp/hpp-calculator";
import { getHppRecipeOptions } from "@/lib/hpp";

export default async function HppPage() {
  const recipes = await getHppRecipeOptions();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kalkulator HPP</h1>
        <p className="text-sm text-muted-foreground">
          Pilih resep produksi, lihat breakdown biaya, lalu simulasi margin dan harga jual.
        </p>
      </div>

      {recipes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum Ada Resep</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tambahkan data `recipes` terlebih dahulu agar kalkulator HPP bisa digunakan.
          </CardContent>
        </Card>
      ) : (
        <HppCalculator recipes={recipes} initialRecipeId={recipes[0].recipeId} />
      )}
    </div>
  );
}
