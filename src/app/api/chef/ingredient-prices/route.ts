import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireChef() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CHEF") return null;
  return session;
}

function normalizeIngredientKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

// GET /api/chef/ingredient-prices
export async function GET() {
  try {
    const session = await requireChef();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prices = await prisma.chefIngredientPrice.findMany({
      where: { chefId: session.user.id },
      orderBy: { ingredientName: "asc" },
    });

    return NextResponse.json(prices);
  } catch (error) {
    console.error("Error in ingredient-prices GET:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch ingredient prices", details: message },
      { status: 500 }
    );
  }
}

// PUT /api/chef/ingredient-prices
export async function PUT(req: NextRequest) {
  try {
    const session = await requireChef();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const items = Array.isArray(body?.items) ? body.items : [];

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items must be an array" }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "No items provided", success: false }, { status: 400 });
    }

    const validItems = items
      .map((item: unknown) => {
        const row = item as Record<string, unknown>;
        const ingredientKey = normalizeIngredientKey(String(row.ingredientKey ?? ""));
        const ingredientName = String(row.ingredientName ?? "").trim();
        const packageUnit = String(row.packageUnit ?? "").trim();
        const packagePrice = Number(row.packagePrice);
        const packageAmount = Number(row.packageAmount);

        if (!ingredientKey || !ingredientName || !packageUnit) return null;
        if (!Number.isFinite(packagePrice) || packagePrice < 0) return null;
        if (!Number.isFinite(packageAmount) || packageAmount <= 0) return null;

        return {
          ingredientKey,
          ingredientName,
          packageUnit,
          packagePrice,
          packageAmount,
        };
      })
      .filter(Boolean) as Array<{
      ingredientKey: string;
      ingredientName: string;
      packageUnit: string;
      packagePrice: number;
      packageAmount: number;
    }>;

    if (validItems.length === 0) {
      return NextResponse.json({ error: "No valid items to save", success: false }, { status: 400 });
    }

    const UPSERT_CHUNK_SIZE = 25;
    for (let i = 0; i < validItems.length; i += UPSERT_CHUNK_SIZE) {
      const chunk = validItems.slice(i, i + UPSERT_CHUNK_SIZE);
      await Promise.all(
        chunk.map((item) =>
          prisma.chefIngredientPrice.upsert({
            where: {
              chefId_ingredientKey: {
                chefId: session.user.id,
                ingredientKey: item.ingredientKey,
              },
            },
            create: {
              chefId: session.user.id,
              ingredientKey: item.ingredientKey,
              ingredientName: item.ingredientName,
              packagePrice: item.packagePrice,
              packageAmount: item.packageAmount,
              packageUnit: item.packageUnit,
            },
            update: {
              ingredientName: item.ingredientName,
              packagePrice: item.packagePrice,
              packageAmount: item.packageAmount,
              packageUnit: item.packageUnit,
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true, saved: validItems.length });
  } catch (error) {
    console.error("Error in ingredient-prices PUT:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to save ingredient prices", details: message, success: false },
      { status: 500 }
    );
  }
}
