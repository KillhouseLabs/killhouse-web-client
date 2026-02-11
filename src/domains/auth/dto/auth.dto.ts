import { z } from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "이름은 2자 이상이어야 합니다")
    .max(50, "이름은 50자 이하여야 합니다"),
  email: z.string().email("올바른 이메일 주소를 입력하세요"),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .max(100, "비밀번호는 100자 이하여야 합니다")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다"
    ),
});

export const signInSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
