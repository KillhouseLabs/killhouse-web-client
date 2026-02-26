import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "demo@killhouse.io" },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    console.log("Demo user not found");
    return;
  }

  console.log("=== Demo User ===");
  console.log(JSON.stringify(user, null, 2));

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });
  console.log("\n=== Subscription ===");
  console.log(JSON.stringify(subscription, null, 2));

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  console.log("\n=== Projects ===");
  console.log(JSON.stringify(projects, null, 2));

  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    select: { id: true, orderId: true, planId: true, amount: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  console.log("\n=== Payments ===");
  console.log(JSON.stringify(payments, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
