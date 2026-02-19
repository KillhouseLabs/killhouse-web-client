import Link from "next/link";

export const metadata = {
  title: "이용약관 - Killhouse",
  description: "Killhouse 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">이용약관</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-muted-foreground">최종 수정일: 2025년 2월 18일</p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">제1조 (목적)</h2>
          <p className="mt-2 text-muted-foreground">
            본 약관은 Killhouse(이하 &quot;회사&quot;)가 제공하는 보안 분석
            서비스(이하 &quot;서비스&quot;)의 이용조건 및 절차, 회사와 이용자의
            권리, 의무 및 책임사항 등 기본적인 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">제2조 (용어의 정의)</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              &quot;서비스&quot;란 회사가 제공하는 소프트웨어 보안 취약점 분석
              및 모의 침투 테스트 서비스를 의미합니다.
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
            기반으로 한 이용자의 조치로 발생한 손해에 대해 책임을 지지 않습니다.
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
            회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내
            공지사항을 통해 공지합니다.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">제8조 (요금 및 결제)</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              서비스는 무료(Free), 프로(Pro), 엔터프라이즈(Enterprise) 플랜으로
              구분되며, 각 플랜의 기능과 이용 한도는 가격 페이지에 안내된 바를
              따릅니다.
            </li>
            <li>
              유료 플랜의 결제는 신용카드, 체크카드 등 회사가 지정한 결제수단을
              통해 이루어지며, PG사(PortOne)를 통해 안전하게 처리됩니다.
            </li>
            <li>
              유료 구독은 월 단위로 자동 갱신되며, 이용자가 해지하지 않는 한
              매월 동일한 금액이 결제됩니다.
            </li>
            <li>
              회사는 요금을 변경할 경우 변경일로부터 30일 전에 서비스 내
              공지사항 또는 이메일을 통해 고지합니다.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">제9조 (청약철회 및 환불)</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              이용자는 결제일로부터 7일 이내에 청약철회를 요청할 수 있으며, 이
              경우 결제 금액 전액을 환불받을 수 있습니다.
            </li>
            <li>
              결제일로부터 7일이 경과한 후에는 사용일수를 기준으로 일할계산하여
              남은 기간에 해당하는 금액을 환불합니다. 환불 금액은 100원 단위로
              절사됩니다.
            </li>
            <li>
              환불은 원래 결제수단으로 처리되며, 결제수단의 특성에 따라 환불
              완료까지 영업일 기준 3~7일이 소요될 수 있습니다.
            </li>
            <li>
              다음의 경우에는 환불이 제한될 수 있습니다:
              <ul className="mt-1 list-disc space-y-1 pl-6">
                <li>서비스를 이미 상당 부분 이용한 경우</li>
                <li>이용약관 위반으로 서비스가 제한된 경우</li>
                <li>구독 기간이 종료된 경우</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">제10조 (구독 해지)</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              이용자는 언제든지 구독을 해지할 수 있습니다. 해지는 서비스 내 구독
              관리 페이지에서 즉시 처리됩니다.
            </li>
            <li>
              구독 해지 시 현재 결제 기간이 종료될 때까지 서비스를 계속 이용할
              수 있으며, 다음 결제일에 자동 갱신이 중지됩니다.
            </li>
            <li>
              해지 후 이용자의 프로젝트 및 분석 데이터는 30일간 보관된 후
              삭제됩니다. 보관 기간 내에 구독을 재개하면 데이터가 복원됩니다.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            제11조 (서비스 변경 및 종료)
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              회사는 서비스의 내용을 변경할 수 있으며, 중요한 변경 사항은
              변경일로부터 30일 전에 서비스 내 공지사항을 통해 고지합니다.
            </li>
            <li>
              회사는 경영상의 사유로 서비스를 종료할 수 있으며, 이 경우
              종료일로부터 60일 전에 이용자에게 안내합니다.
            </li>
            <li>
              서비스 종료 시 유료 이용자에게는 남은 구독 기간에 대한 환불을
              제공합니다.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
