import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import ClientAddOnRequestsPanel from "@/components/chef/ClientAddOnRequestsPanel";
import { getPortionSizeServings } from "@/lib/client-questionnaire";
import DeleteClientButton from "@/components/chef/DeleteClientButton";

type QuestionnaireData = {
  household?: Array<{
    personName: string;
    portionSize: string;
    allergies: string[];
    otherAllergies: string;
    favoriteFoods: string;
    avoidFoods: string;
  }>;
  tryAnything?: boolean;
  cuisineRatings?: Record<string, number>;
  spiceLevel?: number;
  allergies?: string[];
  otherAllergies?: string;
  favoriteFoods?: string;
  avoidFoods?: string;
};

const SPICE_LABEL: Record<number, string> = {
  1: "No spice",
  2: "Mild",
  3: "Medium",
  4: "Hot",
  5: "Flaming",
};

function parseQuestionnaire(raw: string | null) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as QuestionnaireData;
    const household = Array.isArray(parsed.household)
      ? parsed.household.map((member, index) => ({
          name: member.personName?.trim() || `Person ${index + 1}`,
          portionSize: member.portionSize?.trim() || "Standard",
          portionServings: getPortionSizeServings(member.portionSize?.trim() || "Standard"),
          allergies: member.allergies ?? [],
          otherAllergies: member.otherAllergies?.trim() || "",
          favoriteFoods: member.favoriteFoods?.trim() || "",
          avoidFoods: member.avoidFoods?.trim() || "",
        }))
      : [];
    const ratings = parsed.cuisineRatings ?? {};
    const sortedCuisines = Object.entries(ratings)
      .sort((a, b) => b[1] - a[1])
      .map(([name, rating]) => ({ name, rating }));

    return {
      household,
      tryAnything: Boolean(parsed.tryAnything),
      spice: parsed.spiceLevel ? SPICE_LABEL[parsed.spiceLevel] ?? String(parsed.spiceLevel) : "Not set",
      topCuisines: sortedCuisines.slice(0, 5),
      allergies: parsed.allergies ?? [],
      otherAllergies: parsed.otherAllergies?.trim() || "",
      favoriteFoods: parsed.favoriteFoods?.trim() || "",
      avoidFoods: parsed.avoidFoods?.trim() || "",
    };
  } catch {
    return null;
  }
}

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
      addOnSelections: {
        where: { active: true },
        include: { recipe: true },
        orderBy: { updatedAt: "desc" },
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
  const questionnaire = parseQuestionnaire(client.questionnaireData);

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
            <div className="mt-3 flex justify-end gap-2">
              <DeleteClientButton clientId={client.id} clientName={client.name} />
            </div>
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

      {questionnaire && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-[#3b2a1a] mb-3">Questionnaire Summary</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {questionnaire.household && questionnaire.household.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Household</p>
                <div className="space-y-2">
                  {questionnaire.household.map((member) => (
                    <div key={member.name} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <p className="font-medium text-[#3b2a1a]">
                        {member.name} - {member.portionSize} ({member.portionServings} serving{member.portionServings === 1 ? "" : "s"})
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {member.allergies.length > 0 ? `Allergies: ${member.allergies.join(", ")}` : "Allergies: none listed"}
                        {member.otherAllergies ? ` | Other: ${member.otherAllergies}` : ""}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {member.favoriteFoods ? `Likes: ${member.favoriteFoods}` : "Likes: none listed"}
                        {member.avoidFoods ? ` | Avoids: ${member.avoidFoods}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Cuisine Mode</p>
              <p className="text-gray-700">
                {questionnaire.tryAnything ? "I will try anything" : "Custom cuisine preferences"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Spice Preference</p>
              <p className="text-gray-700">{questionnaire.spice}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Top Cuisines</p>
              {questionnaire.topCuisines.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {questionnaire.topCuisines.map((cuisine) => (
                    <span
                      key={cuisine.name}
                      className="text-xs bg-[#faf5ef] text-[#7c5c3a] border border-[#eadfce] px-2 py-1 rounded-full"
                    >
                      {cuisine.name} ({cuisine.rating}/5)
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No cuisines rated yet.</p>
              )}
            </div>
            {(questionnaire.allergies.length > 0 || questionnaire.otherAllergies) && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Questionnaire Allergies</p>
                <p className="text-gray-700">
                  {[...questionnaire.allergies, questionnaire.otherAllergies].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
            {questionnaire.favoriteFoods && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Favorite Foods</p>
                <p className="text-gray-700">{questionnaire.favoriteFoods}</p>
              </div>
            )}
            {questionnaire.avoidFoods && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Will Not Eat</p>
                <p className="text-gray-700">{questionnaire.avoidFoods}</p>
              </div>
            )}
          </div>
        </div>
      )}

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

      <ClientAddOnRequestsPanel
        initialRequests={client.addOnSelections.map((selection) => ({
          id: selection.id,
          recipeName: selection.recipe.name,
          addOnType: (selection.recipe as { addOnType?: string | null }).addOnType ?? "OTHER",
          requestedAt: selection.updatedAt.toISOString(),
        }))}
      />

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
