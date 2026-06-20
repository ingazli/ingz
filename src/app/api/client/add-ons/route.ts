import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireClient() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENT") return null;
  return session;
}

// GET /api/client/add-ons
export async function GET() {
  const session = await requireClient();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addOns = await prisma.recipe.findMany({
    where: { category: "ADD_ON" },
    select: {
      id: true,
      name: true,
      tags: true,
      addOnType: true,
      addOnSelections: {
        where: { clientId: session.user.id },
        select: { active: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    addOns.map((item) => ({
      id: item.id,
      name: item.name,
      tags: item.tags,
      addOnType: item.addOnType ?? "OTHER",
      selected: item.addOnSelections[0]?.active ?? false,
    }))
  );
}

// PATCH /api/client/add-ons
export async function PATCH(req: NextRequest) {
  const session = await requireClient();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const recipeId = String(body.recipeId ?? "").trim();
  const selected = Boolean(body.selected);

  if (!recipeId) {
    return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, category: true },
  });

  if (!recipe || recipe.category !== "ADD_ON") {
    return NextResponse.json({ error: "Add-on item not found" }, { status: 404 });
  }

  await prisma.clientAddOnSelection.upsert({
    where: {
      clientId_recipeId: {
        clientId: session.user.id,
        recipeId,
      },
    },
    create: {
      clientId: session.user.id,
      recipeId,
      active: selected,
      preparedMessage: null,
      preparedAt: null,
    },
    update: {
      active: selected,
      preparedMessage: selected ? null : undefined,
      preparedAt: selected ? null : undefined,
    },
  });

  return NextResponse.json({ success: true, recipeId, selected });
}
