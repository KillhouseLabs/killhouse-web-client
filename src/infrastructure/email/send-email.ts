const RESET_PASSWORD_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${RESET_PASSWORD_BASE_URL}/reset-password?token=${token}`;

  // TODO: 실제 이메일 서비스 연동 (Resend, AWS SES 등)
  // 현재는 개발 환경에서 콘솔 출력으로 대체
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] Password reset email to: ${email}`);
    console.log(`[DEV] Reset URL: ${resetUrl}`);
    return;
  }

  // Production: 이메일 서비스 API 호출
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "noreply@killhouse.io",
      to: email,
      subject: "[Killhouse] 비밀번호 재설정",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>비밀번호 재설정</h2>
          <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요.</p>
          <p>이 링크는 1시간 동안 유효합니다.</p>
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px;">
            비밀번호 재설정
          </a>
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email send failed: ${response.statusText}`);
  }
}
