import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RecipeStatus } from "./view-model";

type RecipeFilterCardProps = {
  selectedStatus?: RecipeStatus;
};

export function RecipeFilterCard({ selectedStatus }: RecipeFilterCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter resep</CardTitle>
        <CardDescription>Tampilkan resep berdasarkan status.</CardDescription>
      </CardHeader>
      <CardContent>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <Select name="status" defaultValue={selectedStatus ?? "__all"}>
              <SelectTrigger className="min-w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Semua</SelectItem>
                <SelectItem value="draft">Draf</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="archived">Diarsipkan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit">Terapkan</Button>
          <Button asChild type="button" variant="ghost">
            <Link href="/resep-produksi">Hapus filter</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
