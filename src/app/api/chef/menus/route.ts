import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireChef() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CHEF") return null;
  return session;
}

// POST /api/chef/menus — create a weekly menu
export async function POST(req: NextRequest) {
  const session = await requireChef();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { clientId, weekStart, title, items } = body;

  if (!clientId || !weekStart || !Array.isArray(items)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const recipeIds = items.map((item: { recipeId: string }) => item.recipeId).filter(Boolean);
  if (recipeIds.length > 0) {
    const invalidRecipes = await prisma.recipe.findMany({
      where: {
        id: { in: recipeIds },
        category: "ADD_ON",
      },
      select: { id: true, name: true },
    });

    if (invalidRecipes.length > 0) {
      return NextResponse.json(
        {
          error: "Add-on items cannot be included in weekly meal plans.",
          invalidRecipes,
        },
        { status: 400 }
      );
    }
  }

  // Verify the client exists
  const client = await prisma.user.findFirst({ where: { id: clientId, role: "CLIENT" } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const menu = await prisma.weeklyMenu.create({
    data: {
      clientId,
      weekStart: new Date(weekStart),
      title: title ?? null,
      items: {
        create: items.map((item: { dayOfWeek: number; mealType: string; recipeId: string }) => ({
          dayOfWeek: item.dayOfWeek,
          mealType: item.mealType as
            | "BREAKFAST"
            | "LUNCH"
            | "DINNER"
            | "SNACK"
            | "SIDE_DISH"
            | "DESSERT"
            | "DRINK_ALCOHOLIC"
            | "DRINK_NON_ALCOHOLIC",
          recipe: { connect: { id: item.recipeId } },
        })),
      },
    },
    include: { items: { include: { recipe: true } } },
  });

  return NextResponse.json(menu, { status: 201 });
}
