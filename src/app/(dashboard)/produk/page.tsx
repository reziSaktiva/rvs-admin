import { PageSkeleton } from "@/components/layout/page-skeleton";

export default function ProdukPage() {
  return (
    <PageSkeleton
      title="Produk & Varian"
      description="Kelola master produk, varian, dan status jual untuk perhitungan HPP dan penjualan."
      items={["Master produk", "Varian SKU", "Kategori", "Status aktif"]}
    />
  );
}
