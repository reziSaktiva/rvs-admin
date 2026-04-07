import { PageSkeleton } from "@/components/layout/page-skeleton";

export default function HppPage() {
  return (
    <PageSkeleton
      title="Kalkulator HPP"
      description="Hitung HPP per output unit berdasarkan resep aktif, waste, dan biaya tambahan."
      items={["Simulasi HPP", "Breakdown biaya", "Margin target", "Rekomendasi harga jual"]}
    />
  );
}
