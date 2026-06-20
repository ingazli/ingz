import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AddOnBrowser from "@/components/client/AddOnBrowser";
import { isQuestionnaireCompleteRaw } from "@/lib/client-questionnaire";

export default async function ClientAddOnsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { questionnaireData: true },
  });

  if (!isQuestionnaireCompleteRaw(user?.questionnaireData ?? null)) {
    redirect("/client/preferences?required=1");
  }

  const addOns = await prisma.recipe.findMany({
    where: { category: "ADD_ON" },
    include: {
      addOnSelections: {
        where: { clientId: session.user.id },
        select: { active: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const initialItems = addOns.map((item) => ({
    id: item.id,
    name: item.name,
    tags: item.tags,
    addOnType: (item as { addOnType?: string | null }).addOnType ?? "OTHER",
    selected: item.addOnSelections[0]?.active ?? false,
  }));

  return <AddOnBrowser initialItems={initialItems} />;
}
