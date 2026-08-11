-- CreateTable
CREATE TABLE "TrendBrief" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrendBrief_createdAt_idx" ON "TrendBrief"("createdAt");
