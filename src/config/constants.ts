/**
 * Application constants
 */

export const APP_NAME = "Autopsy Agent";
export const APP_DESCRIPTION = "AI-powered vulnerability analysis platform";

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

// Subscription plans
export const PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    price: 0,
    limits: {
      projects: 3,
      analysisPerMonth: 10,
      storageMB: 100,
    },
  },
  PRO: {
    id: "pro",
    name: "Pro",
    price: 29000,
    limits: {
      projects: -1, // unlimited
      analysisPerMonth: 100,
      storageMB: 10240, // 10GB
    },
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    price: -1, // contact
    limits: {
      projects: -1,
      analysisPerMonth: -1,
      storageMB: -1,
    },
  },
} as const;

// Vulnerability severity levels
export const SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info",
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];
