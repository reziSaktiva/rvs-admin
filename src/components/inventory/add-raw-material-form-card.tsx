import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addRawMaterialAction } from "@/app/(dashboard)/bahan-baku/actions";
import { OptionalOpeningStockFields } from "./optional-opening-stock-fields";

type UnitOption = {
  id: string;
  code: string;
  name: string;
  dimension: string;
};

type AddRawMaterialFormCardProps = {
  availableUnits: UnitOption[];
};

const dimensionHint = (dimension: string) => {
  const map: Record<string, string> = {
    count: "dihitung per buah / pasang / kemasan",
    weight: "berat",
    volume: "isi cairan",
    length: "panjang",
  };
  return map[dimension] ?? dimension;
};

export function AddRawMaterialFormCard({ availableUnits }: AddRawMaterialFormCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah bahan baru</CardTitle>
        <CardDescription>
          Isi nama bahan dan satuan sebagai data wajib. Kode internal, harga awal, dan stok awal boleh
          diisi nanti.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableUnits.length === 0 ? (
          <p className="text-sm text-amber-700 dark:text-amber-500">
            Belum ada satuan di sistem. Tambahkan data satuan terlebih dahulu agar form ini bisa
            digunakan.
          </p>
        ) : null}

        <form action={addRawMaterialAction} className="space-y-4">
          <FieldSet>
            <FieldLegend>Informasi bahan</FieldLegend>
            <FieldDescription>
              Data ini dipakai agar bahan bisa dipilih saat pembelian dan saat catat perubahan stok.
            </FieldDescription>
            <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field className="md:col-span-2 xl:col-span-2">
                <FieldLabel htmlFor="bb-name">
                  Nama bahan <span className="text-destructive">*</span>
                </FieldLabel>
                <Input id="bb-name" name="name" required placeholder="Contoh: Benang PE 20s" />
              </Field>

              <Field>
                <FieldLabel htmlFor="bb-sku">Kode bahan (opsional)</FieldLabel>
                <Input id="bb-sku" name="sku" placeholder="Contoh: BB-BENANG-01" />
                <FieldDescription>Boleh dikosongkan jika tidak memakai kode.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="bb-type">Kelompok bahan</FieldLabel>
                <Select name="itemType" defaultValue="raw_material">
                  <SelectTrigger id="bb-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_material">Bahan utama (kain, benang, dll.)</SelectItem>
                    <SelectItem value="packaging">Kemasan (plastik, dus, label, dll.)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field className="md:col-span-2 xl:col-span-2">
                <FieldLabel htmlFor="bb-unit">
                  Satuan utama <span className="text-destructive">*</span>
                </FieldLabel>
                <Select name="unitId" disabled={availableUnits.length === 0}>
                  <SelectTrigger id="bb-unit" className="w-full">
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.code} — {unit.name} ({dimensionHint(unit.dimension)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Satuan ini jadi satuan utama untuk hitung stok dan harga bahan.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>

          <OptionalOpeningStockFields />

          <div className="flex items-end">
            <Button type="submit" disabled={availableUnits.length === 0}>
              Simpan bahan
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground">
          Setelah disimpan, bahan ini langsung muncul di form perubahan stok dan halaman pembelian.
        </p>
      </CardContent>
    </Card>
  );
}
