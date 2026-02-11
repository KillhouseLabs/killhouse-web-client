/**
 * Data Migration Script: Single Repository to Multi-Repository
 *
 * This script migrates existing project data from the legacy single-repo
 * structure (repoProvider, repoUrl, etc. on Project) to the new multi-repo
 * structure (Repository model).
 *
 * Usage:
 *   npx tsx prisma/scripts/migrate-to-multi-repo.ts
 *
 * Prerequisites:
 *   1. Make sure the Repository model is added to schema.prisma
 *   2. Run `npx prisma db push` or `npx prisma migrate dev`
 *   3. Then run this script
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define legacy Project type with old fields (for reference)
interface LegacyProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  // Legacy repo fields (existed before multi-repo)
  repoProvider?: string | null;
  repoUrl?: string | null;
  repoOwner?: string | null;
  repoName?: string | null;
  defaultBranch?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

async function migrateToMultiRepo() {
  console.log("Starting migration to multi-repository structure...\n");

  try {
    // Get all projects (cast to legacy type for migration)
    // Note: This assumes the schema still has the legacy fields
    // If fields are already removed, this migration is not needed
    const projects = await prisma.$queryRaw<LegacyProject[]>`
      SELECT id, name, description, status, userId, createdAt, updatedAt,
             repoProvider, repoUrl, repoOwner, repoName, defaultBranch
      FROM projects
      WHERE repoProvider IS NOT NULL OR repoName IS NOT NULL
    `;

    console.log(`Found ${projects.length} projects with legacy repo fields\n`);

    if (projects.length === 0) {
      console.log("No projects to migrate. Schema may already be updated.");
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const project of projects) {
      // Skip if no repo info
      if (!project.repoName && !project.repoProvider) {
        console.log(`Skipping project ${project.id}: No repo info`);
        skippedCount++;
        continue;
      }

      // Check if repository already exists for this project
      const existingRepo = await prisma.repository.findFirst({
        where: {
          projectId: project.id,
          url: project.repoUrl || undefined,
        },
      });

      if (existingRepo) {
        console.log(`Skipping project ${project.id}: Repository already exists`);
        skippedCount++;
        continue;
      }

      // Create new Repository from legacy fields
      await prisma.repository.create({
        data: {
          provider: project.repoProvider || "MANUAL",
          url: project.repoUrl,
          owner: project.repoOwner,
          name: project.repoName || `${project.name}-repo`,
          defaultBranch: project.defaultBranch || "main",
          isPrimary: true, // First repo is always primary
          projectId: project.id,
        },
      });

      console.log(
        `Migrated project ${project.id}: ${project.repoOwner}/${project.repoName}`
      );
      migratedCount++;
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total projects processed: ${projects.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);

    // Step 2: Link existing analyses to repositories
    console.log("\n=== Linking Analyses to Repositories ===");

    const analysesWithoutRepo = await prisma.analysis.findMany({
      where: {
        repositoryId: null,
      },
      select: {
        id: true,
        projectId: true,
      },
    });

    console.log(`Found ${analysesWithoutRepo.length} analyses without repository link`);

    let linkedCount = 0;
    for (const analysis of analysesWithoutRepo) {
      // Find primary repository for this project
      const primaryRepo = await prisma.repository.findFirst({
        where: {
          projectId: analysis.projectId,
          isPrimary: true,
        },
      });

      if (primaryRepo) {
        await prisma.analysis.update({
          where: { id: analysis.id },
          data: { repositoryId: primaryRepo.id },
        });
        linkedCount++;
      }
    }

    console.log(`Linked ${linkedCount} analyses to their repositories`);

    console.log("\n=== Migration Complete ===");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToMultiRepo()
  .then(() => {
    console.log("\nMigration script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration script failed:", error);
    process.exit(1);
  });
