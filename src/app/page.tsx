import {
  Package,
  Warehouse,
  ShoppingCart,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statCards, recentOrders } from "@/data/dashboard-data";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

const iconMap: Record<string, React.ElementType> = {
  Package,
  Warehouse,
  ShoppingCart,
  ClipboardList,
};

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  selesai: { label: "Selesai", variant: "default" },
  proses: { label: "Diproses", variant: "secondary" },
  menunggu: { label: "Menunggu", variant: "outline" },
  batal: { label: "Dibatalkan", variant: "destructive" },
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = iconMap[stat.icon] ?? Package;
            return (
              <Card key={stat.id} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {stat.changeType === "positive" && (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    {stat.changeType === "negative" && (
                      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    )}
                    {stat.changeType === "neutral" && (
                      <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        stat.changeType === "positive" && "text-emerald-500",
                        stat.changeType === "negative" && "text-red-500",
                        stat.changeType === "neutral" && "text-muted-foreground"
                      )}
                    >
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stat.description}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent Orders */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Pesanan Terbaru</CardTitle>
            <CardDescription>
              5 pesanan terbaru dari sistem penjualan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      ID Pesanan
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Pelanggan
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Produk
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => {
                    const status = statusConfig[order.status];
                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td className="py-3 font-mono text-xs text-muted-foreground">
                          {order.id}
                        </td>
                        <td className="py-3 font-medium">{order.customer}</td>
                        <td className="py-3 text-muted-foreground">
                          {order.product}
                        </td>
                        <td className="py-3 font-medium">{order.amount}</td>
                        <td className="py-3">
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {order.date}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
