-- CreateTable
CREATE TABLE "endometriosis_articles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endometriosis_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "endometriosis_articles_user_id_idx" ON "endometriosis_articles"("user_id");

-- CreateIndex
CREATE INDEX "endometriosis_articles_created_at_idx" ON "endometriosis_articles"("created_at");

-- AddForeignKey
ALTER TABLE "endometriosis_articles" ADD CONSTRAINT "endometriosis_articles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
