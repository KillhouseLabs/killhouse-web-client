export const metadata = {
  title: "구독 관리",
  description: "구독 플랜을 확인하고 관리하세요",
};

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">구독 관리</h1>
        <p className="mt-1 text-muted-foreground">
          현재 구독 플랜을 확인하고 관리하세요
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">현재 플랜</h2>
            <p className="mt-1 text-muted-foreground">
              Free 플랜을 사용 중입니다
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
            Free
          </span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">프로젝트</p>
            <p className="mt-1 text-2xl font-bold">0 / 3</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">월간 분석</p>
            <p className="mt-1 text-2xl font-bold">0 / 10</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">스토리지</p>
            <p className="mt-1 text-2xl font-bold">0 / 100MB</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">플랜 선택</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Free Plan */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              개인 프로젝트에 적합
            </p>
            <p className="mt-4">
              <span className="text-3xl font-bold">₩0</span>
              <span className="text-muted-foreground">/월</span>
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 text-green-500"
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
                최대 3개 프로젝트
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 text-green-500"
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
                월 10회 분석
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 text-green-500"
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
                100MB 스토리지
              </li>
            </ul>
            <button
              type="button"
              disabled
              className="mt-6 w-full rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground"
            >
              현재 플랜
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-xl border-2 border-primary bg-card p-6">
            <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              인기
            </span>
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              팀과 스타트업에 적합
            </p>
            <p className="mt-4">
              <span className="text-3xl font-bold">₩29,000</span>
              <span className="text-muted-foreground">/월</span>
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 text-green-500"
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
                무제한 프로젝트
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 text-green-500"
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
                월 100회 분석
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 text-green-500"
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
                10GB 스토리지
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 text-green-500"
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
                우선 지원
              </li>
            </ul>
            <button
              type="button"
              className="mt-6 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              업그레이드
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold">Enterprise</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              대규모 조직에 적합
            </p>
            <p className="mt-4">
              <span className="text-3xl font-bold">문의</span>
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 text-green-500"
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
                무제한 모든 것
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 text-green-500"
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
                SSO / SAML
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 text-green-500"
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
                전담 지원
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 text-green-500"
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
                SLA 보장
              </li>
            </ul>
            <button
              type="button"
              className="mt-6 w-full rounded-lg border border-border py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              문의하기
            </button>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">결제 내역</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          </div>
          <h3 className="mb-1 font-medium">결제 내역이 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            유료 플랜을 구독하면 여기에 결제 내역이 표시됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
