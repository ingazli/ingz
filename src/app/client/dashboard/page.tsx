import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format, startOfWeek, endOfWeek } from "date-fns";
import MenuRequestCard from "@/components/client/MenuRequestCard";
import { isQuestionnaireCompleteRaw } from "@/lib/client-questionnaire";

const ADD_ON_TYPE_LABEL: Record<string, string> = {
  JAM: "Jam",
  PICKLE: "Pickle",
  SAUCE: "Sauce",
  SPREAD: "Spread",
  CONDIMENT: "Condiment",
  FERMENT: "Ferment",
  DRINK: "Drink",
  DESSERT_SNACK: "Dessert / Snack",
  PANTRY_STAPLE: "Pantry Staple",
  OTHER: "Other",
};

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { questionnaireData: true },
  });

  if (!isQuestionnaireCompleteRaw(user?.questionnaireData ?? null)) {
    redirect("/client/preferences?required=1");
  }

  const [menus, preparedNotices] = await Promise.all([
    prisma.weeklyMenu.findMany({
      where: { clientId: session.user.id },
      orderBy: { weekStart: "desc" },
      include: { items: { include: { recipe: true } } },
    }),
    prisma.clientAddOnSelection.findMany({
      where: {
        clientId: session.user.id,
        active: false,
        preparedAt: { not: null },
      },
      include: {
        recipe: { select: { id: true, name: true, addOnType: true } },
      },
      orderBy: { preparedAt: "desc" },
      take: 10,
    }),
  ]);

  const now = new Date();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#3b2a1a] mb-1">
        Welcome back, {session!.user.name.split(" ")[0]}!
      </h1>
      <p className="text-gray-500 text-sm mb-8">Here are all your weekly menus.</p>

      {preparedNotices.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <p className="font-playfair text-base font-semibold text-emerald-800">Prepared Add-On Updates</p>
          <div className="mt-2 space-y-2">
            {preparedNotices.map((notice) => (
              <div key={notice.id} className="bg-white border border-emerald-100 rounded-lg px-3 py-2">
                <p className="text-sm text-emerald-900 font-medium">{notice.recipe.name}</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {ADD_ON_TYPE_LABEL[(notice.recipe as { addOnType?: string | null }).addOnType ?? "OTHER"]}
                </p>
                <p className="text-xs text-emerald-700 mt-1">{notice.preparedMessage ?? "Prepared!"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {menus.length === 0 ? (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <div className="text-5xl mb-4">🍽</div>
            <p className="text-gray-600">Your chef hasn&apos;t created a menu for you yet.</p>
            <p className="text-gray-400 text-sm mt-1">You can send a request with your preferences below.</p>
          </div>
          <MenuRequestCard />
        </div>
      ) : (
        <div className="grid gap-4">
          {menus.map((menu) => {
            const weekStart = new Date(menu.weekStart);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const isCurrentWeek = now >= startOfWeek(weekStart, { weekStartsOn: 1 }) && now <= weekEnd;
            const pending = menu.items.filter((i) => i.approved === null).length;
            const approved = menu.items.filter((i) => i.approved === true).length;
            const declined = menu.items.filter((i) => i.approved === false).length;

            return (
              <Link
                key={menu.id}
                href={`/client/menu/${menu.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-[#c9a97a] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="font-semibold text-[#3b2a1a]">
                        {menu.title || `Week of ${format(weekStart, "MMM d, yyyy")}`}
                      </h2>
                      {isCurrentWeek && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          This Week
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-gray-600">{menu.items.length} dishes</p>
                    {pending > 0 ? (
                      <span className="text-xs text-amber-600 font-medium">
                        {pending} awaiting response
                      </span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">All responded</span>
                    )}
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex gap-3 mt-4">
                  {approved > 0 && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                      ✓ {approved} approved
                    </span>
                  )}
                  {declined > 0 && (
                    <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                      ✗ {declined} declined
                    </span>
                  )}
                  {pending > 0 && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                      ? {pending} pending
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
