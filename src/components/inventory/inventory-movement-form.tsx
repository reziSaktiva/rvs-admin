"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryMovementOptionItem, StockMovementType } from "@/lib/inventory";

type InventoryMovementFormProps = {
  items: InventoryMovementOptionItem[];
  movementTypes: StockMovementType[];
};

const INCOMING_MOVEMENT_TYPES: StockMovementType[] = [
  "opening",
  "purchase",
  "production_in",
  "adjustment_in",
  "return_in",
  "transfer_in",
];

const REQUIRED_UNIT_COST_MOVEMENT_TYPES: StockMovementType[] = ["opening", "purchase"];

const movementTypeLabel: Record<StockMovementType, string> = {
  opening: "Saldo awal",
  purchase: "Pembelian",
  production_in: "Masuk produksi",
  production_out: "Keluar produksi",
  sale_out: "Keluar penjualan",
  adjustment_in: "Penyesuaian masuk",
  adjustment_out: "Penyesuaian keluar",
  return_in: "Retur masuk",
  return_out: "Retur keluar",
  transfer_in: "Transfer masuk",
  transfer_out: "Transfer keluar",
};

export function InventoryMovementForm({ items, movementTypes }: InventoryMovementFormProps) {
  const router = useRouter();
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [movementType, setMovementType] = useState<StockMovementType>(
    movementTypes[0] ?? "purchase"
  );
  const [qtyInput, setQtyInput] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [referenceType, setReferenceType] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === itemId) ?? null,
    [items, itemId]
  );

  const isIncoming = INCOMING_MOVEMENT_TYPES.includes(movementType);
  const quantityValue = Number(qtyInput);
  const isQuantityValid = Number.isFinite(quantityValue) && quantityValue > 0;
  const normalizedQtyDelta = isQuantityValid
    ? Math.abs(quantityValue) * (isIncoming ? 1 : -1)
    : NaN;
  const requiresUnitCost = REQUIRED_UNIT_COST_MOVEMENT_TYPES.includes(movementType);
  const hasUnitCost = unitCost.trim().length > 0 && Number(unitCost) > 0;
  const canEstimateProjectedStock =
    !!selectedItem &&
    !!selectedItem.balance &&
    selectedItem.balance.unit.id === selectedItem.defaultUnit.id &&
    isQuantityValid;
  const projectedQty = canEstimateProjectedStock
    ? selectedItem.balance!.qtyOnHand + normalizedQtyDelta
    : null;
  const isPotentialNegativeStock = projectedQty !== null && projectedQty < 0;
  const isSubmitBlocked =
    !selectedItem ||
    !isQuantityValid ||
    isPotentialNegativeStock ||
    (requiresUnitCost && !hasUnitCost);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedItem) {
      setIsError(true);
      setMessage("Pilih bahan baku terlebih dahulu");
      return;
    }
    if (!isQuantityValid) {
      setIsError(true);
      setMessage("Qty harus lebih besar dari 0");
      return;
    }
    if (requiresUnitCost && !hasUnitCost) {
      setIsError(true);
      setMessage("Harga per unit wajib diisi untuk saldo awal dan pembelian");
      return;
    }
    if (isPotentialNegativeStock) {
      setIsError(true);
      setMessage("Mutasi keluar menyebabkan stok menjadi negatif");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const payload = {
        itemId: selectedItem.id,
        movementType,
        qtyDelta: normalizedQtyDelta,
        unitId: selectedItem.defaultUnit.id,
        unitCost: unitCost.trim() ? Number(unitCost) : undefined,
        referenceType: referenceType.trim() || undefined,
        referenceId: referenceId.trim() || undefined,
        note: note.trim() || undefined,
      };

      const response = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Gagal menyimpan mutasi stok");
      }

      setMessage("Mutasi stok berhasil disimpan");
      setIsError(false);
      setQtyInput("");
      setUnitCost("");
      setReferenceType("");
      setReferenceId("");
      setNote("");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan mutasi stok");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Input Mutasi Stok</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada item bahan baku aktif. Tambahkan `cost_items` terlebih dahulu.
          </p>
        ) : (
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="itemId">Item bahan</Label>
              <select
                id="itemId"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                required
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.defaultUnit.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="movementType">Tipe mutasi</Label>
              <select
                id="movementType"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as StockMovementType)}
                required
              >
                {movementTypes.map((type) => (
                  <option key={type} value={type}>
                    {movementTypeLabel[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qtyDelta">
                Qty ({selectedItem?.defaultUnit.code ?? "-"}) - input angka positif
              </Label>
              <Input
                id="qtyDelta"
                type="number"
                step="0.0001"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Arah qty otomatis: {isIncoming ? "masuk (+)" : "keluar (-)"}.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unitCost">
                Harga per unit{" "}
                {requiresUnitCost
                  ? "(wajib untuk saldo awal/pembelian)"
                  : isIncoming
                    ? "(disarankan)"
                    : "(opsional)"}
              </Label>
              <Input
                id="unitCost"
                type="number"
                step="0.0001"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="contoh: 12500"
                required={requiresUnitCost}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="referenceType">Reference type</Label>
              <Input
                id="referenceType"
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value)}
                placeholder="purchase_order / production"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="referenceId">Reference ID</Label>
              <Input
                id="referenceId"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="PO-2026-001"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="note">Catatan</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan tambahan mutasi"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <Button disabled={isSubmitting || isSubmitBlocked} type="submit">
                {isSubmitting ? "Menyimpan..." : "Simpan mutasi"}
              </Button>
              {selectedItem?.balance && (
                <p className="text-xs text-muted-foreground">
                  Stok saat ini: {selectedItem.balance.qtyOnHand.toLocaleString("id-ID")}{" "}
                  {selectedItem.balance.unit.code}
                </p>
              )}
            </div>

            {isPotentialNegativeStock && (
              <p className="md:col-span-2 text-sm text-destructive">
                Warning: mutasi ini membuat proyeksi stok menjadi{" "}
                {projectedQty?.toLocaleString("id-ID")} {selectedItem?.defaultUnit.code}.
              </p>
            )}

            <div className="md:col-span-2 flex items-center gap-3">
              {message && (
                <p className={`text-sm ${isError ? "text-destructive" : "text-emerald-600"}`}>
                  {message}
                </p>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
