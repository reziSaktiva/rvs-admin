import { PageSkeleton } from "@/components/layout/page-skeleton";

export default function PenjualanPage() {
  return (
    <PageSkeleton
      title="Penjualan"
      description="Kelola transaksi penjualan dan evaluasi profit berdasarkan HPP aktual."
      items={["Input penjualan", "Harga jual", "Laba kotor", "Status transaksi"]}
    />
  );
}
