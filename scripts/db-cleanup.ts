import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_USER_ID = "cmm1x1rf40000q5cq4719cxbj";

async function main() {
  // 1. Delete repositories linked to demo user's projects
  const projects = await prisma.project.findMany({
    where: { userId: DEMO_USER_ID },
    select: { id: true, name: true },
  });

  if (projects.length > 0) {
    const projectIds = projects.map((p) => p.id);
    const delRepos = await prisma.repository.deleteMany({
      where: { projectId: { in: projectIds } },
    });
    console.log(`Deleted ${delRepos.count} repositories`);

    const delProjects = await prisma.project.deleteMany({
      where: { userId: DEMO_USER_ID },
    });
    console.log(`Deleted ${delProjects.count} projects`);
  } else {
    console.log("No projects to clean up");
  }

  // 2. Delete payments
  const delPayments = await prisma.payment.deleteMany({
    where: { userId: DEMO_USER_ID },
  });
  console.log(`Deleted ${delPayments.count} payments`);

  // 3. Verify subscription is untouched
  const sub = await prisma.subscription.findUnique({
    where: { userId: DEMO_USER_ID },
  });
  console.log(
    `\nSubscription status: planId=${sub?.planId}, status=${sub?.status}`
  );

  // 4. Final verification
  const remainingProjects = await prisma.project.count({
    where: { userId: DEMO_USER_ID },
  });
  const remainingPayments = await prisma.payment.count({
    where: { userId: DEMO_USER_ID },
  });
  console.log(
    `\n=== Post-cleanup verification ===\nProjects: ${remainingProjects}\nPayments: ${remainingPayments}`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
