/*
  Warnings:

  - Changed the type of `explanation` on the `JobMatchScore` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."JobMatchScore" DROP COLUMN "explanation",
ADD COLUMN     "explanation" JSONB NOT NULL;
