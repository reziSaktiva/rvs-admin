import { NextResponse } from "next/server";
import { getRawMaterialAssetSummary } from "@/lib/inventory";

export async function GET() {
  try {
    const result = await getRawMaterialAssetSummary();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch raw material asset summary",
      },
      { status: 500 }
    );
  }
}
