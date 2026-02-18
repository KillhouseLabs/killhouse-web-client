import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/domains/auth/dto/auth.dto";
import { requestPasswordReset } from "@/domains/auth/usecase/forgot-password.usecase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validationResult = forgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const result = await requestPasswordReset(validationResult.data.email);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "이메일을 확인해주세요",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "요청 처리 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
