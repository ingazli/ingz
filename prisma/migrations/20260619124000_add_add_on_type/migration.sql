-- CreateEnum
CREATE TYPE "AddOnType" AS ENUM ('JAM', 'PICKLE', 'SAUCE', 'SPREAD', 'CONDIMENT', 'FERMENT', 'DRINK', 'DESSERT_SNACK', 'PANTRY_STAPLE', 'OTHER');

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "addOnType" "AddOnType";

-- Backfill existing add-ons
UPDATE "Recipe"
SET "addOnType" = 'OTHER'
WHERE "category" = 'ADD_ON' AND "addOnType" IS NULL;
