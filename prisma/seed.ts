import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database…");

  // Chef account
  const chefPassword = await bcrypt.hash("chef1234", 12);
  const chef = await prisma.user.upsert({
    where: { email: "chef@chefandco.com" },
    update: {},
    create: {
      email: "chef@chefandco.com",
      name: "Chef Alex",
      password: chefPassword,
      role: "CHEF",
    },
  });
  console.log("✓ Chef:", chef.email);

  // Sample client
  const clientPassword = await bcrypt.hash("client1234", 12);
  const client = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      email: "jane@example.com",
      name: "Jane Smith",
      password: clientPassword,
      role: "CLIENT",
      allergies: "Tree nuts, shellfish",
      preferences: "Mediterranean food, vegetarian-friendly, low-carb options",
    },
  });
  console.log("✓ Client:", client.email);

  // Recipes
  const recipes = [
    {
      name: "Lemon Herb Roasted Chicken",
      description: "Juicy roasted chicken with fresh herbs and lemon zest.",
      prepTime: 15,
      cookTime: 45,
      servings: 4,
      mealType: "DINNER" as const,
      ingredients: [
        { name: "Chicken thighs", quantity: "4", unit: "pieces" },
        { name: "Lemon", quantity: "2", unit: "whole" },
        { name: "Garlic", quantity: "4", unit: "cloves" },
        { name: "Fresh rosemary", quantity: "2", unit: "sprigs" },
        { name: "Olive oil", quantity: "3", unit: "tbsp" },
        { name: "Salt", quantity: "1", unit: "tsp" },
        { name: "Black pepper", quantity: "1", unit: "tsp" },
      ],
    },
    {
      name: "Mediterranean Chickpea Salad",
      description: "Fresh chickpea salad with cucumber, tomatoes, feta, and olive oil.",
      prepTime: 10,
      cookTime: 0,
      servings: 2,
      mealType: "LUNCH" as const,
      ingredients: [
        { name: "Chickpeas", quantity: "1", unit: "can" },
        { name: "Cucumber", quantity: "1", unit: "whole" },
        { name: "Cherry tomatoes", quantity: "1", unit: "cup" },
        { name: "Feta cheese", quantity: "50", unit: "g" },
        { name: "Olive oil", quantity: "2", unit: "tbsp" },
        { name: "Lemon", quantity: "1", unit: "whole" },
        { name: "Fresh parsley", quantity: "2", unit: "tbsp" },
        { name: "Salt", quantity: "0.5", unit: "tsp" },
      ],
    },
    {
      name: "Greek Yogurt Parfait",
      description: "Layered Greek yogurt with honey, granola, and fresh berries.",
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      mealType: "BREAKFAST" as const,
      ingredients: [
        { name: "Greek yogurt", quantity: "200", unit: "g" },
        { name: "Granola", quantity: "3", unit: "tbsp" },
        { name: "Mixed berries", quantity: "0.5", unit: "cup" },
        { name: "Honey", quantity: "1", unit: "tbsp" },
      ],
    },
    {
      name: "Garlic Butter Salmon",
      description: "Pan-seared salmon fillet in a garlic herb butter sauce.",
      prepTime: 5,
      cookTime: 15,
      servings: 2,
      mealType: "DINNER" as const,
      ingredients: [
        { name: "Salmon fillets", quantity: "2", unit: "pieces" },
        { name: "Garlic", quantity: "3", unit: "cloves" },
        { name: "Butter", quantity: "2", unit: "tbsp" },
        { name: "Lemon", quantity: "1", unit: "whole" },
        { name: "Fresh dill", quantity: "2", unit: "sprigs" },
        { name: "Olive oil", quantity: "1", unit: "tbsp" },
        { name: "Salt", quantity: "0.5", unit: "tsp" },
        { name: "Black pepper", quantity: "0.5", unit: "tsp" },
      ],
    },
    {
      name: "Roasted Vegetable Quinoa Bowl",
      description: "Fluffy quinoa topped with roasted seasonal vegetables and tahini.",
      prepTime: 10,
      cookTime: 30,
      servings: 2,
      mealType: "LUNCH" as const,
      ingredients: [
        { name: "Quinoa", quantity: "1", unit: "cup" },
        { name: "Zucchini", quantity: "1", unit: "whole" },
        { name: "Red bell pepper", quantity: "1", unit: "whole" },
        { name: "Cherry tomatoes", quantity: "1", unit: "cup" },
        { name: "Olive oil", quantity: "2", unit: "tbsp" },
        { name: "Tahini", quantity: "2", unit: "tbsp" },
        { name: "Garlic", quantity: "2", unit: "cloves" },
        { name: "Lemon", quantity: "1", unit: "whole" },
        { name: "Salt", quantity: "0.5", unit: "tsp" },
      ],
    },
    {
      name: "Avocado Egg Toast",
      description: "Sourdough toast topped with mashed avocado and a poached egg.",
      prepTime: 5,
      cookTime: 10,
      servings: 1,
      mealType: "BREAKFAST" as const,
      ingredients: [
        { name: "Sourdough bread", quantity: "2", unit: "slices" },
        { name: "Avocado", quantity: "1", unit: "whole" },
        { name: "Eggs", quantity: "2", unit: "whole" },
        { name: "Lemon", quantity: "0.5", unit: "whole" },
        { name: "Red chili flakes", quantity: "0.25", unit: "tsp" },
        { name: "Salt", quantity: "0.25", unit: "tsp" },
        { name: "Black pepper", quantity: "0.25", unit: "tsp" },
      ],
    },
  ];

  for (const r of recipes) {
    const { ingredients, ...recipeData } = r;
    const existing = await prisma.recipe.findFirst({ where: { name: r.name } });
    if (!existing) {
      await prisma.recipe.create({
        data: {
          ...recipeData,
          ingredients: { create: ingredients },
        },
      });
    }
    console.log("✓ Recipe:", r.name);
  }

  console.log("\n✅ Seed complete!\n");
  console.log("Chef login:  chef@chefandco.com  /  chef1234");
  console.log("Client login: jane@example.com    /  client1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
