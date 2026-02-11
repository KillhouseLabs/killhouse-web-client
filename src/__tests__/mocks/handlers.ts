import { http, HttpResponse } from "msw";

// Mock data
export const mockProjects = [
  {
    id: "project-1",
    name: "Test Project 1",
    description: "Test description 1",
    type: "CODE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { analyses: 3 },
  },
  {
    id: "project-2",
    name: "Test Project 2",
    description: null,
    type: "CONTAINER",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { analyses: 0 },
  },
];

export const mockDashboardStats = {
  totalProjects: 2,
  completedAnalyses: 5,
  totalVulnerabilities: 12,
  criticalVulnerabilities: 2,
  recentActivities: [
    {
      id: "analysis-1",
      projectName: "Test Project 1",
      projectType: "CODE",
      status: "COMPLETED",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      vulnerabilitiesFound: 5,
    },
  ],
};

export const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  image: null,
};

// API handlers
export const handlers = [
  // Projects API
  http.get("/api/projects", () => {
    return HttpResponse.json({
      success: true,
      data: mockProjects,
    });
  }),

  http.post("/api/projects", async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      description?: string;
      type: string;
    };
    return HttpResponse.json(
      {
        success: true,
        data: {
          id: "new-project-id",
          name: body.name,
          description: body.description || null,
          type: body.type,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  http.get("/api/projects/:id", ({ params }) => {
    const project = mockProjects.find((p) => p.id === params.id);
    if (!project) {
      return HttpResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: { ...project, analyses: [] },
    });
  }),

  http.patch("/api/projects/:id", async ({ params, request }) => {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
    };
    const project = mockProjects.find((p) => p.id === params.id);
    if (!project) {
      return HttpResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: { ...project, ...body },
    });
  }),

  http.delete("/api/projects/:id", ({ params }) => {
    const project = mockProjects.find((p) => p.id === params.id);
    if (!project) {
      return HttpResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      success: true,
      message: "프로젝트가 삭제되었습니다",
    });
  }),

  // Dashboard API
  http.get("/api/dashboard/stats", () => {
    return HttpResponse.json({
      success: true,
      data: mockDashboardStats,
    });
  }),

  // Auth API
  http.post("/api/auth/signup", async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      name?: string;
    };

    if (!body.email || !body.password) {
      return HttpResponse.json(
        { success: false, error: "이메일과 비밀번호를 입력하세요" },
        { status: 400 }
      );
    }

    if (body.email === "existing@example.com") {
      return HttpResponse.json(
        { success: false, error: "이미 등록된 이메일입니다" },
        { status: 409 }
      );
    }

    return HttpResponse.json(
      {
        success: true,
        data: {
          id: "new-user-id",
          email: body.email,
          name: body.name || null,
        },
      },
      { status: 201 }
    );
  }),

  // User delete API
  http.delete("/api/user/delete", () => {
    return HttpResponse.json({
      success: true,
      message: "계정이 삭제되었습니다",
    });
  }),
];
