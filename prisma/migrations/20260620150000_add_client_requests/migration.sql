-- CreateTable
CREATE TABLE "ClientRequest" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "mealsPerDay" TEXT,
    "portionsPerMeal" TEXT,
    "allergies" TEXT,
    "dislikes" TEXT,
    "favorites" TEXT,
    "additionalInfo" TEXT,
    "serviceType" TEXT,
    "serviceCount" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRequest_pkey" PRIMARY KEY ("id")
);
