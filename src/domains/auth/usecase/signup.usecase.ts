import bcrypt from "bcryptjs";
import { prisma } from "@/infrastructure/database/prisma";
import { SignUpInput } from "../dto/auth.dto";

export interface SignUpResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export async function signUpUser(input: SignUpInput): Promise<SignUpResult> {
  const { name, email, password } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      success: false,
      error: "이미 등록된 이메일입니다",
    };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  // Create free subscription for new user
  await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: "free",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
    },
  });

  return {
    success: true,
    userId: user.id,
  };
}
