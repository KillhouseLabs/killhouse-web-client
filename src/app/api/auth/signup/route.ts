import { NextResponse } from "next/server";
import { signUpSchema } from "@/domains/auth/dto/auth.dto";
import { signUpUser } from "@/domains/auth/usecase/signup.usecase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = signUpSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    // Execute signup
    const result = await signUpUser(validationResult.data);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "회원가입이 완료되었습니다",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "회원가입 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
