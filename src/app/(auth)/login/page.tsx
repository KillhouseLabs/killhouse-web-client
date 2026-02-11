import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "로그인",
  description: "Autopsy Agent 계정에 로그인하세요",
};

export default function LoginPage() {
  return <LoginForm />;
}
