import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SPICE_LABEL: Record<number, string> = {
  1: "No spice",
  2: "Mild",
  3: "Medium",
  4: "Hot",
  5: "Flaming",
};

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const cuisineRatings = body.cuisineRatings as Record<string, number>;
  const spiceLevel = Number(body.spiceLevel);
  const allergies = Array.isArray(body.allergies)
    ? body.allergies.map((a: unknown) => String(a).trim()).filter(Boolean)
    : [];
  const otherAllergies = String(body.otherAllergies ?? "").trim();
  const favoriteFoods = String(body.favoriteFoods ?? "").trim();
  const avoidFoods = String(body.avoidFoods ?? "").trim();

  if (!cuisineRatings || typeof cuisineRatings !== "object") {
    return NextResponse.json({ error: "Cuisine ratings are required" }, { status: 400 });
  }

  if (!Number.isInteger(spiceLevel) || spiceLevel < 1 || spiceLevel > 5) {
    return NextResponse.json({ error: "Spice level must be between 1 and 5" }, { status: 400 });
  }

  const combinedAllergies = [...allergies];
  if (otherAllergies) combinedAllergies.push(otherAllergies);

  const topLikes = Object.entries(cuisineRatings)
    .filter(([, rating]) => rating >= 4)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 6);

  const preferenceSummaryParts = [
    topLikes.length > 0 ? `Favorite cuisines: ${topLikes.join(", ")}` : null,
    `Spice: ${SPICE_LABEL[spiceLevel] ?? spiceLevel}`,
    favoriteFoods ? `Favorite foods: ${favoriteFoods}` : null,
    avoidFoods ? `Will not eat: ${avoidFoods}` : null,
  ].filter(Boolean);

  const questionnaireData = {
    cuisineRatings,
    spiceLevel,
    allergies,
    otherAllergies,
    favoriteFoods,
    avoidFoods,
  };

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      allergies: combinedAllergies.length > 0 ? combinedAllergies.join(", ") : null,
      preferences: preferenceSummaryParts.join(" | ") || null,
      questionnaireData: JSON.stringify(questionnaireData),
    },
    select: { id: true },
  });

  return NextResponse.json({ success: true, userId: updated.id });
}
