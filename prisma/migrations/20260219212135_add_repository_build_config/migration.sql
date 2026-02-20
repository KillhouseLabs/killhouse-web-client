-- AlterTable
ALTER TABLE "repositories" ADD COLUMN     "buildContext" TEXT,
ADD COLUMN     "dockerfilePath" TEXT,
ADD COLUMN     "targetService" TEXT;
