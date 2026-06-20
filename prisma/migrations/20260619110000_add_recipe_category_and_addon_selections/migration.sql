-- CreateEnum
CREATE TYPE "RecipeCategory" AS ENUM ('MEAL_PLAN', 'ADD_ON');

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "category" "RecipeCategory" NOT NULL DEFAULT 'MEAL_PLAN';

-- CreateTable
CREATE TABLE "ClientAddOnSelection" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientAddOnSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientAddOnSelection_clientId_recipeId_key" ON "ClientAddOnSelection"("clientId", "recipeId");

-- AddForeignKey
ALTER TABLE "ClientAddOnSelection" ADD CONSTRAINT "ClientAddOnSelection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAddOnSelection" ADD CONSTRAINT "ClientAddOnSelection_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
