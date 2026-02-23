/**
 * CreateProjectForm Component Tests (Multi-Repository)
 *
 * 프로젝트 생성 폼 UI 및 인터랙션 테스트
 * - repositories 배열 지원
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectForm } from "@/components/project/create-project-form";

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe("CreateProjectForm (Multi-Repo)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe("렌더링", () => {
    it("GIVEN 프로젝트 생성 페이지 WHEN 컴포넌트 렌더링 THEN 모든 폼 요소가 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<CreateProjectForm />);

      // THEN
      expect(screen.getByLabelText(/프로젝트 이름/)).toBeInTheDocument();
      expect(screen.getByLabelText(/설명/)).toBeInTheDocument();
      expect(screen.getByText("GitHub")).toBeInTheDocument();
      expect(screen.getByText("GitLab")).toBeInTheDocument();
      expect(screen.getByText("수동 업로드")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "프로젝트 생성" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
    });

    it("GIVEN 프로젝트 생성 페이지 WHEN 컴포넌트 렌더링 THEN GitHub이 기본 선택되어야 한다", () => {
      // GIVEN & WHEN
      render(<CreateProjectForm />);

      // THEN
      const githubButton = screen.getByText("GitHub").closest("button");
      expect(githubButton).toHaveClass("border-primary");
    });

    it("GIVEN GitHub 선택됨 WHEN 컴포넌트 렌더링 THEN 저장소 선택 버튼이 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<CreateProjectForm />);

      // THEN
      expect(screen.getByText("저장소 검색 및 선택")).toBeInTheDocument();
    });

    it("GIVEN 프로젝트 생성 페이지 WHEN 컴포넌트 렌더링 THEN 분석 프로세스 설명이 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<CreateProjectForm />);

      // THEN
      expect(screen.getByText("분석 프로세스")).toBeInTheDocument();
      expect(screen.getByText("저장소 클론 및 코드 검색")).toBeInTheDocument();
      expect(screen.getByText("정적 코드 분석 (SAST)")).toBeInTheDocument();
      expect(
        screen.getByText("샌드박스 컨테이너 빌드 및 실행")
      ).toBeInTheDocument();
      expect(screen.getByText("모의 침투 테스트 수행")).toBeInTheDocument();
      expect(screen.getByText("취약점 리포트 생성")).toBeInTheDocument();
    });
  });

  describe("저장소 프로바이더 선택", () => {
    it("GIVEN GitHub 선택됨 WHEN GitLab 클릭 THEN GitLab이 선택되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<CreateProjectForm />);

      // WHEN
      await user.click(screen.getByText("GitLab"));

      // THEN
      const gitlabButton = screen.getByText("GitLab").closest("button");
      expect(gitlabButton).toHaveClass("border-primary");
    });

    it("GIVEN GitHub 선택됨 WHEN 수동 업로드 클릭 THEN 저장소 선택 버튼이 숨겨지고 업로드 폼이 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<CreateProjectForm />);

      // WHEN
      await user.click(screen.getByText("수동 업로드"));

      // THEN
      expect(screen.queryByText("저장소 검색 및 선택")).not.toBeInTheDocument();
      expect(
        screen.getByText("ZIP 파일을 드래그하거나 클릭하여 업로드")
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/저장소 이름/)).toBeInTheDocument();
    });
  });

  describe("입력 검증", () => {
    it("GIVEN 빈 이름 WHEN 생성 버튼 클릭 THEN HTML5 required 속성으로 인해 폼 제출이 방지되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<CreateProjectForm />);

      // WHEN
      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN - Form submission is prevented by HTML5 required attribute
      // The API should not be called since the form doesn't submit
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("GIVEN GitHub 선택 + 저장소 없음 WHEN 생성 버튼 클릭 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<CreateProjectForm />);

      // WHEN
      await user.type(screen.getByLabelText(/프로젝트 이름/), "Test Project");
      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN
      await waitFor(() => {
        expect(screen.getByText("저장소를 선택하세요")).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("프로젝트 생성", () => {
    it("GIVEN 수동 업로드 + 파일 첨부 WHEN 생성 THEN MANUAL 레포와 함께 전송 후 파일 업로드되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      const mockFile = new File(["PK\x03\x04content"], "my-app.zip", {
        type: "application/zip",
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                id: "new-project-id",
                name: "Manual Project",
                repositories: [{ id: "repo-1" }],
              },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: { uploadKey: "key" } }),
        });
      render(<CreateProjectForm />);

      // WHEN
      await user.type(screen.getByLabelText(/프로젝트 이름/), "Manual Project");
      await user.click(screen.getByText("수동 업로드"));

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await user.upload(fileInput, mockFile);

      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"provider":"MANUAL"'),
        });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/projects/new-project-id/repositories/repo-1/upload",
          expect.objectContaining({ method: "POST" })
        );
      });
    });

    it("GIVEN 수동 업로드 + 파일 없음 WHEN 생성 클릭 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<CreateProjectForm />);

      // WHEN
      await user.type(screen.getByLabelText(/프로젝트 이름/), "Manual Project");
      await user.click(screen.getByText("수동 업로드"));
      await user.type(screen.getByLabelText(/저장소 이름/), "my-app");
      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN
      await waitFor(() => {
        expect(screen.getByText("ZIP 파일을 업로드하세요")).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("GIVEN 생성 성공 WHEN API 응답 성공 THEN 프로젝트 상세 페이지로 이동해야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      const mockFile = new File(["PK\x03\x04content"], "my-app.zip", {
        type: "application/zip",
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                id: "new-project-id",
                name: "New Project",
                repositories: [{ id: "repo-1" }],
              },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: { uploadKey: "key" } }),
        });
      render(<CreateProjectForm />);

      // WHEN
      await user.type(screen.getByLabelText(/프로젝트 이름/), "New Project");
      await user.click(screen.getByText("수동 업로드"));

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await user.upload(fileInput, mockFile);

      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/projects/new-project-id");
      });
    });

    it("GIVEN API 에러 WHEN 생성 실패 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      const mockFile = new File(["PK\x03\x04content"], "my-app.zip", {
        type: "application/zip",
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: "프로젝트 생성에 실패했습니다",
          }),
      });
      render(<CreateProjectForm />);

      // WHEN
      await user.type(screen.getByLabelText(/프로젝트 이름/), "New Project");
      await user.click(screen.getByText("수동 업로드"));

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await user.upload(fileInput, mockFile);

      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("프로젝트 생성에 실패했습니다")
        ).toBeInTheDocument();
      });
    });
  });

  describe("취소 버튼", () => {
    it("GIVEN 폼 작성 중 WHEN 취소 버튼 클릭 THEN 이전 페이지로 이동해야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<CreateProjectForm />);

      // WHEN
      await user.click(screen.getByRole("button", { name: "취소" }));

      // THEN
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("로딩 상태", () => {
    it("GIVEN 생성 진행 중 WHEN 로딩 상태 THEN 버튼이 비활성화되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      const mockFile = new File(["PK\x03\x04content"], "my-app.zip", {
        type: "application/zip",
      });

      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      success: true,
                      data: {
                        id: "p1",
                        repositories: [{ id: "r1" }],
                      },
                    }),
                }),
              1000
            )
          )
      );
      render(<CreateProjectForm />);

      // WHEN
      await user.type(screen.getByLabelText(/프로젝트 이름/), "New Project");
      await user.click(screen.getByText("수동 업로드"));

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await user.upload(fileInput, mockFile);

      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN
      await waitFor(() => {
        expect(screen.getByText("생성 중...")).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "생성 중..." })).toBeDisabled();
    });
  });
});
