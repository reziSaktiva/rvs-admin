"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ReferencePriceOption = {
  id: string;
  name: string;
  defaultUnit: {
    id: string;
    code: string;
  };
  referencePrice: number;
  latestPurchasePrice: number | null;
  latestPurchaseUnitCode: string | null;
};

type ReferencePriceFormCardProps = {
  items: ReferencePriceOption[];
  itemsWithoutReferencePrice: number;
  action: (formData: FormData) => Promise<void>;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

const toInputValue = (value: number | null) => {
  if (value === null || !Number.isFinite(value) || value <= 0) return "";
  return String(Math.round(value));
};

export function ReferencePriceFormCard({
  items,
  itemsWithoutReferencePrice,
  action,
}: ReferencePriceFormCardProps) {
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? "");
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );
  const [priceInput, setPriceInput] = useState(() => {
    if (!items[0]) return "";
    return toInputValue(
      items[0].referencePrice > 0 ? items[0].referencePrice : items[0].latestPurchasePrice
    );
  });

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="reference-price-item" className="text-sm font-medium">
          Pilih bahan
        </label>
        <select
          id="reference-price-item"
          name="itemSelection"
          required
          disabled={items.length === 0}
          value={
            selectedItem ? `${selectedItem.id}::${selectedItem.defaultUnit.id}` : ""
          }
          onChange={(event) => {
            const [nextItemId] = event.target.value.split("::");
            setSelectedItemId(nextItemId ?? "");
            const nextItem = items.find((item) => item.id === nextItemId) ?? null;
            const nextDefault =
              nextItem && nextItem.referencePrice > 0
                ? nextItem.referencePrice
                : nextItem?.latestPurchasePrice ?? null;
            setPriceInput(toInputValue(nextDefault));
          }}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {items.map((item) => (
            <option
              key={item.id}
              value={`${item.id}::${item.defaultUnit.id}`}
            >
              {item.name} ({item.defaultUnit.code})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="reference-price-value" className="text-sm font-medium">
          Harga acuan per satuan
        </label>
        <Input
          id="reference-price-value"
          name="pricePerUnit"
          type="number"
          step="1"
          min="1"
          placeholder="Contoh: 15000"
          required
          value={priceInput}
          onChange={(event) => setPriceInput(event.target.value)}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {selectedItem?.referencePrice && selectedItem.referencePrice > 0 ? (
          <p>
            Default terisi dari harga acuan saat ini:{" "}
            {formatCurrency(selectedItem.referencePrice)} / {selectedItem.defaultUnit.code}
          </p>
        ) : selectedItem?.latestPurchasePrice && selectedItem.latestPurchasePrice > 0 ? (
          <p>
            Default memakai harga beli terakhir:{" "}
            {formatCurrency(selectedItem.latestPurchasePrice)} /{" "}
            {selectedItem.latestPurchaseUnitCode ?? selectedItem.defaultUnit.code}
          </p>
        ) : (
          <p>Belum ada harga acuan maupun pembelian terakhir untuk bahan ini.</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>{itemsWithoutReferencePrice} bahan belum punya harga acuan.</p>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={items.length === 0}
        >
          Simpan harga
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Gunakan harga pembelian terakhir sebagai patokan awal bila belum ada standar harga internal.
      </p>
    </form>
  );
}
