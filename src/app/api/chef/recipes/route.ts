import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireChef() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CHEF") return null;
  return session;
}

// GET /api/chef/recipes
export async function GET() {
  const session = await requireChef();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipes = await prisma.recipe.findMany({
    include: { ingredients: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(recipes);
}

// POST /api/chef/recipes
export async function POST(req: NextRequest) {
  const session = await requireChef();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name,
    tags,
    cookbookName,
    recipeLink,
    pageNumber,
    prepTime,
    cookTime,
    servings,
    mealType,
    ingredients,
  } = body;

  if (!name || !mealType) {
    return NextResponse.json({ error: "Name and meal type are required" }, { status: 400 });
  }

  const recipe = await prisma.recipe.create({
    data: {
      name,
      description: null,
      tags: tags ?? null,
      cookbookName: cookbookName ?? null,
      recipeLink: recipeLink ?? null,
      pageNumber: pageNumber ?? null,
      prepTime: prepTime ?? null,
      cookTime: cookTime ?? null,
      servings: servings ?? null,
      mealType,
      ingredients: {
        create: (ingredients ?? []).map((i: { name: string; quantity?: string; unit?: string }) => ({
          name: i.name,
          quantity: i.quantity ?? null,
          unit: i.unit ?? null,
        })),
      },
    },
    include: { ingredients: true },
  });

  return NextResponse.json(recipe, { status: 201 });
}
