-- CreateTable
CREATE TABLE "ChefIngredientPrice" (
    "id" TEXT NOT NULL,
    "chefId" TEXT NOT NULL,
    "ingredientKey" TEXT NOT NULL,
    "ingredientName" TEXT NOT NULL,
    "packagePrice" DOUBLE PRECISION NOT NULL,
    "packageAmount" DOUBLE PRECISION NOT NULL,
    "packageUnit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChefIngredientPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChefIngredientPrice_chefId_ingredientKey_key" ON "ChefIngredientPrice"("chefId", "ingredientKey");

-- AddForeignKey
ALTER TABLE "ChefIngredientPrice" ADD CONSTRAINT "ChefIngredientPrice_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
