import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format, endOfWeek } from "date-fns";
import MenuItemResponseCard from "@/components/client/MenuItemResponseCard";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function ClientMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const menu = await prisma.weeklyMenu.findFirst({
    where: { id, clientId: session!.user.id },
    include: {
      items: {
        include: {
          recipe: { include: { ingredients: true } },
          feedback: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
      },
    },
  });

  if (!menu) notFound();

  const weekStart = new Date(menu.weekStart);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  // Group items by dayOfWeek
  const byDay: Record<number, typeof menu.items> = {};
  for (const item of menu.items) {
    if (!byDay[item.dayOfWeek]) byDay[item.dayOfWeek] = [];
    byDay[item.dayOfWeek].push(item);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#3b2a1a]">
          {menu.title || `Week of ${format(weekStart, "MMMM d, yyyy")}`}
        </h1>
        <p className="text-gray-500 text-sm">
          {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Review each dish below. Let your chef know what you approve, decline, or want modified.
        </p>
      </div>

      <div className="space-y-10">
        {Object.entries(byDay).map(([day, items]) => (
          <div key={day}>
            <h2 className="text-lg font-semibold text-[#3b2a1a] border-b border-gray-200 pb-2 mb-4">
              {DAY_NAMES[parseInt(day)]}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <MenuItemResponseCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
