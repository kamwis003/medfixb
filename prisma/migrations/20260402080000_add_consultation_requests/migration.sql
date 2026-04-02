-- CreateEnum
CREATE TYPE "public"."consultation_request_statuses" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."consultation_requests" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "description" TEXT NOT NULL,
    "status" "public"."consultation_request_statuses" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consultation_requests_patient_id_idx" ON "public"."consultation_requests"("patient_id");

-- AddForeignKey
ALTER TABLE "public"."consultation_requests" ADD CONSTRAINT "consultation_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
