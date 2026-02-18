import Link from "next/link";
import { APP_NAME, BUSINESS_INFO, LEGAL_ROUTES } from "@/config/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 text-sm text-muted-foreground md:grid-cols-2">
          {/* 사업자정보 */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              {BUSINESS_INFO.companyName}
            </p>
            <p>대표: {BUSINESS_INFO.representative}</p>
            <p>사업자등록번호: {BUSINESS_INFO.businessNumber}</p>
            <p>통신판매업 신고번호: {BUSINESS_INFO.ecommerceRegistration}</p>
            <p>{BUSINESS_INFO.address}</p>
            <p>
              이메일: {BUSINESS_INFO.email} | 전화: {BUSINESS_INFO.phone}
            </p>
          </div>

          {/* 법적 링크 및 저작권 */}
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="flex gap-6">
              <Link href={LEGAL_ROUTES.TERMS} className="hover:text-foreground">
                이용약관
              </Link>
              <Link
                href={LEGAL_ROUTES.PRIVACY}
                className="hover:text-foreground"
              >
                개인정보처리방침
              </Link>
            </div>
            <p>
              &copy; {currentYear} {APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
