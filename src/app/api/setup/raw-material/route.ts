import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { costItemPrices, costItems } from "@/lib/db/drizzle/schema";
import { requireCurrentUserActiveCompanyContext } from "@/lib/company/active-company";

export async function POST(request: Request) {
  try {
    const activeContext = await requireCurrentUserActiveCompanyContext();
    const body = (await request.json()) as {
      name?: string;
      sku?: string | null;
      itemType?: "raw_material" | "packaging";
      unitId?: string;
      initialPrice?: number | null;
    };

    const name = String(body.name ?? "").trim();
    const sku = String(body.sku ?? "").trim();
    const unitId = String(body.unitId ?? "").trim();
    const itemType = body.itemType === "packaging" ? "packaging" : "raw_material";
    const initialPrice = Number(body.initialPrice);

    if (!name || !unitId) {
      return NextResponse.json(
        { success: false, message: "Nama bahan dan satuan wajib diisi." },
        { status: 400 }
      );
    }

    const existingByName = await db.query.costItems.findFirst({
      where: and(eq(costItems.companyId, activeContext.companyId), eq(costItems.name, name)),
      columns: { id: true },
    });
    if (existingByName) {
      return NextResponse.json({ success: false, message: "Nama bahan sudah ada." }, { status: 400 });
    }

    if (sku) {
      const existingBySku = await db.query.costItems.findFirst({
        where: and(eq(costItems.companyId, activeContext.companyId), eq(costItems.sku, sku)),
        columns: { id: true },
      });
      if (existingBySku) {
        return NextResponse.json({ success: false, message: "SKU bahan sudah digunakan." }, { status: 400 });
      }
    }

    const [created] = await db
      .insert(costItems)
      .values({
        companyId: activeContext.companyId,
        name,
        sku: sku || null,
        itemType,
        defaultUnitId: unitId,
        isActive: true,
      })
      .returning({
        id: costItems.id,
        name: costItems.name,
        itemType: costItems.itemType,
        defaultUnitId: costItems.defaultUnitId,
      });

    if (!created) {
      return NextResponse.json({ success: false, message: "Gagal menambahkan bahan." }, { status: 500 });
    }

    if (Number.isFinite(initialPrice) && initialPrice > 0) {
      await db.insert(costItemPrices).values({
        companyId: activeContext.companyId,
        itemId: created.id,
        unitId,
        pricePerUnit: String(initialPrice),
        sourceNote: "setup_operasional",
      });
    }

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menambahkan bahan baru",
      },
      { status: 400 }
    );
  }
}

