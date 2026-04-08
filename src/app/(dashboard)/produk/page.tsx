import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProducts } from "@/lib/product";

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

const formatPriceRange = (minPrice: number, maxPrice: number) => {
  if (minPrice === maxPrice) return formatCurrency(minPrice);
  return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
};

export default async function ProdukPage() {
  const { data: products } = await getProducts();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Produk & Varian</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan master produk, SKU varian, harga jual, stok, dan status aktif.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Varian Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {products.reduce((sum, item) => sum + item.activeVariantCount, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {products.reduce((sum, item) => sum + item.totalStock, 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Varian</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Belum ada data produk.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">SKU contoh: {item.sampleSku}</p>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{formatPriceRange(item.minPrice, item.maxPrice)}</TableCell>
                    <TableCell>
                      {item.activeVariantCount}/{item.variantCount}
                    </TableCell>
                    <TableCell>{item.totalStock.toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.tags.length > 0 ? item.tags.join(", ") : "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
