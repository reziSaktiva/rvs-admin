import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql", // Tentukan dialek database
    schema: "./src/lib/db/schema.ts", // Tempat skema hasil pull akan disimpan
    out: "./src/lib/db/drizzle", // Folder untuk file migrasi/meta
    dbCredentials: {
        url: process.env.NEXT_DATABASE_URL!, // URL koneksi Supabase Anda
    },
});