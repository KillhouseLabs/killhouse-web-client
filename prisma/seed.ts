import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_USER_EMAIL = "demo@killhouse.io";
const DEMO_USER_PASSWORD = "KillhouseDemo2025!";
const DEMO_USER_NAME = "Demo User";

const platformPolicy = {
  subscriptionStatuses: {
    ACTIVE: { label: "활성", isActive: true },
    TRIALING: { label: "체험", isActive: true },
    CANCELLED: { label: "해지", isActive: false },
    EXPIRED: { label: "만료", isActive: false },
    PAST_DUE: { label: "연체", isActive: false },
  },
  plans: {
    free: {
      name: "Free",
      price: 0,
      limits: {
        maxProjects: 3,
        maxAnalysisPerMonth: 10,
        maxStorageMB: 100,
        maxConcurrentScans: 2,
        maxConcurrentSandboxes: 1,
        maxConcurrentExploitSessions: 1,
        containerMemoryLimit: "512m",
        containerCpuLimit: 0.5,
        containerPidsLimit: 50,
        scanRateLimitPerMin: 5,
      },
    },
    pro: {
      name: "Pro",
      price: 29000,
      limits: {
        maxProjects: -1,
        maxAnalysisPerMonth: 100,
        maxStorageMB: 10240,
        maxConcurrentScans: 5,
        maxConcurrentSandboxes: 3,
        maxConcurrentExploitSessions: 3,
        containerMemoryLimit: "1g",
        containerCpuLimit: 1.0,
        containerPidsLimit: 100,
        scanRateLimitPerMin: 10,
      },
    },
    enterprise: {
      name: "Enterprise",
      price: -1,
      limits: {
        maxProjects: -1,
        maxAnalysisPerMonth: -1,
        maxStorageMB: -1,
        maxConcurrentScans: 10,
        maxConcurrentSandboxes: 5,
        maxConcurrentExploitSessions: 5,
        containerMemoryLimit: "2g",
        containerCpuLimit: 2.0,
        containerPidsLimit: 200,
        scanRateLimitPerMin: 30,
      },
    },
  },
};

async function main() {
  await prisma.platformPolicy.upsert({
    where: { id: "current" },
    update: {
      policy: platformPolicy,
      version: 1,
    },
    create: {
      id: "current",
      version: 1,
      policy: platformPolicy,
    },
  });

  console.log("Platform policy seeded successfully");

  // --- Demo user (enterprise plan, all permissions) ---
  const hashedPassword = await bcrypt.hash(DEMO_USER_PASSWORD, 10);

  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {
      name: DEMO_USER_NAME,
      password: hashedPassword,
    },
    create: {
      email: DEMO_USER_EMAIL,
      name: DEMO_USER_NAME,
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  await prisma.subscription.upsert({
    where: { userId: demoUser.id },
    update: {
      planId: "enterprise",
      status: "ACTIVE",
    },
    create: {
      userId: demoUser.id,
      planId: "enterprise",
      status: "ACTIVE",
    },
  });

  console.log(`Demo user seeded: ${DEMO_USER_EMAIL} (enterprise plan)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
