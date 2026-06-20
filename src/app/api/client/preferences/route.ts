import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parseQuestionnaireData,
  isQuestionnaireComplete,
  getPortionSizeServings,
  type QuestionnaireData,
} from "@/lib/client-questionnaire";

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
  const questionnaireData = parseQuestionnaireData(JSON.stringify(body));

  if (!isQuestionnaireComplete(questionnaireData)) {
    return NextResponse.json(
      { error: "Each household member must have a name, full cuisine ratings, and a spice level" },
      { status: 400 }
    );
  }

  const combinedAllergies = questionnaireData.household.flatMap((member) => {
    const all = [...member.allergies];
    if (member.otherAllergies) all.push(member.otherAllergies);
    return all;
  });

  const preferenceSummaryParts = questionnaireData.household.map((member) => {
    const topLikes = Object.entries(member.cuisineRatings)
      .filter(([, rating]) => rating >= 4)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 6);

    const personParts = [
      member.personName,
      `Portion size: ${member.portionSize} (${getPortionSizeServings(member.portionSize)} serving${getPortionSizeServings(member.portionSize) === 1 ? "" : "s"})`,
      topLikes.length > 0 ? `Favorite cuisines: ${topLikes.join(", ")}` : null,
      `Spice: ${SPICE_LABEL[member.spiceLevel] ?? member.spiceLevel}`,
      member.favoriteFoods ? `Favorite foods: ${member.favoriteFoods}` : null,
      member.avoidFoods ? `Will not eat: ${member.avoidFoods}` : null,
    ].filter(Boolean);

    return personParts.join(" | ");
  });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      allergies: combinedAllergies.length > 0 ? Array.from(new Set(combinedAllergies)).join(", ") : null,
      preferences: preferenceSummaryParts.join(" | ") || null,
      questionnaireData: JSON.stringify(questionnaireData satisfies QuestionnaireData),
    },
    select: { id: true },
  });

  return NextResponse.json({ success: true, userId: updated.id });
}
