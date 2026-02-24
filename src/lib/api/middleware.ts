/**
 * API Middleware - HOF (Higher-Order Function) Wrapper Pattern
 *
 * 중앙화된 권한 검증 및 공통 기능을 위한 미들웨어 체인
 *
 * 사용 예시:
 * ```typescript
 * export const POST = withMiddleware(
 *   withAuth,
 *   withSubscriptionCheck("createProject")
 * )(async (request, context) => {
 *   // 인증 및 구독 검증이 완료된 상태
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  canCreateProject,
  canRunAnalysis,
} from "@/domains/subscription/usecase/subscription-limits";
import { prisma } from "@/infrastructure/database/prisma";
import type { Session } from "next-auth";

// ============================================================================
// Types
// ============================================================================

export interface BaseContext {
  // Next.js 15+ uses Promise<params> for dynamic routes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, string> | Promise<any>;
}

export interface AuthenticatedContext extends BaseContext {
  session: Session;
  userId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouteHandler<TContext = any> = (
  request: NextRequest,
  context: TContext
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => Promise<NextResponse<any>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MiddlewareFunction = (
  handler: RouteHandler<any>
) => RouteHandler<any>;

// 구독 검증 액션 타입
export type SubscriptionAction = "createProject" | "runAnalysis";

// ============================================================================
// Core Middleware Functions
// ============================================================================

/**
 * 인증 검증 미들웨어
 *
 * 세션을 확인하고 인증된 사용자 정보를 context에 추가
 */
export const withAuth: MiddlewareFunction = (handler) => {
  return async (request: NextRequest, context: BaseContext) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const authenticatedContext: AuthenticatedContext = {
      ...context,
      session,
      userId: session.user.id,
    };

    return handler(request, authenticatedContext);
  };
};

/**
 * 구독 제한 검증 미들웨어
 *
 * 특정 액션에 대한 구독 제한을 확인
 * - createProject: 프로젝트 생성 제한
 * - runAnalysis: 분석 실행 제한
 */
export function withSubscriptionCheck(
  action: SubscriptionAction
): MiddlewareFunction {
  return (handler) => {
    return async (request: NextRequest, context: AuthenticatedContext) => {
      const { userId } = context;

      let limitCheck;

      switch (action) {
        case "createProject":
          limitCheck = await canCreateProject(userId);
          break;
        case "runAnalysis":
          limitCheck = await canRunAnalysis(userId);
          break;
        default:
          return handler(request, context);
      }

      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: limitCheck.message,
            code: "LIMIT_EXCEEDED",
            usage: {
              current: limitCheck.currentCount,
              limit: limitCheck.limit,
            },
          },
          { status: 403 }
        );
      }

      return handler(request, context);
    };
  };
}

/**
 * 활성 구독 가드 미들웨어
 *
 * 구독이 ACTIVE 또는 TRIALING 상태인 경우 요청을 차단
 * 계정 삭제 전 구독 취소를 강제하기 위한 게이트웨이
 */
export const withActiveSubscriptionGuard: MiddlewareFunction = (handler) => {
  return async (request: NextRequest, context: AuthenticatedContext) => {
    const { userId } = context;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (subscription && ["ACTIVE", "TRIALING"].includes(subscription.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "활성 구독이 있습니다. 구독을 먼저 취소해주세요.",
          code: "ACTIVE_SUBSCRIPTION",
        },
        { status: 409 }
      );
    }

    return handler(request, context);
  };
};

/**
 * 에러 핸들링 미들웨어
 *
 * 예외를 캐치하고 일관된 에러 응답 형식으로 변환
 */
export const withErrorHandling: MiddlewareFunction = (handler) => {
  return async (request: NextRequest, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error("API Error:", error);

      if (error instanceof Error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: false, error: "서버 오류가 발생했습니다" },
        { status: 500 }
      );
    }
  };
};

// ============================================================================
// Middleware Composition Utilities
// ============================================================================

/**
 * 미들웨어 체인 생성 함수
 *
 * 여러 미들웨어를 순차적으로 적용
 *
 * @example
 * const handler = withMiddleware(
 *   withErrorHandling,
 *   withAuth,
 *   withSubscriptionCheck("createProject")
 * )(actualHandler);
 */
export function withMiddleware(
  ...middlewares: MiddlewareFunction[]
): (handler: RouteHandler<AuthenticatedContext>) => RouteHandler<BaseContext> {
  return (handler: RouteHandler<AuthenticatedContext>) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler as RouteHandler
    );
  };
}

/**
 * 함수형 파이프라인 (좌->우 순서로 적용)
 *
 * @example
 * const handler = pipe(
 *   withErrorHandling,
 *   withAuth,
 *   withSubscriptionCheck("createProject")
 * )(actualHandler);
 */
export function pipe(
  ...middlewares: MiddlewareFunction[]
): (handler: RouteHandler<AuthenticatedContext>) => RouteHandler<BaseContext> {
  return withMiddleware(...middlewares);
}

/**
 * 함수형 컴포즈 (우->좌 순서로 적용)
 *
 * @example
 * const handler = compose(
 *   withSubscriptionCheck("createProject"),
 *   withAuth,
 *   withErrorHandling
 * )(actualHandler);
 */
export function compose(
  ...middlewares: MiddlewareFunction[]
): (handler: RouteHandler<AuthenticatedContext>) => RouteHandler<BaseContext> {
  return withMiddleware(...middlewares.reverse());
}

// ============================================================================
// Preset Middleware Chains
// ============================================================================

/**
 * 인증된 API를 위한 프리셋
 *
 * - 에러 핸들링
 * - 인증 검증
 */
export const authenticatedHandler = withMiddleware(withErrorHandling, withAuth);

/**
 * 프로젝트 생성 API를 위한 프리셋
 *
 * - 에러 핸들링
 * - 인증 검증
 * - 프로젝트 생성 제한 확인
 */
export const projectCreationHandler = withMiddleware(
  withErrorHandling,
  withAuth,
  withSubscriptionCheck("createProject")
);

/**
 * 분석 실행 API를 위한 프리셋
 *
 * - 에러 핸들링
 * - 인증 검증
 * - 분석 실행 제한 확인
 */
export const analysisRunHandler = withMiddleware(
  withErrorHandling,
  withAuth,
  withSubscriptionCheck("runAnalysis")
);

/**
 * 계정 삭제 API를 위한 프리셋
 *
 * - 에러 핸들링
 * - 인증 검증
 * - 활성 구독 가드 (구독 취소 후에만 삭제 가능)
 */
export const accountDeletionHandler = withMiddleware(
  withErrorHandling,
  withAuth,
  withActiveSubscriptionGuard
);
