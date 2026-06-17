import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format, startOfWeek, endOfWeek } from "date-fns";

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);
  const menus = await prisma.weeklyMenu.findMany({
    where: { clientId: session!.user.id },
    orderBy: { weekStart: "desc" },
    include: { items: { include: { recipe: true } } },
  });

  const now = new Date();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#3b2a1a] mb-1">
        Welcome back, {session!.user.name.split(" ")[0]}!
      </h1>
      <p className="text-gray-500 text-sm mb-8">Here are all your weekly menus.</p>

      {menus.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-5xl mb-4">🍽</div>
          <p className="text-gray-600">Your chef hasn&apos;t created a menu for you yet.</p>
          <p className="text-gray-400 text-sm mt-1">Check back soon!</p>
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
