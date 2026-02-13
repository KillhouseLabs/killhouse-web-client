import Link from "next/link";

export const metadata = {
  title: "이용약관 - Killhouse",
  description: "Killhouse 서비스 이용약관",
};

export default function TermsPage() {
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
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
        <div className="container mx-auto px-4 py-16">
          <h1 className="mb-8 text-3xl font-bold">이용약관</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground">최종 수정일: 2024년 1월 1일</p>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">제1조 (목적)</h2>
              <p className="mt-2 text-muted-foreground">
                본 약관은 Killhouse(이하 &quot;회사&quot;)가 제공하는 보안
                분석 서비스(이하 &quot;서비스&quot;)의 이용조건 및 절차, 회사와
                이용자의 권리, 의무 및 책임사항 등 기본적인 사항을 규정함을
                목적으로 합니다.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">제2조 (용어의 정의)</h2>
              <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  &quot;서비스&quot;란 회사가 제공하는 소프트웨어 보안 취약점
                  분석 및 모의 침투 테스트 서비스를 의미합니다.
                </li>
                <li>
                  &quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를
                  이용하는 자를 말합니다.
                </li>
                <li>
                  &quot;프로젝트&quot;란 이용자가 분석을 위해 등록한 소프트웨어
                  저장소를 의미합니다.
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">제3조 (서비스의 내용)</h2>
              <p className="mt-2 text-muted-foreground">
                회사는 다음과 같은 서비스를 제공합니다:
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>GitHub/GitLab 저장소 연동 및 코드 분석</li>
                <li>정적 코드 분석 (SAST)</li>
                <li>샌드박스 환경에서의 모의 침투 테스트</li>
                <li>보안 취약점 리포트 생성</li>
                <li>취약점 해결 가이드 제공</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">제4조 (이용자의 의무)</h2>
              <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  이용자는 본인이 소유하거나 분석 권한이 있는 저장소만 등록해야
                  합니다.
                </li>
                <li>
                  이용자는 서비스를 악용하여 제3자의 시스템을 공격하는 등의 불법
                  행위를 해서는 안 됩니다.
                </li>
                <li>
                  이용자는 서비스를 통해 얻은 취약점 정보를 악의적인 목적으로
                  사용해서는 안 됩니다.
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">제5조 (책임의 제한)</h2>
              <p className="mt-2 text-muted-foreground">
                회사는 서비스 분석 결과의 완전성을 보장하지 않으며, 분석 결과를
                기반으로 한 이용자의 조치로 발생한 손해에 대해 책임을 지지
                않습니다.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">제6조 (개인정보 보호)</h2>
              <p className="mt-2 text-muted-foreground">
                회사는 이용자의 개인정보를{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  개인정보처리방침
                </Link>
                에 따라 보호합니다.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">제7조 (약관의 변경)</h2>
              <p className="mt-2 text-muted-foreground">
                회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스
                내 공지사항을 통해 공지합니다.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="mb-4 flex justify-center gap-6">
            <Link href="/terms" className="hover:text-foreground">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              개인정보처리방침
            </Link>
          </div>
          <p>&copy; 2024 Killhouse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
