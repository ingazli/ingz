import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ChefDashboardPage() {
  const [clientCount, recipeCount, menuCount, recentFeedbacks, addOnRequests] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.recipe.count(),
    prisma.weeklyMenu.count(),
    prisma.mealFeedback.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: true, recipe: true },
    }),
    prisma.clientAddOnSelection.findMany({
      where: { active: true },
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        recipe: { select: { name: true, addOnType: true } },
      },
    }),
  ]);

  const avgRating = await prisma.mealFeedback.aggregate({ _avg: { rating: true } });
  const pendingResponses = await prisma.menuItem.count({ where: { approved: null } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#3b2a1a] mb-1">Chef Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">Overview of your business at a glance.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Clients", value: clientCount, icon: "👥", href: "/chef/clients" },
          { label: "Recipes", value: recipeCount, icon: "📋", href: "/chef/recipes" },
          { label: "Menus Created", value: menuCount, icon: "🗓", href: "/chef/menus" },
          {
            label: "Avg. Rating",
            value: avgRating._avg.rating ? avgRating._avg.rating.toFixed(1) + " / 5" : "—",
            icon: "⭐",
            href: "/chef/clients",
          },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#c9a97a] hover:shadow-sm transition-all"
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-[#3b2a1a]">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Pending responses alert */}
      {pendingResponses > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="font-medium text-amber-800">
              {pendingResponses} menu item{pendingResponses > 1 ? "s" : ""} awaiting client response
            </p>
            <p className="text-amber-700 text-sm">Clients haven&apos;t yet approved or declined all their dishes.</p>
          </div>
          <Link href="/chef/menus" className="text-sm text-amber-700 font-medium hover:underline shrink-0 ml-4">
            View Menus →
          </Link>
        </div>
      )}

      {addOnRequests.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="font-medium text-emerald-900">
                {addOnRequests.length} add-on request{addOnRequests.length > 1 ? "s" : ""} awaiting preparation
              </p>
              <p className="text-emerald-700 text-sm">Clients have requested add-ons from their add-ons page.</p>
            </div>
            <Link href="/chef/clients" className="text-sm text-emerald-700 font-medium hover:underline shrink-0">
              View Clients →
            </Link>
          </div>

          <div className="grid gap-2">
            {addOnRequests.map((request) => (
              <Link
                key={request.id}
                href={`/chef/clients/${request.client.id}`}
                className="bg-white border border-emerald-100 rounded-lg px-3 py-2 hover:border-emerald-300 transition-colors"
              >
                <p className="text-sm text-[#3b2a1a] font-medium">{request.recipe.name}</p>
                <p className="text-xs text-gray-600">{request.client.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Feedback */}
      <div className="mb-8">
        <Link
          href="/chef/menus"
          className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-[#c9a97a] hover:shadow-sm transition-all"
        >
          <p className="text-sm text-gray-500">Pricing</p>
          <h2 className="text-lg font-semibold text-[#3b2a1a] mt-1">Menus &amp; Quotes</h2>
          <p className="text-sm text-gray-600 mt-1">
            Generate menus and calculate break-even, per-meal cost, and profit-adjusted client pricing.
          </p>
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#3b2a1a] mb-4">Recent Client Feedback</h2>
        {recentFeedbacks.length === 0 ? (
          <p className="text-gray-400 text-sm">No feedback yet.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {recentFeedbacks.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-[#3b2a1a]">{f.recipe.name}</p>
                  <p className="text-xs text-gray-400">{f.client.name}</p>
                  {f.comment && <p className="text-xs text-gray-600 mt-0.5 italic">&ldquo;{f.comment}&rdquo;</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-amber-400 text-sm">{"★".repeat(f.rating)}</span>
                  {f.favorited && <span className="text-red-500">♥</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
