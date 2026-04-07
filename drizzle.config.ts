import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/lib/db/drizzle/schema.ts",
    out: "./src/lib/db/drizzle",
    schemaFilter: ["public"],
    tablesFilter: [
        "roles",
        "profiles",
        "categories",
        "keywords",
        "products",
        "product_variants",
        "product_keywords",
        "units",
        "unit_conversions",
        "cost_items",
        "cost_item_prices",
        "recipes",
        "recipe_materials",
        "recipe_costs",
        "cost_item_inventory_balances",
        "cost_item_inventory_movements",
    ],
    dbCredentials: {
        url: process.env.NEXT_DATABASE_URL!,
    },
});