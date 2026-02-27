import bcrypt from "bcryptjs";
import { SignUpInput } from "../dto/auth.dto";
import { userRepository } from "../infra/prisma-user.repository";
import { subscriptionRepository } from "@/domains/subscription/infra/prisma-subscription.repository";

export interface SignUpResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export async function signUpUser(input: SignUpInput): Promise<SignUpResult> {
  const { name, email, password } = input;

  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    return {
      success: false,
      error: "이미 등록된 이메일입니다",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await userRepository.create({
    name,
    email,
    password: hashedPassword,
  });

  await subscriptionRepository.create({
    userId: user.id,
    planId: "free",
    status: "ACTIVE",
    currentPeriodStart: new Date(),
  });

  return {
    success: true,
    userId: user.id,
  };
}
