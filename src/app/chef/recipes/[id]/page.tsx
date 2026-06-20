import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import RecipeForm from "@/components/chef/RecipeForm";
import { prisma } from "@/lib/prisma";
import { calculateRecipeCost } from "@/lib/recipe-pricing";

type EditableIngredient = {
  id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
};

type EditableRecipe = {
  id: string;
  name: string;
  category: "MEAL_PLAN" | "ADD_ON";
  addOnType: string | null;
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

type IngredientPriceRow = {
  ingredientKey: string;
  packagePrice: number;
  packageAmount: number;
  packageUnit: string;
};

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const chefId = session?.user?.id;
  const [recipeRaw, cookbookRows] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: true },
    }),
    prisma.recipe.findMany({
      where: { cookbookName: { not: null } },
      select: { cookbookName: true },
      distinct: ["cookbookName"],
      orderBy: { cookbookName: "asc" },
    }),
  ]);

  const ingredientPrices = chefId
    ? await prisma.chefIngredientPrice.findMany({
        where: { chefId },
        select: { ingredientKey: true, packagePrice: true, packageAmount: true, packageUnit: true },
      })
    : [];

  const ingredientPriceRows: IngredientPriceRow[] = ingredientPrices.map((price) => ({
    ingredientKey: price.ingredientKey,
    packagePrice: price.packagePrice,
    packageAmount: price.packageAmount,
    packageUnit: price.packageUnit,
  }));

  const recipe: EditableRecipe | null = recipeRaw
    ? {
        id: recipeRaw.id,
        name: recipeRaw.name,
        category: (recipeRaw as { category?: "MEAL_PLAN" | "ADD_ON" }).category ?? "MEAL_PLAN",
        addOnType: (recipeRaw as { addOnType?: string | null }).addOnType ?? null,
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

  const pricing = calculateRecipeCost(recipe.ingredients, ingredientPriceRows, recipe.servings ?? 1);

  const cookbookNames = cookbookRows
    .map((row) => row.cookbookName)
    .filter((name): name is string => Boolean(name && name.trim()));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#3b2a1a] mb-1">Edit Recipe</h1>
      <p className="text-gray-500 text-sm">{recipe.name}</p>
      {recipe.category === "MEAL_PLAN" && (
        <div className="mt-3 mb-6 rounded-lg border border-[#eadfce] bg-[#faf5ef] px-4 py-3 text-sm">
          {pricing.estimatedCost !== null ? (
            <p className="font-medium text-[#3b2a1a]">
              Generated recipe price: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(pricing.estimatedCost)}
            </p>
          ) : (
            <p className="text-amber-700">
              Add base prices for all ingredients to generate this recipe price.
            </p>
          )}
        </div>
      )}
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
