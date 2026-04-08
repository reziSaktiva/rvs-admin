// ── Dummy Data untuk Dashboard ────────────────────────────────────────────────

export interface StatCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: string;
  description: string;
}

export const statCards: StatCard[] = [
  {
    id: "total-produk",
    title: "Total Produk",
    value: "1.284",
    change: "+12%",
    changeType: "positive",
    icon: "Package",
    description: "dari bulan lalu",
  },
  {
    id: "total-stok",
    title: "Total Stok",
    value: "48.320",
    change: "-3%",
    changeType: "negative",
    icon: "Warehouse",
    description: "dari bulan lalu",
  },
  {
    id: "total-penjualan",
    title: "Total Penjualan",
    value: "Rp 284.500.000",
    change: "+24%",
    changeType: "positive",
    icon: "ShoppingCart",
    description: "dari bulan lalu",
  },
  {
    id: "total-pesanan",
    title: "Total Pesanan",
    value: "3.842",
    change: "+8%",
    changeType: "positive",
    icon: "ClipboardList",
    description: "dari bulan lalu",
  },
];
