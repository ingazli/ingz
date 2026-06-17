import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireChef() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CHEF") return null;
  return session;
}

// PUT /api/chef/recipes/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireChef();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
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

  // Replace ingredients: delete all existing, create new ones
  const recipe = await prisma.recipe.update({
    where: { id },
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
        deleteMany: {},
        create: (ingredients ?? []).map((i: { name: string; quantity?: string; unit?: string }) => ({
          name: i.name,
          quantity: i.quantity ?? null,
          unit: i.unit ?? null,
        })),
      },
    },
    include: { ingredients: true },
  });

  return NextResponse.json(recipe);
}

// DELETE /api/chef/recipes/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireChef();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
