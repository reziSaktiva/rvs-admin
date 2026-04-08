import { NextResponse } from "next/server";
import { postProductionRun } from "@/lib/production";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      recipeId?: string;
      batchCount?: number;
      note?: string;
    };

    const recipeId = String(body.recipeId ?? "").trim();
    const batchCount = Number(body.batchCount);
    if (!recipeId || !Number.isFinite(batchCount) || batchCount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "recipeId and batchCount > 0 are required",
        },
        { status: 400 }
      );
    }

    const result = await postProductionRun({
      recipeId,
      batchCount,
      note: body.note,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to post production",
      },
      { status: 400 }
    );
  }
}
