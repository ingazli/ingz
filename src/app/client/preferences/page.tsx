import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PreferencesQuestionnaireForm from "@/components/client/PreferencesQuestionnaireForm";
import { parseQuestionnaireData } from "@/lib/client-questionnaire";
export default async function ClientPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") redirect("/login");
  const resolvedSearchParams = await searchParams;

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
      {resolvedSearchParams.required === "1" && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Please complete the detailed questionnaire before requesting a menu!
        </p>
      )}
      <p className="text-sm text-gray-600 mb-8">
        Complete this once and update it anytime. Your chef will use these answers to tailor your weekly menus.
      </p>
      <PreferencesQuestionnaireForm initialData={initialData} />
    </div>
  );
}
