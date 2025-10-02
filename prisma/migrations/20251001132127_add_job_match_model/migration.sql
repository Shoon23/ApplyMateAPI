/*
  Warnings:

  - You are about to drop the `Notes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Notes" DROP CONSTRAINT "Notes_jobId_fkey";

-- AlterTable
ALTER TABLE "public"."JobApplication" ADD COLUMN     "notes" TEXT;

-- DropTable
DROP TABLE "public"."Notes";

-- CreateTable
CREATE TABLE "public"."JobMatchScore" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fitScore" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "JobMatchScore_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."JobMatchScore" ADD CONSTRAINT "JobMatchScore_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobMatchScore" ADD CONSTRAINT "JobMatchScore_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."JobApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
