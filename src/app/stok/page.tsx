import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { products } from "@/lib/dummyData";
import { cn } from "@/lib/utils";
import { EditIcon, FilterIcon, LayoutGridIcon, ListIcon, PlusIcon } from "lucide-react";
import Image from "next/image";

export default function StokPage() {
    return (
        <Tabs defaultValue="list">
            <Card>
                <CardHeader>
                    <CardTitle>
                        <h1>Stok</h1>
                    </CardTitle>
                    <CardDescription>
                        <div className="flex gap-3 items-center">
                            <Input placeholder="Cari produk..." />
                            <TabsList>
                                <TabsTrigger value="list"><ListIcon /></TabsTrigger>
                                <TabsTrigger value="grid"><LayoutGridIcon /></TabsTrigger>
                            </TabsList>
                            <Button variant="default">
                                Filter
                                <FilterIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="default">
                                <PlusIcon className="w-4 h-4" />
                                Tambah Produk
                            </Button>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TabsContent value="list">
                        <Table>
                            <TableCaption>A list of your recent invoices.</TableCaption>
                            <TableHeader className="bg-primary/10">
                                <TableRow>
                                    <TableHead>Gambar</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Harga</TableHead>
                                    <TableHead>tag</TableHead>
                                    <TableHead>category</TableHead>
                                    <TableHead>Stok</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product, index) => (
                                    <TableRow key={product.name + index} className={cn(index % 2 === 0 ? "bg-secondary/30" : "", "cursor-pointer")}>
                                        <TableCell>
                                            <div className="border border-gray-300 rounded-md p-2 relative aspect-4/5 w-24 overflow-hidden">
                                                <Image src={product.image} alt={product.name} fill className="object-cover" />
                                            </div>
                                        </TableCell>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{product.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</TableCell>
                                        <TableCell>{product.tags?.join(', ')}</TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell>{product.stok}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                    <TabsContent value="grid">
                        <div className="grid grid-cols-4 gap-4">
                            {products.map((product, index) => (
                                <Card className="pt-0 overflow-hidden border" key={product.name + index}>
                                    <CardHeader className="relative aspect-5/3 items-center justify-center">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                                            <div className="absolute inset-0 bg-background/30" />
                                        </div>
                                        <div className="absolute bottom-0 left-3 translate-y-1/2 flex flex-wrap gap-1 z-10">
                                            {product.tags?.map((tag) => (
                                                <Badge key={tag} className="text-xs bg-primary border-4 border-card text-card-foreground">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-4 pt-2">
                                        <CardTitle>{product.name}</CardTitle>
                                        <CardDescription className="flex justify-between">
                                            <span className="text-sm text-card-foreground">{product.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                                            <Badge className="text-xs text-card-foreground">{product.stok}</Badge>
                                        </CardDescription>
                                    </CardContent>
                                    <CardFooter className="flex justify-end">
                                        <Button size="sm" variant="outline" className="border-primary text-primary">
                                            <EditIcon className="size-3" />
                                            Update
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    )
}
