-- AlterTable
ALTER TABLE "public"."profiles" ADD COLUMN "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "public"."profiles"("email");
