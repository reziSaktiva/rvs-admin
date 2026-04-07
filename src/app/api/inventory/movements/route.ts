import { NextResponse } from "next/server";
import { recordInventoryMovement, type RecordInventoryMovementInput } from "@/lib/inventory";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RecordInventoryMovementInput>;

    if (!body.itemId || !body.movementType || body.qtyDelta === undefined || !body.unitId) {
      return NextResponse.json(
        {
          success: false,
          message: "itemId, movementType, qtyDelta, and unitId are required",
        },
        { status: 400 }
      );
    }

    const result = await recordInventoryMovement({
      itemId: body.itemId,
      movementType: body.movementType,
      qtyDelta: Number(body.qtyDelta),
      unitId: body.unitId,
      unitCost: body.unitCost !== undefined ? Number(body.unitCost) : undefined,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      note: body.note,
      occurredAt: body.occurredAt,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to record inventory movement",
      },
      { status: 400 }
    );
  }
}
