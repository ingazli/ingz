import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PreferencesQuestionnaireForm from "@/components/client/PreferencesQuestionnaireForm";

type QuestionnaireData = {
  cuisineRatings: Record<string, number>;
  spiceLevel: number;
  allergies: string[];
  otherAllergies: string;
  favoriteFoods: string;
  avoidFoods: string;
};

const DEFAULT_QUESTIONNAIRE: QuestionnaireData = {
  cuisineRatings: {},
  spiceLevel: 0,
  allergies: [],
  otherAllergies: "",
  favoriteFoods: "",
  avoidFoods: "",
};

function parseQuestionnaireData(raw: string | null): QuestionnaireData {
  if (!raw) return DEFAULT_QUESTIONNAIRE;

  try {
    const parsed = JSON.parse(raw) as Partial<QuestionnaireData>;
    return {
      cuisineRatings: parsed.cuisineRatings ?? {},
      spiceLevel: parsed.spiceLevel ?? 0,
      allergies: parsed.allergies ?? [],
      otherAllergies: parsed.otherAllergies ?? "",
      favoriteFoods: parsed.favoriteFoods ?? "",
      avoidFoods: parsed.avoidFoods ?? "",
    };
  } catch {
    return DEFAULT_QUESTIONNAIRE;
  }
}

export default async function ClientPreferencesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      questionnaireData: true,
    },
  });

  const initialData = parseQuestionnaireData(user?.questionnaireData ?? null);

  return (
    <div>
      <h1 className="text-[#3b2a1a] mb-2">Preference Questionnaire</h1>
      <p className="text-sm text-gray-600 mb-8">
        Complete this once and update it anytime. Your chef will use these answers to tailor your weekly menus.
      </p>
      <PreferencesQuestionnaireForm initialData={initialData} />
    </div>
  );
}
