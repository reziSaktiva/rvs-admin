"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryMovementOptionItem } from "@/lib/inventory";

type PurchaseMaterialFormProps = {
  items: InventoryMovementOptionItem[];
};

const toDateTimeLocal = (value: Date) => {
  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export function PurchaseMaterialForm({ items }: PurchaseMaterialFormProps) {
  const router = useRouter();
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => toDateTimeLocal(new Date()));
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === itemId) ?? null,
    [items, itemId]
  );

  const qtyValue = Number(qty);
  const unitCostValue = Number(unitCost);
  const isValidQty = Number.isFinite(qtyValue) && qtyValue > 0;
  const isValidUnitCost = Number.isFinite(unitCostValue) && unitCostValue > 0;
  const canSubmit = !!selectedItem && isValidQty && isValidUnitCost && !isSubmitting;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedItem) {
      setIsError(true);
      setMessage("Pilih bahan terlebih dahulu");
      return;
    }
    if (!isValidQty) {
      setIsError(true);
      setMessage("Jumlah harus lebih besar dari nol");
      return;
    }
    if (!isValidUnitCost) {
      setIsError(true);
      setMessage("Harga beli per satuan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const payload = {
        itemId: selectedItem.id,
        movementType: "purchase",
        qtyDelta: qtyValue,
        unitId: selectedItem.defaultUnit.id,
        unitCost: unitCostValue,
        referenceType: supplierName.trim() ? `supplier:${supplierName.trim()}` : "purchase",
        referenceId: referenceId.trim() || undefined,
        note: note.trim() || undefined,
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : undefined,
      };

      const response = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Gagal menyimpan pembelian");
      }

      setIsError(false);
      setMessage("Pembelian berhasil dicatat");
      setQty("");
      setUnitCost("");
      setReferenceId("");
      setNote("");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan pembelian");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catat pembelian baru</CardTitle>
        <CardDescription>
          Setelah disimpan, stok bertambah dan harga rata-rata di gudang ikut dihitung ulang sesuai
          aturan sistem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada bahan aktif. Tambahkan bahan di halaman Bahan baku, lalu kembali ke halaman ini.
          </p>
        ) : (
          <form className="grid gap-3 md:grid-cols-3" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="purchase-item">Bahan yang dibeli</Label>
              <select
                id="purchase-item"
                value={itemId}
                onChange={(event) => setItemId(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.defaultUnit.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchase-qty">
                Jumlah masuk ({selectedItem?.defaultUnit.code ?? "satuan"})
              </Label>
              <Input
                id="purchase-qty"
                type="number"
                step="0.0001"
                value={qty}
                onChange={(event) => setQty(event.target.value)}
                placeholder="Contoh: 25"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchase-unit-cost">Harga beli per satuan</Label>
              <Input
                id="purchase-unit-cost"
                type="number"
                step="0.0001"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
                placeholder="Contoh: 12000"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchase-supplier">Nama pemasok (opsional)</Label>
              <Input
                id="purchase-supplier"
                value={supplierName}
                onChange={(event) => setSupplierName(event.target.value)}
                placeholder="Contoh: Toko Kimia Jaya"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchase-reference">Nomor nota / PO (opsional)</Label>
              <Input
                id="purchase-reference"
                value={referenceId}
                onChange={(event) => setReferenceId(event.target.value)}
                placeholder="Contoh: F-2026-0142"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchase-date">Tanggal & jam transaksi</Label>
              <Input
                id="purchase-date"
                type="datetime-local"
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
              />
            </div>

            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="purchase-note">Catatan (opsional)</Label>
              <Input
                id="purchase-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Contoh: barang sudah dicek fisik"
              />
            </div>

            <div className="md:col-span-3 flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={!canSubmit}>
                {isSubmitting ? "Menyimpan..." : "Simpan pembelian"}
              </Button>
              {message ? (
                <p className={`text-sm ${isError ? "text-destructive" : "text-emerald-600"}`}>
                  {message}
                </p>
              ) : null}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
