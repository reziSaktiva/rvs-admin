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

export interface RecentOrder {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: "selesai" | "proses" | "menunggu" | "batal";
  date: string;
}

export const recentOrders: RecentOrder[] = [
  {
    id: "ORD-001",
    customer: "Budi Santoso",
    product: "Baju Batik Premium",
    amount: "Rp 450.000",
    status: "selesai",
    date: "19 Feb 2026",
  },
  {
    id: "ORD-002",
    customer: "Siti Rahayu",
    product: "Celana Chino Navy",
    amount: "Rp 280.000",
    status: "proses",
    date: "19 Feb 2026",
  },
  {
    id: "ORD-003",
    customer: "Ahmad Fauzi",
    product: "Kemeja Flannel",
    amount: "Rp 195.000",
    status: "menunggu",
    date: "18 Feb 2026",
  },
  {
    id: "ORD-004",
    customer: "Dewi Lestari",
    product: "Dress Casual",
    amount: "Rp 375.000",
    status: "selesai",
    date: "18 Feb 2026",
  },
  {
    id: "ORD-005",
    customer: "Reza Pratama",
    product: "Jaket Bomber",
    amount: "Rp 520.000",
    status: "batal",
    date: "17 Feb 2026",
  },
];

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Stok", href: "/stok", icon: "Warehouse" },
  { label: "Pesanan", href: "/pesanan", icon: "ClipboardList", badge: 5 },
  { label: "Pelanggan", href: "/pelanggan", icon: "Users" },
  { label: "Laporan", href: "/laporan", icon: "BarChart3" },
  { label: "Design System", href: "/design-system", icon: "Palette" },
  { label: "Pengaturan", href: "/pengaturan", icon: "Settings" },
];
