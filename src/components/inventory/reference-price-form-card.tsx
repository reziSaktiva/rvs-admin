"use client";

import { useMemo, useRef, useState } from "react";
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  initialSelectedItemId?: string;
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

const getInitialItem = (
  items: ReferencePriceOption[],
  initialSelectedItemId?: string
): ReferencePriceOption | null => {
  if (!items.length) return null;
  if (initialSelectedItemId) {
    const matched = items.find((item) => item.id === initialSelectedItemId);
    if (matched) return matched;
  }
  return items[0] ?? null;
};

export function ReferencePriceFormCard({
  items,
  itemsWithoutReferencePrice,
  initialSelectedItemId,
  action,
}: ReferencePriceFormCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const initialItem = getInitialItem(items, initialSelectedItemId);
  const initialSelectionValue = initialItem
    ? `${initialItem.id}::${initialItem.defaultUnit.id}`
    : "";
  const [selectedSelection, setSelectedSelection] = useState(initialSelectionValue);
  const selectedItemId = selectedSelection.split("::")[0] ?? "";
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );
  const [priceInput, setPriceInput] = useState(() => {
    if (!initialItem) return "";
    return toInputValue(
      initialItem.referencePrice > 0 ? initialItem.referencePrice : initialItem.latestPurchasePrice
    );
  });
  const parsedPriceInput = Number(priceInput);
  const normalizedPriceInput =
    Number.isFinite(parsedPriceInput) && parsedPriceInput > 0
      ? toInputValue(parsedPriceInput)
      : "";
  const currentReferenceInput = toInputValue(selectedItem?.referencePrice ?? null);
  const isSameAsCurrentReference =
    currentReferenceInput !== "" && normalizedPriceInput === currentReferenceInput;
  const isSubmitDisabled = items.length === 0 || isSameAsCurrentReference;

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="reference-price-item" className="text-sm font-medium">
          Pilih bahan
        </label>
        <Select
          value={selectedSelection}
          onValueChange={(nextSelection) => {
            setSelectedSelection(nextSelection);
            const [nextItemId] = nextSelection.split("::");
            const nextItem = items.find((item) => item.id === nextItemId) ?? null;
            const nextDefault =
              nextItem && nextItem.referencePrice > 0
                ? nextItem.referencePrice
                : nextItem?.latestPurchasePrice ?? null;
            setPriceInput(toInputValue(nextDefault));
          }}
          disabled={items.length === 0}
        >
          <SelectTrigger id="reference-price-item" className="w-full">
            <SelectValue placeholder="Pilih bahan" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.id} value={`${item.id}::${item.defaultUnit.id}`}>
                {item.name} ({item.defaultUnit.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="itemSelection" value={selectedSelection} />
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
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" size="sm" variant="default" disabled={isSubmitDisabled}>
              Simpan harga
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi simpan harga acuan</DialogTitle>
              <DialogDescription>
                Anda akan menyimpan harga acuan{" "}
                <span className="font-medium text-foreground">
                  {normalizedPriceInput
                    ? formatCurrency(Number(normalizedPriceInput))
                    : "harga belum valid"}
                </span>{" "}
                untuk bahan{" "}
                <span className="font-medium text-foreground">
                  {selectedItem ? `${selectedItem.name} (${selectedItem.defaultUnit.code})` : "-"}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  type="button"
                  onClick={() => {
                    formRef.current?.requestSubmit();
                  }}
                >
                  Ya, simpan
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {isSameAsCurrentReference ? (
        <p className="text-xs text-amber-700 dark:text-amber-500">
          Harga sama dengan acuan terakhir. Ubah nilai untuk menyimpan pembaruan.
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Gunakan harga pembelian terakhir sebagai patokan awal bila belum ada standar harga internal.
      </p>
    </form>
  );
}
