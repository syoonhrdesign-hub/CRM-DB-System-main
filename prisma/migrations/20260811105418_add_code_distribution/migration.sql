-- CreateTable
CREATE TABLE "CodeDistribution" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "guide" TEXT,
    "targetUrl" TEXT,
    "organizationId" TEXT,
    "trainingId" TEXT,
    "verifyField" TEXT NOT NULL DEFAULT 'none',
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantCode" (
    "id" TEXT NOT NULL,
    "distributionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "department" TEXT,
    "verifyValue" TEXT,
    "viewedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeDistribution_slug_key" ON "CodeDistribution"("slug");

-- CreateIndex
CREATE INDEX "CodeDistribution_slug_idx" ON "CodeDistribution"("slug");

-- CreateIndex
CREATE INDEX "ParticipantCode_distributionId_idx" ON "ParticipantCode"("distributionId");

-- CreateIndex
CREATE INDEX "ParticipantCode_name_idx" ON "ParticipantCode"("name");

-- AddForeignKey
ALTER TABLE "CodeDistribution" ADD CONSTRAINT "CodeDistribution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeDistribution" ADD CONSTRAINT "CodeDistribution_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantCode" ADD CONSTRAINT "ParticipantCode_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "CodeDistribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
