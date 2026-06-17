import { prisma } from "@/lib/prisma";
import RecipeForm from "@/components/chef/RecipeForm";

export default async function NewRecipePage() {
  const cookbookRows = await prisma.$queryRaw<Array<{ cookbookName: string | null }>>`
    SELECT DISTINCT cookbookName
    FROM Recipe
    WHERE cookbookName IS NOT NULL
    ORDER BY cookbookName ASC
  `;
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
}
