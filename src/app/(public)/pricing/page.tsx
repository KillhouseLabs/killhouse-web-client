import Link from "next/link";
import { PLANS, formatLimit, formatPrice } from "@/config/constants";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "가격 - Killhouse",
  description: "Killhouse의 가격 플랜을 확인하세요",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
            </div>
            <span className="text-xl font-bold">Killhouse</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm font-medium text-foreground"
            >
              가격
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              시작하기
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">심플한 가격, 강력한 보안</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            프로젝트 규모에 맞는 플랜을 선택하세요. 모든 플랜에 핵심 보안 분석
            기능이 포함됩니다.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="container mx-auto px-4 pb-24">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {/* Free Plan */}
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                개인 프로젝트에 적합
              </p>
              <p className="mt-6">
                <span className="text-4xl font-bold">
                  {formatPrice(PLANS.FREE.price)}
                </span>
                <span className="text-muted-foreground">/월</span>
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  최대 {formatLimit(PLANS.FREE.limits.projects)}개 프로젝트
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />월{" "}
                  {formatLimit(PLANS.FREE.limits.analysisPerMonth)}회 분석
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  GitHub/GitLab 연동
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  기본 취약점 리포트
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <XIcon />
                  모의 침투 테스트
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <XIcon />
                  우선 지원
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full rounded-lg border border-border py-3 text-center text-sm font-medium transition-colors hover:bg-accent"
              >
                무료로 시작하기
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-xl border-2 border-primary bg-card p-8">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                인기
              </span>
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                팀과 스타트업에 적합
              </p>
              <p className="mt-6">
                <span className="text-4xl font-bold">
                  {formatPrice(PLANS.PRO.price)}
                </span>
                <span className="text-muted-foreground">/월</span>
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  {formatLimit(PLANS.PRO.limits.projects) === "무제한"
                    ? "무제한"
                    : `최대 ${formatLimit(PLANS.PRO.limits.projects)}개`}{" "}
                  프로젝트
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />월{" "}
                  {formatLimit(PLANS.PRO.limits.analysisPerMonth) === "무제한"
                    ? "무제한"
                    : `${formatLimit(PLANS.PRO.limits.analysisPerMonth)}회`}{" "}
                  분석
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  GitHub/GitLab 연동
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  상세 취약점 리포트
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  모의 침투 테스트
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  우선 지원
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full rounded-lg bg-primary py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Pro 시작하기
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="text-xl font-semibold">Enterprise</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                대규모 조직에 적합
              </p>
              <p className="mt-6">
                <span className="text-4xl font-bold">문의</span>
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  무제한 모든 것
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  SSO / SAML
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  온프레미스 배포
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  커스텀 보안 정책
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  전담 지원
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  SLA 보장
                </li>
              </ul>
              <Link
                href="mailto:sales@killhouse.com"
                className="mt-8 block w-full rounded-lg border border-border py-3 text-center text-sm font-medium transition-colors hover:bg-accent"
              >
                문의하기
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              자주 묻는 질문
            </h2>
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold">
                  무료 플랜에서 유료로 언제든 업그레이드할 수 있나요?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  네, 언제든지 업그레이드할 수 있습니다. 업그레이드 시 기존
                  프로젝트와 분석 결과는 모두 유지됩니다.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold">
                  모의 침투 테스트는 어떻게 진행되나요?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  정적 분석 후 샌드박스 환경에서 애플리케이션을 실행하고,
                  자동화된 모의 침투 테스트를 수행합니다. 실제 공격 시나리오를
                  시뮬레이션하여 취약점을 검증합니다.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold">
                  비공개 저장소도 분석할 수 있나요?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  네, GitHub 또는 GitLab 계정을 연동하면 비공개 저장소도 분석할
                  수 있습니다. 저장소 접근 권한은 분석 시에만 사용됩니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-5 w-5 text-muted-foreground/50"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
