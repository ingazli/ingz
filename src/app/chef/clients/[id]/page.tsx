import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export default async function ChefClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.user.findFirst({
    where: { id, role: "CLIENT" },
    include: {
      weeklyMenus: {
        include: {
          items: {
            include: {
              recipe: true,
              feedback: true,
            },
          },
        },
        orderBy: { weekStart: "desc" },
      },
      mealFeedbacks: {
        include: { recipe: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) notFound();

  const allFeedbacks = client.mealFeedbacks;
  const avgRating = allFeedbacks.length
    ? (allFeedbacks.reduce((s, f) => s + f.rating, 0) / allFeedbacks.length).toFixed(1)
    : null;
  const favorites = allFeedbacks.filter((f) => f.favorited).map((f) => f.recipe.name);
  const lowRated = allFeedbacks.filter((f) => f.rating <= 2).map((f) => f.recipe.name);

  return (
    <div>
      {/* Client Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#3b2a1a]">{client.name}</h1>
            <p className="text-gray-500 text-sm">{client.email}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            {avgRating && <p className="text-amber-600 font-medium">★ {avgRating} avg rating</p>}
            <p>Since {format(new Date(client.createdAt), "MMM yyyy")}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Food Allergies</p>
            {client.allergies ? (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {client.allergies}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">None recorded</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Preferences</p>
            {client.preferences ? (
              <p className="text-sm text-[#3b2a1a] bg-[#faf5ef] border border-[#e8ddd0] rounded-lg px-3 py-2">
                {client.preferences}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">None recorded</p>
            )}
          </div>
          {client.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Chef Notes</p>
              <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                {client.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Favorites & Avoid */}
      {(favorites.length > 0 || lowRated.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {favorites.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-[#3b2a1a] mb-3">♥ Favorite Meals</h2>
              <div className="flex flex-wrap gap-2">
                {favorites.map((name) => (
                  <span key={name} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {lowRated.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-[#3b2a1a] mb-3">⚠ Low-Rated Meals</h2>
              <div className="flex flex-wrap gap-2">
                {lowRated.map((name) => (
                  <span key={name} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Menu History */}
      <div>
        <h2 className="text-lg font-semibold text-[#3b2a1a] mb-4">Menu History</h2>
        {client.weeklyMenus.length === 0 ? (
          <p className="text-gray-400 text-sm">No menus yet.</p>
        ) : (
          <div className="space-y-4">
            {client.weeklyMenus.map((menu) => (
              <div key={menu.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-medium text-[#3b2a1a] mb-3">
                  {menu.title || `Week of ${format(new Date(menu.weekStart), "MMM d, yyyy")}`}
                </h3>
                <div className="grid gap-2">
                  {menu.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            item.approved === true
                              ? "bg-green-400"
                              : item.approved === false
                              ? "bg-red-400"
                              : "bg-gray-300"
                          }`}
                        />
                        <span className="text-gray-700">{item.recipe.name}</span>
                        {item.clientNote && (
                          <span className="text-xs text-[#7c5c3a] italic">
                            — &ldquo;{item.clientNote}&rdquo;
                          </span>
                        )}
                      </div>
                      {item.feedback && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-amber-400 text-xs">{"★".repeat(item.feedback.rating)}</span>
                          {item.feedback.favorited && <span className="text-red-400 text-xs">♥</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
