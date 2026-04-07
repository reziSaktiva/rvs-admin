import { PageSkeleton } from "@/components/layout/page-skeleton";

export default function LaporanPage() {
  return (
    <PageSkeleton
      title="Laporan Profit"
      description="Laporan margin, profit, dan performa penjualan untuk pengambilan keputusan bisnis."
      items={["Laporan HPP", "Profit per produk", "Tren penjualan", "Ringkasan periodik"]}
    />
  );
}
