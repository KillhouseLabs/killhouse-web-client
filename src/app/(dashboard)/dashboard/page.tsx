import Link from "next/link";

export const metadata = {
  title: "대시보드",
  description: "프로젝트 및 분석 현황을 확인하세요",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="mt-1 text-muted-foreground">
          프로젝트 현황과 최근 분석 결과를 확인하세요
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-primary"
              >
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              총 프로젝트
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold">0</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-green-500"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              완료된 분석
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold">0</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-yellow-500"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M3.586 15.192a.5.5 0 0 1 0-.384l3.988-9.96A.5.5 0 0 1 8.038 4.5h7.924a.5.5 0 0 1 .464.348l3.988 9.96a.5.5 0 0 1 0 .384l-3.988 4.96a.5.5 0 0 1-.464.348H8.038a.5.5 0 0 1-.464-.348l-3.988-4.96z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              발견된 취약점
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold">0</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-red-500"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              심각한 취약점
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold">0</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">빠른 시작</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/projects/new"
            className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">새 프로젝트 만들기</h3>
              <p className="text-sm text-muted-foreground">
                코드나 컨테이너를 분석하세요
              </p>
            </div>
          </Link>

          <Link
            href="/projects"
            className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">프로젝트 보기</h3>
              <p className="text-sm text-muted-foreground">
                모든 프로젝트를 확인하세요
              </p>
            </div>
          </Link>

          <Link
            href="/subscription"
            className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">플랜 업그레이드</h3>
              <p className="text-sm text-muted-foreground">
                더 많은 기능을 이용하세요
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">최근 활동</h2>
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="mb-1 font-medium">아직 활동이 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            프로젝트를 만들고 분석을 시작하면 여기에 표시됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
