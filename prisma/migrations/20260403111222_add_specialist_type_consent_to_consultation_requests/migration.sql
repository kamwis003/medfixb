-- CreateEnum
CREATE TYPE "public"."specialist_types" AS ENUM ('GYNECOLOGIST', 'FERTILITY_SPECIALIST', 'ENDOCRINOLOGIST');

-- AlterTable: make description nullable, add specialistType and consentGiven
ALTER TABLE "public"."consultation_requests"
  ALTER COLUMN "description" DROP NOT NULL,
  ADD COLUMN "specialist_type" "public"."specialist_types" NOT NULL DEFAULT 'GYNECOLOGIST',
  ADD COLUMN "consent_given" BOOLEAN NOT NULL DEFAULT false;
