import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MealFeedbackCard from "@/components/client/MealFeedbackCard";
import { redirect } from "next/navigation";
import { isQuestionnaireCompleteRaw } from "@/lib/client-questionnaire";

export default async function ClientMealsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { questionnaireData: true },
  });

  if (!isQuestionnaireCompleteRaw(user?.questionnaireData ?? null)) {
    redirect("/client/preferences?required=1");
  }

  const items = await prisma.menuItem.findMany({
    where: {
      menu: { clientId: session.user.id },
      approved: true,
    },
    include: {
      recipe: true,
      feedback: true,
      menu: true,
    },
    orderBy: { menu: { weekStart: "desc" } },
  });

  const favorites = items.filter((i) => i.feedback?.favorited);
  const ratedItems = items.filter((i) => i.feedback);
  const pendingFeedback = items.filter((i) => !i.feedback);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#3b2a1a] mb-1">My Meals</h1>
      <p className="text-gray-500 text-sm mb-8">
        Rate your meals, leave comments, and heart your favorites.
      </p>

      {/* Favorites section */}
      {favorites.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-[#3b2a1a] mb-4">♥ My Favorites</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((item) => (
              <MealFeedbackCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Pending feedback */}
      {pendingFeedback.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-[#3b2a1a] mb-4">
            Meals Awaiting Your Feedback
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pendingFeedback.map((item) => (
              <MealFeedbackCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* All rated meals */}
      {ratedItems.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#3b2a1a] mb-4">All Rated Meals</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ratedItems.map((item) => (
              <MealFeedbackCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-5xl mb-4">🍽</div>
          <p className="text-gray-600">No approved meals yet. Check your weekly menus!</p>
        </div>
      )}
    </div>
  );
}
