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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addRawMaterialAction } from "@/app/(dashboard)/bahan-baku/actions";

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
                <select
                  id="bb-type"
                  name="itemType"
                  defaultValue="raw_material"
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="raw_material">Bahan utama (kain, benang, dll.)</option>
                  <option value="packaging">Kemasan (plastik, dus, label, dll.)</option>
                </select>
              </Field>

              <Field className="md:col-span-2 xl:col-span-2">
                <FieldLabel htmlFor="bb-unit">
                  Satuan utama <span className="text-destructive">*</span>
                </FieldLabel>
                <select
                  id="bb-unit"
                  name="unitId"
                  required
                  defaultValue=""
                  disabled={availableUnits.length === 0}
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="" disabled>
                    Pilih satuan
                  </option>
                  {availableUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.code} — {unit.name} ({dimensionHint(unit.dimension)})
                    </option>
                  ))}
                </select>
                <FieldDescription>
                  Satuan ini jadi satuan utama untuk hitung stok dan harga bahan.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Harga dan stok awal (opsional)</FieldLegend>
            <FieldDescription>
              Isi bagian ini jika Anda sudah punya data awal saat mulai mencatat.
            </FieldDescription>
            <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="bb-initial-price">Harga awal per satuan</FieldLabel>
                <Input
                  id="bb-initial-price"
                  name="initialPrice"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Contoh: 15000"
                />
                <FieldDescription>
                  Dipakai sebagai acuan biaya sampai ada data pembelian terbaru.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="bb-opening-qty">Stok awal</FieldLabel>
                <Input
                  id="bb-opening-qty"
                  name="openingQty"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Contoh: 100"
                />
                <FieldDescription>Isi jika mulai mencatat dari saldo yang sudah ada.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="bb-opening-cost">Harga per satuan untuk stok awal</FieldLabel>
                <Input
                  id="bb-opening-cost"
                  name="openingUnitCost"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Wajib jika stok awal diisi"
                />
                <FieldDescription>
                  Jika kosong, sistem pakai harga awal per satuan (jika diisi).
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>

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
