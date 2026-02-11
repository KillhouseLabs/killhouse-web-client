import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 - Autopsy Agent",
  description: "Autopsy Agent 개인정보처리방침",
};

export default function PrivacyPage() {
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
            <span className="text-xl font-bold">Autopsy Agent</span>
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
          <h1 className="mb-8 text-3xl font-bold">개인정보처리방침</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground">최종 수정일: 2024년 1월 1일</p>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">1. 수집하는 개인정보</h2>
              <p className="mt-2 text-muted-foreground">
                Autopsy Agent는 서비스 제공을 위해 다음과 같은 개인정보를
                수집합니다:
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  <strong>필수 정보:</strong> 이메일 주소, 이름(또는 닉네임)
                </li>
                <li>
                  <strong>OAuth 연동 시:</strong> OAuth 제공자로부터 전달받는
                  프로필 정보 (이메일, 이름, 프로필 이미지)
                </li>
                <li>
                  <strong>저장소 연동 시:</strong> GitHub/GitLab 저장소 접근
                  토큰 (분석 시에만 사용)
                </li>
                <li>
                  <strong>자동 수집 정보:</strong> 서비스 이용 기록, 접속 로그,
                  IP 주소
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">2. 개인정보의 이용 목적</h2>
              <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>회원 가입 및 관리</li>
                <li>보안 분석 서비스 제공</li>
                <li>서비스 개선 및 신규 서비스 개발</li>
                <li>고객 문의 응대</li>
                <li>서비스 관련 공지사항 전달</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">3. 개인정보의 보유 기간</h2>
              <p className="mt-2 text-muted-foreground">
                개인정보는 회원 탈퇴 시 즉시 삭제됩니다. 단, 관계 법령에 따라
                보관이 필요한 경우 해당 기간 동안 보관합니다:
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                <li>접속 로그: 3개월</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">
                4. 개인정보의 제3자 제공
              </h2>
              <p className="mt-2 text-muted-foreground">
                회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
                다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>이용자가 사전에 동의한 경우</li>
                <li>
                  법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와
                  방법에 따라 수사기관의 요구가 있는 경우
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">5. 코드 및 분석 데이터</h2>
              <p className="mt-2 text-muted-foreground">
                이용자의 저장소 코드는 분석 시에만 일시적으로 처리되며, 분석
                완료 후 코드 원본은 즉시 삭제됩니다. 분석 결과(취약점 리포트)는
                이용자가 프로젝트를 삭제할 때까지 보관됩니다.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">6. 이용자의 권리</h2>
              <p className="mt-2 text-muted-foreground">
                이용자는 언제든지 다음의 권리를 행사할 수 있습니다:
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>개인정보 열람 요구</li>
                <li>개인정보 정정 요구</li>
                <li>개인정보 삭제 요구</li>
                <li>개인정보 처리 정지 요구</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                위 권리 행사는 마이페이지에서 직접 처리하거나 고객센터를 통해
                요청할 수 있습니다.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">7. 개인정보 보호 조치</h2>
              <p className="mt-2 text-muted-foreground">
                회사는 개인정보 보호를 위해 다음과 같은 조치를 취하고 있습니다:
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>개인정보의 암호화</li>
                <li>해킹 등에 대비한 기술적 대책</li>
                <li>개인정보에 대한 접근 제한</li>
                <li>개인정보를 취급하는 직원의 최소화 및 교육</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">8. 쿠키의 사용</h2>
              <p className="mt-2 text-muted-foreground">
                회사는 서비스 제공을 위해 쿠키를 사용합니다. 쿠키는 로그인 상태
                유지 및 서비스 이용 편의를 위해 사용되며, 이용자는 브라우저
                설정을 통해 쿠키 저장을 거부할 수 있습니다.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">9. 개인정보 보호책임자</h2>
              <p className="mt-2 text-muted-foreground">
                개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와
                관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이
                개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-muted-foreground">
                <p>
                  <strong>개인정보 보호책임자</strong>
                </p>
                <p>이메일: privacy@autopsy-agent.com</p>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">
                10. 개인정보처리방침의 변경
              </h2>
              <p className="mt-2 text-muted-foreground">
                이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른
                변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행
                7일 전부터 공지사항을 통하여 고지할 것입니다.
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
          <p>&copy; 2024 Autopsy Agent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
