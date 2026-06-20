-- CreateTable
CREATE TABLE "ClientQuote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "chefId" TEXT NOT NULL,
    "mealsCount" INTEGER NOT NULL,
    "groceryCost" DOUBLE PRECISION NOT NULL,
    "laborHours" DOUBLE PRECISION NOT NULL,
    "laborRate" DOUBLE PRECISION NOT NULL,
    "profitPercent" DOUBLE PRECISION NOT NULL,
    "breakEvenCost" DOUBLE PRECISION NOT NULL,
    "totalQuote" DOUBLE PRECISION NOT NULL,
    "costPerMeal" DOUBLE PRECISION NOT NULL,
    "quotePerMeal" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientQuote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClientQuote" ADD CONSTRAINT "ClientQuote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientQuote" ADD CONSTRAINT "ClientQuote_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ClientQuote_clientId_createdAt_idx" ON "ClientQuote"("clientId", "createdAt");
