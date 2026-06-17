import { prisma } from "@/lib/prisma";
import MenuGeneratorForm from "@/components/chef/MenuGeneratorForm";

export default async function NewMenuPage() {
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { id: true, name: true, email: true, allergies: true, preferences: true },
  });

  const recipes = await prisma.recipe.findMany({
    include: { ingredients: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#3b2a1a] mb-1">Generate Weekly Menu</h1>
      <p className="text-gray-500 text-sm mb-8">
        Select a client and let the smart generator suggest a week of recipes optimized around shared ingredients.
        You can then adjust the final selection.
      </p>
      <MenuGeneratorForm clients={clients} recipes={recipes} />
    </div>
  );
}
