/**
 * CreateProjectForm Component Tests
 *
 * 프로젝트 생성 폼 UI 및 인터랙션 테스트
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

describe("CreateProjectForm", () => {
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
      expect(screen.getByText("코드 분석")).toBeInTheDocument();
      expect(screen.getByText("컨테이너 스캔")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "프로젝트 생성" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
    });

    it("GIVEN 프로젝트 생성 페이지 WHEN 컴포넌트 렌더링 THEN CODE 타입이 기본 선택되어야 한다", () => {
      // GIVEN & WHEN
      render(<CreateProjectForm />);

      // THEN
      const codeButton = screen.getByText("코드 분석").closest("button");
      expect(codeButton).toHaveClass("border-primary");
    });
  });

  describe("타입 선택", () => {
    it("GIVEN CODE 타입 선택됨 WHEN CONTAINER 클릭 THEN CONTAINER가 선택되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<CreateProjectForm />);

      // WHEN
      await user.click(screen.getByText("컨테이너 스캔"));

      // THEN
      const containerButton = screen.getByText("컨테이너 스캔").closest("button");
      expect(containerButton).toHaveClass("border-primary");
    });
  });

  describe("입력 검증", () => {
    it("GIVEN 빈 이름 WHEN 생성 버튼 클릭 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<CreateProjectForm />);

      // WHEN
      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("프로젝트 이름을 입력하세요")
        ).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("프로젝트 생성", () => {
    it("GIVEN 유효한 입력 WHEN 생성 버튼 클릭 THEN API가 호출되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: "new-project-id", name: "New Project" },
          }),
      });
      render(<CreateProjectForm />);

      // WHEN
      await user.type(
        screen.getByLabelText(/프로젝트 이름/),
        "New Project"
      );
      await user.type(screen.getByLabelText(/설명/), "Project description");
      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "New Project",
            description: "Project description",
            type: "CODE",
          }),
        });
      });
    });

    it("GIVEN 생성 성공 WHEN API 응답 성공 THEN 프로젝트 상세 페이지로 이동해야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: "new-project-id", name: "New Project" },
          }),
      });
      render(<CreateProjectForm />);

      // WHEN
      await user.type(
        screen.getByLabelText(/프로젝트 이름/),
        "New Project"
      );
      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/projects/new-project-id");
      });
    });

    it("GIVEN CONTAINER 타입 선택 WHEN 생성 THEN type이 CONTAINER로 전송되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: "new-project-id", name: "Container Project" },
          }),
      });
      render(<CreateProjectForm />);

      // WHEN
      await user.type(
        screen.getByLabelText(/프로젝트 이름/),
        "Container Project"
      );
      await user.click(screen.getByText("컨테이너 스캔"));
      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/projects",
          expect.objectContaining({
            body: expect.stringContaining('"type":"CONTAINER"'),
          })
        );
      });
    });

    it("GIVEN API 에러 WHEN 생성 실패 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
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
      await user.type(
        screen.getByLabelText(/프로젝트 이름/),
        "New Project"
      );
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
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true, data: {} }),
                }),
              1000
            )
          )
      );
      render(<CreateProjectForm />);

      // WHEN
      await user.type(
        screen.getByLabelText(/프로젝트 이름/),
        "New Project"
      );
      await user.click(screen.getByRole("button", { name: "프로젝트 생성" }));

      // THEN
      await waitFor(() => {
        expect(screen.getByText("생성 중...")).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "생성 중..." })).toBeDisabled();
    });
  });
});
