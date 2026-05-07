import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createProductVariantAndRecipeAction,
  createRecipeWithExistingVariantAction,
  createVariantAndRecipeForExistingProductAction,
} from "../../actions";
import type { ResepProduksiPageData } from "../../data";
import type { RecipeStatus } from "../view-model";

type CreateRecipeDrawerProps = {
  selectedStatus?: RecipeStatus;
  availableUnits: ResepProduksiPageData["availableUnits"];
  categories: ResepProduksiPageData["categories"];
  products: ResepProduksiPageData["products"];
  allVariants: ResepProduksiPageData["allVariants"];
};

export function CreateRecipeDrawer({
  selectedStatus,
  availableUnits,
  categories,
  products,
  allVariants,
}: CreateRecipeDrawerProps) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button>Tambah resep</Button>
      </DrawerTrigger>
      <DrawerContent className="h-dvh max-h-dvh overflow-hidden data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-2xl">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>Tambah resep baru</DrawerTitle>
          <DrawerDescription>
            Buat resep sekaligus isi nama resep dari varian yang sudah ada atau sambil membuat data produk/varian
            baru.
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <Tabs defaultValue="existing-variant" className="space-y-3">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-1 md:grid-cols-3">
              <TabsTrigger value="existing-variant">Varian sudah ada</TabsTrigger>
              <TabsTrigger value="existing-product">Produk ada, varian baru</TabsTrigger>
              <TabsTrigger value="new-product">Produk + varian baru</TabsTrigger>
            </TabsList>

            <TabsContent value="existing-variant">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pakai varian yang sudah ada</CardTitle>
                  <CardDescription>
                    Pilih varian lalu isi nama resep, hasil per batch, dan satuan hasil.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={createRecipeWithExistingVariantAction} className="space-y-3">
                    <input type="hidden" name="status" value={selectedStatus ?? ""} />
                    <Field>
                      <FieldLabel htmlFor="create-existing-variant">Varian produk</FieldLabel>
                      <Select name="productVariantId" required>
                        <SelectTrigger id="create-existing-variant" className="w-full">
                          <SelectValue placeholder="Pilih varian produk" />
                        </SelectTrigger>
                        <SelectContent>
                          {allVariants.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {variant.product.name} {variant.size ? `- ${variant.size}` : ""}{" "}
                              {variant.sku ? `(${variant.sku})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-existing-name">Nama resep</FieldLabel>
                      <Input id="create-existing-name" name="name" placeholder="Contoh: Resep Regular" required />
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field>
                        <FieldLabel htmlFor="create-existing-output-qty">Hasil per batch</FieldLabel>
                        <Input
                          id="create-existing-output-qty"
                          name="outputQty"
                          type="number"
                          min="0.0001"
                          step="1"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="create-existing-output-unit">Satuan hasil</FieldLabel>
                        <Select name="outputUnitId" required>
                          <SelectTrigger id="create-existing-output-unit" className="w-full">
                            <SelectValue placeholder="Satuan hasil" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="create-existing-loss">Susut (%)</FieldLabel>
                      <Input id="create-existing-loss" name="lossPercent" type="number" min="0" max="100" step="0.01" />
                    </Field>
                    <Button type="submit" className="w-full">
                      Buat resep
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="existing-product">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Produk sudah ada, buat varian baru</CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={createVariantAndRecipeForExistingProductAction} className="space-y-3">
                    <input type="hidden" name="status" value={selectedStatus ?? ""} />
                    <Select name="productId" required>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih produk" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((productItem) => (
                          <SelectItem key={productItem.id} value={productItem.id}>
                            {productItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <Input name="variantSize" placeholder="Ukuran varian" />
                      <Input name="variantSku" placeholder="SKU varian" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input name="variantBarcode" placeholder="Barcode" />
                      <Input name="variantPrice" type="number" min="0" step="100" placeholder="Harga jual" required />
                    </div>
                    <Input name="variantStock" type="number" min="0" step="1" placeholder="Stok awal" />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox name="variantIsActive" defaultChecked />
                      Varian aktif
                    </label>
                    <Input name="name" placeholder="Nama resep" required />
                    <div className="grid grid-cols-2 gap-2">
                      <Input name="outputQty" type="number" min="0.0001" step="0.01" placeholder="Hasil per batch" required />
                      <Select name="outputUnitId" required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Satuan hasil" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input name="lossPercent" type="number" min="0" max="100" step="0.01" placeholder="Susut (%)" />
                    <Button type="submit" className="w-full" variant="secondary">
                      Buat varian + resep
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="new-product">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Produk baru + varian + resep</CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={createProductVariantAndRecipeAction} className="space-y-3">
                    <input type="hidden" name="status" value={selectedStatus ?? ""} />
                    <Input name="productName" placeholder="Nama produk" required />
                    <Input name="productDescription" placeholder="Deskripsi produk (opsional)" />
                    <Select name="categoryId" defaultValue="__none">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Tanpa kategori</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox name="productIsActive" defaultChecked />
                      Produk aktif
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input name="variantSize" placeholder="Ukuran varian" />
                      <Input name="variantSku" placeholder="SKU varian" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input name="variantBarcode" placeholder="Barcode" />
                      <Input name="variantPrice" type="number" min="0" step="100" placeholder="Harga jual" required />
                    </div>
                    <Input name="variantStock" type="number" min="0" step="1" placeholder="Stok awal" />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox name="variantIsActive" defaultChecked />
                      Varian aktif
                    </label>
                    <Input name="name" placeholder="Nama resep" required />
                    <div className="grid grid-cols-2 gap-2">
                      <Input name="outputQty" type="number" min="0.0001" step="0.0001" placeholder="Hasil per batch" required />
                      <Select name="outputUnitId" required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Satuan hasil" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input name="lossPercent" type="number" min="0" max="100" step="0.01" placeholder="Susut (%)" />
                    <Button type="submit" className="w-full" variant="secondary">
                      Buat produk + varian + resep
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <DrawerFooter className="shrink-0 border-t">
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Tutup
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
