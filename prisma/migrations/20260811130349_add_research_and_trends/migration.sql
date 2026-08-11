-- CreateTable
CREATE TABLE "CompanyResearch" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "organizationId" TEXT,
    "summary" TEXT,
    "legalName" TEXT,
    "orgType" TEXT,
    "industry" TEXT,
    "foundedYear" INTEGER,
    "ceoName" TEXT,
    "address" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "listingStatus" TEXT,
    "groupName" TEXT,
    "corpCode" TEXT,
    "bizRegNo" TEXT,
    "employeeTotal" INTEGER,
    "employeeRegular" INTEGER,
    "employeeIrregular" INTEGER,
    "avgTenureYears" DOUBLE PRECISION,
    "pensionSubscribers" INTEGER,
    "pensionAsOf" TEXT,
    "headcountTrend" TEXT,
    "hiringMode" TEXT,
    "hiringMonths" TEXT,
    "hiringScale" TEXT,
    "recentPostings" TEXT,
    "careersUrl" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "coreValues" TEXT,
    "talentProfile" TEXT,
    "cultureNote" TEXT,
    "trainingPrograms" TEXT,
    "hrdOrgStructure" TEXT,
    "hrdDirection" TEXT,
    "revenue" TEXT,
    "operatingProfit" TEXT,
    "financialsAsOf" TEXT,
    "sustainabilityUrl" TEXT,
    "sustainabilityNote" TEXT,
    "salesAngle" TEXT,
    "expectedNeeds" TEXT,
    "cautions" TEXT,
    "researchedAt" TIMESTAMP(3),
    "researchedBy" TEXT,
    "gaps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchSource" (
    "id" TEXT NOT NULL,
    "researchId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT '기타',
    "title" TEXT NOT NULL,
    "publisher" TEXT,
    "url" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'rss',
    "url" TEXT,
    "keyword" TEXT,
    "category" TEXT NOT NULL DEFAULT 'HRD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "lastItemCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendItem" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisher" TEXT,
    "publishedAt" TIMESTAMP(3),
    "summary" TEXT,
    "category" TEXT NOT NULL DEFAULT 'HRD',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyResearch_organizationId_key" ON "CompanyResearch"("organizationId");

-- CreateIndex
CREATE INDEX "CompanyResearch_companyName_idx" ON "CompanyResearch"("companyName");

-- CreateIndex
CREATE INDEX "ResearchSource_researchId_idx" ON "ResearchSource"("researchId");

-- CreateIndex
CREATE INDEX "TrendSource_category_idx" ON "TrendSource"("category");

-- CreateIndex
CREATE UNIQUE INDEX "TrendItem_url_key" ON "TrendItem"("url");

-- CreateIndex
CREATE INDEX "TrendItem_publishedAt_idx" ON "TrendItem"("publishedAt");

-- CreateIndex
CREATE INDEX "TrendItem_category_idx" ON "TrendItem"("category");

-- CreateIndex
CREATE INDEX "TrendItem_isPinned_idx" ON "TrendItem"("isPinned");

-- AddForeignKey
ALTER TABLE "CompanyResearch" ADD CONSTRAINT "CompanyResearch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchSource" ADD CONSTRAINT "ResearchSource_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "CompanyResearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendItem" ADD CONSTRAINT "TrendItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "TrendSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
