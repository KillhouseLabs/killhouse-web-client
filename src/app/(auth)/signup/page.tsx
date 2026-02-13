import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "회원가입",
  description: "Killhouse 계정을 만드세요",
};

export default function SignupPage() {
  return <SignupForm />;
}
