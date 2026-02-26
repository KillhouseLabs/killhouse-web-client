/**
 * Application-level constants
 *
 * 앱 메타데이터, 라우팅, 법적 표시사항 등 도메인에 속하지 않는 앱 설정.
 * 도메인 지식(플랜, 심각도, 환불정책)은 각 도메인 모델로 이동함:
 *   - PLANS, formatLimit, formatStorage, formatPrice → @/domains/subscription/model/plan
 *   - SEVERITY, Severity → @/domains/analysis/model/severity
 *   - REFUND_POLICY → @/domains/payment/model/refund-policy
 */

export const APP_NAME = "Killhouse";
export const APP_DESCRIPTION =
  "AI-powered security vulnerability analysis platform";

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  PROJECTS: "/projects",
  PROJECT_NEW: "/projects/new",
  MYPAGE: "/mypage",
  SUBSCRIPTION: "/subscription",
  PRICING: "/pricing",
} as const;

// API endpoints
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",
    LOGOUT: "/api/auth/logout",
    SESSION: "/api/auth/session",
  },
  USER: {
    PROFILE: "/api/user/profile",
    PASSWORD: "/api/user/password",
    DELETE: "/api/user/delete",
  },
  PROJECT: {
    LIST: "/api/projects",
    CREATE: "/api/projects",
    GET: (id: string) => `/api/projects/${id}`,
    UPDATE: (id: string) => `/api/projects/${id}`,
    DELETE: (id: string) => `/api/projects/${id}`,
  },
  ANALYSIS: {
    START: (projectId: string) => `/api/projects/${projectId}/analysis`,
    STATUS: (projectId: string, analysisId: string) =>
      `/api/projects/${projectId}/analysis/${analysisId}`,
    REPORT: (projectId: string, analysisId: string) =>
      `/api/projects/${projectId}/analysis/${analysisId}/report`,
  },
  SUBSCRIPTION: {
    CURRENT: "/api/subscription",
    CHECKOUT: "/api/subscription/checkout",
    PORTAL: "/api/subscription/portal",
    WEBHOOK: "/api/subscription/webhook",
  },
} as const;

// Business information (통신판매업 필수 표시사항)
export const BUSINESS_INFO = {
  companyName: "킬하우스",
  representative: "홍길동",
  businessNumber: "123-45-67890",
  ecommerceRegistration: "제2025-서울강남-00000호",
  address: "서울특별시 강남구 테헤란로 123, 4층",
  email: "support@killhouse.com",
  phone: "02-1234-5678",
} as const;

// Legal page routes
export const LEGAL_ROUTES = {
  TERMS: "/terms",
  PRIVACY: "/privacy",
} as const;
