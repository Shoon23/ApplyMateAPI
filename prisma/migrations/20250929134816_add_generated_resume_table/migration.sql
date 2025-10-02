-- CreateTable
CREATE TABLE "public"."GeneratedResume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "fitScore" DOUBLE PRECISION,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedResume_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."GeneratedResume" ADD CONSTRAINT "GeneratedResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedResume" ADD CONSTRAINT "GeneratedResume_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."JobApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
