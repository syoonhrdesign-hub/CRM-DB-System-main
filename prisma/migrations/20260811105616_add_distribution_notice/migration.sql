-- AlterTable
ALTER TABLE "CodeDistribution" ADD COLUMN     "audience" TEXT,
ADD COLUMN     "eventAt" TIMESTAMP(3),
ADD COLUMN     "eventTime" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "inquiry" TEXT,
ADD COLUMN     "instructor" TEXT,
ADD COLUMN     "notices" TEXT,
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "venue" TEXT;
