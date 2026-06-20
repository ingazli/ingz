import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAutoAllergyTags, mergeRecipeTags } from "@/lib/allergy-tags";

const ADD_ON_TYPES = new Set([
  "JAM",
  "PICKLE",
  "SAUCE",
  "SPREAD",
  "CONDIMENT",
  "FERMENT",
  "DRINK",
  "DESSERT_SNACK",
  "PANTRY_STAPLE",
  "OTHER",
]);

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
  try {
    const session = await requireChef();
    console.log("[api/chef/recipes/[id]] PUT called. session:", session?.user?.email ?? session?.user?.id ?? session ?? null);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    console.log("[api/chef/recipes/[id]] body:", JSON.stringify(body));

    const {
      name,
      category,
      addOnType,
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

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (category && category !== "MEAL_PLAN" && category !== "ADD_ON") {
      return NextResponse.json({ error: "Invalid recipe category" }, { status: 400 });
    }

    if ((category ?? "MEAL_PLAN") === "ADD_ON" && (!addOnType || !ADD_ON_TYPES.has(addOnType))) {
      return NextResponse.json({ error: "Valid add-on type is required for add-ons" }, { status: 400 });
    }

    if ((category ?? "MEAL_PLAN") === "MEAL_PLAN" && !mealType) {
      return NextResponse.json({ error: "Meal type is required for meal plan recipes" }, { status: 400 });
    }

    const autoTags = getAutoAllergyTags(Array.isArray(ingredients) ? ingredients : []);
    const mergedTags = mergeRecipeTags(tags, autoTags);

    // Replace ingredients: delete all existing, create new ones
    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        name,
        description: null,
        category: category ?? "MEAL_PLAN",
        addOnType: (category ?? "MEAL_PLAN") === "ADD_ON" ? addOnType : null,
        tags: mergedTags,
        cookbookName: cookbookName ?? null,
        recipeLink: recipeLink ?? null,
        pageNumber: pageNumber ?? null,
        prepTime: prepTime ?? null,
        cookTime: cookTime ?? null,
        servings: servings ?? null,
        mealType: (category ?? "MEAL_PLAN") === "ADD_ON" ? "SNACK" : mealType,
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
  } catch (err: any) {
    console.error("[api/chef/recipes/[id]] PUT error:", err);
    const payload: any = { error: "Server error" };
    if (process.env.NODE_ENV !== "production") {
      payload.detail = err?.message;
      payload.stack = err?.stack;
    }
    return NextResponse.json(payload, { status: 500 });
  }
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
