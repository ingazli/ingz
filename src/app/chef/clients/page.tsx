import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ChefClientsPage() {
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: {
      weeklyMenus: { select: { id: true } },
      mealFeedbacks: { select: { rating: true, favorited: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#3b2a1a] mb-1">Clients</h1>
      <p className="text-gray-500 text-sm mb-8">{clients.length} active clients</p>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-gray-600">No clients yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => {
            const ratings = client.mealFeedbacks.map((f) => f.rating);
            const avgRating = ratings.length
              ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
              : null;
            const favorites = client.mealFeedbacks.filter((f) => f.favorited).length;

            return (
              <Link
                key={client.id}
                href={`/chef/clients/${client.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-[#c9a97a] hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-[#3b2a1a]">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.email}</p>
                    {client.allergies && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠ Allergies: {client.allergies}
                      </p>
                    )}
                    {client.preferences && (
                      <p className="text-xs text-[#7c5c3a] mt-0.5">
                        Preferences: {client.preferences}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 text-sm text-gray-500">
                    <p>{client.weeklyMenus.length} menus</p>
                    {avgRating && <p>★ {avgRating} avg</p>}
                    {favorites > 0 && <p>♥ {favorites} favorites</p>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
