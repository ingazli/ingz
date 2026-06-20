import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format, endOfWeek } from "date-fns";
import QuoteMakerPanel from "@/components/chef/QuoteMakerPanel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ChefMenusPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CHEF") {
    redirect("/login");
  }

  const [menus, clientsRaw, quotes, recipeCatalogRaw, ingredientPrices] = await Promise.all([
    prisma.weeklyMenu.findMany({
      include: {
        client: true,
        items: {
          include: { recipe: true },
        },
      },
      orderBy: { weekStart: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.clientQuote.findMany({
      where: { chefId: session.user.id },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.recipe.findMany({
      where: { category: "MEAL_PLAN" },
      select: {
        id: true,
        name: true,
        servings: true,
        ingredients: {
          select: {
            name: true,
            quantity: true,
            unit: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.chefIngredientPrice.findMany({
      where: { chefId: session.user.id },
      select: {
        ingredientKey: true,
        ingredientName: true,
        packagePrice: true,
        packageAmount: true,
        packageUnit: true,
      },
    }),
  ]);

  const clients = clientsRaw.map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
  }));

  const recipeCatalog = recipeCatalogRaw.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    baseServings: recipe.servings ?? 1,
    ingredientRequirements: recipe.ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
    })),
  }));

  const quoteItems = quotes.map((quote) => ({
    id: quote.id,
    client: quote.client,
    mealsCount: quote.mealsCount,
    groceryCost: quote.groceryCost,
    laborHours: quote.laborHours,
    laborRate: quote.laborRate,
    profitPercent: quote.profitPercent,
    breakEvenCost: quote.breakEvenCost,
    totalQuote: quote.totalQuote,
    costPerMeal: quote.costPerMeal,
    quotePerMeal: quote.quotePerMeal,
    note: quote.note,
    createdAt: quote.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#3b2a1a]">Weekly Menus</h1>
          <p className="text-gray-500 text-sm">{menus.length} menus created</p>
        </div>
        <Link
          href="/chef/menus/new"
          className="bg-[#3b2a1a] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#2e1f0f] transition-colors text-sm"
        >
          + Generate Menu
        </Link>
      </div>

      {menus.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-5xl mb-4">🗓</div>
          <p className="text-gray-600">No menus yet. Generate your first menu!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {menus.map((menu) => {
            const weekStart = new Date(menu.weekStart);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const pending = menu.items.filter((i) => i.approved === null).length;
            const approved = menu.items.filter((i) => i.approved === true).length;
            const declined = menu.items.filter((i) => i.approved === false).length;

            return (
              <div
                key={menu.id}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-[#3b2a1a]">
                      {menu.title || `Week of ${format(weekStart, "MMM d, yyyy")}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")} &middot; {menu.client.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0 text-sm">
                    <p className="text-gray-600">{menu.items.length} dishes</p>
                    <div className="flex gap-2 mt-1 justify-end text-xs">
                      {approved > 0 && <span className="text-green-600">✓ {approved}</span>}
                      {declined > 0 && <span className="text-red-600">✗ {declined}</span>}
                      {pending > 0 && <span className="text-amber-600">? {pending}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {menu.items.slice(0, 6).map((item) => (
                    <span
                      key={item.id}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.approved === true
                          ? "bg-green-50 text-green-700"
                          : item.approved === false
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.recipe.name}
                    </span>
                  ))}
                  {menu.items.length > 6 && (
                    <span className="text-xs text-gray-400">+{menu.items.length - 6} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[#3b2a1a] mb-1">Client Quotes</h2>
          <p className="text-gray-500 text-sm">
            Calculate break-even and profit-based pricing while generating menus.
          </p>
        </div>

        <QuoteMakerPanel
          clients={clients}
          initialQuotes={quoteItems}
          recipeCatalog={recipeCatalog}
          initialIngredientPrices={ingredientPrices.map((row) => ({
            ingredientKey: row.ingredientKey,
            ingredientName: row.ingredientName,
            packagePrice: row.packagePrice,
            packageAmount: row.packageAmount,
            packageUnit: row.packageUnit,
          }))}
        />
      </section>
    </div>
  );
}
