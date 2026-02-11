export const metadata = {
  title: "마이페이지",
  description: "계정 정보를 확인하고 수정하세요",
};

export default function MyPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <p className="mt-1 text-muted-foreground">
          계정 정보를 확인하고 설정을 변경하세요
        </p>
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">프로필</h2>
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-muted-foreground"
            >
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">이름</label>
              <input
                type="text"
                defaultValue="사용자"
                className="w-full max-w-md rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">이메일</label>
              <input
                type="email"
                defaultValue="user@example.com"
                className="w-full max-w-md rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                disabled
              />
              <p className="mt-1 text-xs text-muted-foreground">
                이메일은 변경할 수 없습니다
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              변경사항 저장
            </button>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">비밀번호 변경</h2>
        <div className="max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              현재 비밀번호
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              새 비밀번호
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            비밀번호 변경
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/50 bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-destructive">
          위험 구역
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
        </p>
        <button
          type="button"
          className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          계정 삭제
        </button>
      </div>
    </div>
  );
}
