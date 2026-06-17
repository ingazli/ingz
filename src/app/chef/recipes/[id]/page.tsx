import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RecipeForm from "@/components/chef/RecipeForm";

type EditableIngredient = {
  id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
};

type EditableRecipe = {
  id: string;
  name: string;
  tags: string | null;
  cookbookName: string | null;
  recipeLink: string | null;
  pageNumber: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  mealType: string;
  ingredients: EditableIngredient[];
};

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recipeRaw, cookbookRows] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: true },
    }),
    prisma.$queryRaw<Array<{ cookbookName: string | null }>>`
      SELECT DISTINCT cookbookName
      FROM Recipe
      WHERE cookbookName IS NOT NULL
      ORDER BY cookbookName ASC
    `,
  ]);
  const recipe: EditableRecipe | null = recipeRaw
    ? {
        id: recipeRaw.id,
        name: recipeRaw.name,
        tags: (recipeRaw as { tags?: string | null }).tags ?? null,
        cookbookName: (recipeRaw as { cookbookName?: string | null }).cookbookName ?? null,
        recipeLink: (recipeRaw as { recipeLink?: string | null }).recipeLink ?? null,
        pageNumber: (recipeRaw as { pageNumber?: string | null }).pageNumber ?? null,
        prepTime: recipeRaw.prepTime,
        cookTime: recipeRaw.cookTime,
        servings: recipeRaw.servings,
        mealType: recipeRaw.mealType,
        ingredients: recipeRaw.ingredients.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        })),
      }
    : null;
  if (!recipe) notFound();

  const cookbookNames = cookbookRows
    .map((row) => row.cookbookName)
    .filter((name): name is string => Boolean(name && name.trim()));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#3b2a1a] mb-1">Edit Recipe</h1>
      <p className="text-gray-500 text-sm">{recipe.name}</p>
      {(recipe.cookbookName || recipe.pageNumber || recipe.recipeLink) && (
        <div className="text-xs text-gray-500 mt-2 mb-6 space-y-0.5">
          {recipe.cookbookName && <p>Cookbook: {recipe.cookbookName}</p>}
          {recipe.pageNumber && <p>Page: {recipe.pageNumber}</p>}
          {recipe.recipeLink && (
            <p>
              Source: <a href={recipe.recipeLink} target="_blank" rel="noreferrer" className="text-[#7c5c3a] underline">{recipe.recipeLink}</a>
            </p>
          )}
        </div>
      )}
      <RecipeForm recipe={recipe} cookbookNames={cookbookNames} />
    </div>
  );
}
