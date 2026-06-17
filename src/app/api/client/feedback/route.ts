import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/client/feedback — create or update feedback for a menu item
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { menuItemId, recipeId, rating, comment, favorited } = body;

  if (!menuItemId || !recipeId || typeof rating !== "number") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  // Verify this menu item belongs to the client
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, menu: { clientId: session.user.id } },
  });
  if (!menuItem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const feedback = await prisma.mealFeedback.upsert({
    where: { menuItemId },
    create: {
      menuItemId,
      clientId: session.user.id,
      recipeId,
      rating,
      comment: comment || null,
      favorited: favorited ?? false,
    },
    update: {
      rating,
      comment: comment || null,
      favorited: favorited ?? false,
    },
  });

  return NextResponse.json(feedback);
}
