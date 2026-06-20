import { prisma } from "@/lib/prisma";
import MenuGeneratorForm from "@/components/chef/MenuGeneratorForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewMenuPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CHEF") {
    redirect("/login");
  }

  const [clients, recipes, ingredientPrices] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: { id: true, name: true, email: true, allergies: true, preferences: true, questionnaireData: true },
    }),
    prisma.recipe.findMany({
      where: { category: "MEAL_PLAN" },
      include: { ingredients: true },
      orderBy: { name: "asc" },
    }),
    prisma.chefIngredientPrice.findMany({
      where: { chefId: session.user.id },
      select: {
        ingredientKey: true,
        packagePrice: true,
        packageAmount: true,
        packageUnit: true,
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#3b2a1a] mb-1">Generate Weekly Menu</h1>
      <p className="text-gray-500 text-sm mb-8">
        Select a client and let the smart generator suggest a week of recipes optimized around shared ingredients.
        You can then adjust the final selection.
      </p>
      <MenuGeneratorForm
        clients={clients}
        recipes={recipes.map((recipe) => ({
          id: recipe.id,
          name: recipe.name,
          mealType: recipe.mealType,
          tags: recipe.tags,
          servings: recipe.servings,
          ingredients: recipe.ingredients.map((ing) => ({
            id: ing.id,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        }))}
        ingredientPrices={ingredientPrices}
      />
    </div>
  );
}
