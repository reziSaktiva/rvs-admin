"use client";

import { useState } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function OptionalOpeningStockFields() {
  const [showOpeningStock, setShowOpeningStock] = useState(false);

  return (
    <FieldSet>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <FieldLegend>Harga dan stok awal (opsional)</FieldLegend>
          <FieldDescription>
            Aktifkan jika Anda sudah punya data awal saat mulai mencatat.
          </FieldDescription>
        </div>
        <div className="flex items-center gap-2">
          <FieldLabel htmlFor="bb-opening-toggle">Stok Awal</FieldLabel>
          <Switch
            id="bb-opening-toggle"
            checked={showOpeningStock}
            onCheckedChange={setShowOpeningStock}
            aria-label="Tampilkan form harga dan stok awal"
          />
        </div>
      </div>

      {showOpeningStock ? (
        <FieldGroup className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="bb-initial-price">Harga awal acuan bahan</FieldLabel>
            <Input
              id="bb-initial-price"
              name="initialPrice"
              type="number"
              step="1"
              min="0"
              placeholder="Contoh: 15000"
            />
            <FieldDescription>
              Dipakai sebagai acuan biaya HPP, jika tidak ada akan menggunakan harga pembelian terbaru.
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
            <FieldLabel htmlFor="bb-opening-cost">Harga stok awal per satuan</FieldLabel>
            <Input
              id="bb-opening-cost"
              name="openingUnitCost"
              type="number"
              step="1"
              min="0"
              placeholder="Wajib jika stok awal diisi"
            />
            <FieldDescription>
              Jika kosong, sistem pakai harga awal per satuan (jika diisi).
            </FieldDescription>
          </Field>
        </FieldGroup>
      ) : null}
    </FieldSet>
  );
}
