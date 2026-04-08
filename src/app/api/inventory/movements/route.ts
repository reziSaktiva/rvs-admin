import { NextResponse } from "next/server";
import {
  getInventoryMovementHistory,
  INVENTORY_MOVEMENT_TYPES,
  recordInventoryMovement,
  type RecordInventoryMovementInput,
  type StockMovementType,
} from "@/lib/inventory";

const isStockMovementType = (value: string): value is StockMovementType =>
  INVENTORY_MOVEMENT_TYPES.includes(value as StockMovementType);

const INCOMING_TYPES = new Set<StockMovementType>([
  "opening",
  "purchase",
  "production_in",
  "adjustment_in",
  "return_in",
  "transfer_in",
]);

const REQUIRED_UNIT_COST_TYPES = new Set<StockMovementType>(["opening", "purchase"]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const movementTypeParam = searchParams.get("movementType");
    const movementType =
      movementTypeParam && isStockMovementType(movementTypeParam)
        ? movementTypeParam
        : undefined;

    const limitParam = Number(searchParams.get("limit"));
    const offsetParam = Number(searchParams.get("offset"));
    const result = await getInventoryMovementHistory({
      itemId: searchParams.get("itemId") ?? undefined,
      movementType,
      referenceKeyword: searchParams.get("referenceKeyword") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 100,
      offset: Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0,
    });

    const format = searchParams.get("format");
    if (format === "csv") {
      const csvHeader = [
        "occurredAt",
        "itemName",
        "movementType",
        "qtyDelta",
        "unitCode",
        "unitCost",
        "valueDelta",
        "referenceType",
        "referenceId",
        "note",
      ];
      const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
      const csvRows = result.map((row) =>
        [
          row.occurredAt ?? "",
          row.item.name,
          row.movementType,
          String(row.qtyDelta),
          row.unit.code,
          row.unitCost === null ? "" : String(row.unitCost),
          row.valueDelta === null ? "" : String(row.valueDelta),
          row.referenceType ?? "",
          row.referenceId ?? "",
          row.note ?? "",
        ]
          .map((cell) => escapeCsv(cell))
          .join(",")
      );

      return new Response([csvHeader.join(","), ...csvRows].join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="inventory-movements.csv"',
        },
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch movement history",
      },
      { status: 400 }
    );
  }
}

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
    if (!isStockMovementType(body.movementType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid movementType",
        },
        { status: 400 }
      );
    }

    const qtyDelta = Number(body.qtyDelta);
    if (!Number.isFinite(qtyDelta) || qtyDelta === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "qtyDelta must be a non-zero number",
        },
        { status: 400 }
      );
    }

    const isIncoming = INCOMING_TYPES.has(body.movementType);
    if ((isIncoming && qtyDelta < 0) || (!isIncoming && qtyDelta > 0)) {
      return NextResponse.json(
        {
          success: false,
          message: isIncoming
            ? "Incoming movement must use positive qtyDelta"
            : "Outgoing movement must use negative qtyDelta",
        },
        { status: 400 }
      );
    }

    if (REQUIRED_UNIT_COST_TYPES.has(body.movementType)) {
      const unitCost = Number(body.unitCost);
      if (!Number.isFinite(unitCost) || unitCost <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "unitCost is required and must be > 0 for opening/purchase",
          },
          { status: 400 }
        );
      }
    }

    const result = await recordInventoryMovement({
      itemId: body.itemId,
      movementType: body.movementType,
      qtyDelta,
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
