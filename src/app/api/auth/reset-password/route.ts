import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/domains/auth/dto/auth.dto";
import { resetPassword } from "@/domains/auth/usecase/reset-password.usecase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;
    const result = await resetPassword(token, password);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "비밀번호가 변경되었습니다",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "비밀번호 재설정 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
