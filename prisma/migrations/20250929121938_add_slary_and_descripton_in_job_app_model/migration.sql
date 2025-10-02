/*
  Warnings:

  - You are about to drop the `Description` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Description" DROP CONSTRAINT "Description_jobId_fkey";

-- AlterTable
ALTER TABLE "public"."JobApplication" ADD COLUMN     "description" TEXT,
ADD COLUMN     "salary" INTEGER;

-- DropTable
DROP TABLE "public"."Description";
