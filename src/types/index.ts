/**
 * Common types used throughout the application
 */

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectType = "code" | "container";

export type ProjectStatus = "active" | "archived" | "deleted";

// Analysis types
export interface Analysis {
  id: string;
  projectId: string;
  status: AnalysisStatus;
  startedAt: Date;
  completedAt?: Date;
  report?: AnalysisReport;
}

export type AnalysisStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface AnalysisReport {
  summary: {
    totalVulnerabilities: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  vulnerabilities: Vulnerability[];
  generatedAt: Date;
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  cveId?: string;
  file?: string;
  line?: number;
  recommendation?: string;
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "past_due"
  | "unpaid"
  | "trialing";

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
