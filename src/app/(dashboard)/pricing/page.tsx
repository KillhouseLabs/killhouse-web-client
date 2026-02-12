import { PricingPlans } from "@/components/subscription/pricing-plans";

export const metadata = {
  title: "플랜 선택",
  description: "Autopsy Agent 구독 플랜을 선택하세요",
};

export default function PricingPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">플랜 선택</h1>
        <p className="mt-2 text-muted-foreground">
          프로젝트 규모에 맞는 플랜을 선택하세요
        </p>
      </div>

      {/* Pricing Plans */}
      <PricingPlans />
    </div>
  );
}
