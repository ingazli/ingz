import { prisma } from "@/lib/prisma";
import RecipeForm from "@/components/chef/RecipeForm";

export default async function NewRecipePage() {
  try {
    // Use Prisma client instead of raw SQL to avoid quoting/casing issues
    const cookbookRows = await prisma.recipe.findMany({
      where: { cookbookName: { not: null } },
      select: { cookbookName: true },
      distinct: ["cookbookName"],
      orderBy: { cookbookName: "asc" },
    });
    const cookbookNames = cookbookRows
      .map((row) => row.cookbookName)
      .filter((name): name is string => Boolean(name && name.trim()));

    return (
      <div>
        <h1 className="text-2xl font-bold text-[#3b2a1a] mb-1">New Recipe</h1>
        <p className="text-gray-500 text-sm mb-8">Add a recipe to your library.</p>
        <RecipeForm cookbookNames={cookbookNames} />
      </div>
    );
  } catch (err: any) {
    console.error("Error loading cookbook names for NewRecipePage:", err);
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#3b2a1a] mb-1">New Recipe</h1>
        <p className="text-gray-500 text-sm mb-8">Add a recipe to your library.</p>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          There was a problem loading recipe data. Check the server logs for details.
        </div>
      </div>
    );
  }
}
