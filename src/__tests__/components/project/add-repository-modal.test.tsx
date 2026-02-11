/**
 * AddRepositoryModal Component Tests
 *
 * 프로젝트에 저장소 추가 모달 테스트
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddRepositoryModal } from "@/components/project/add-repository-modal";

// Mock fetch
global.fetch = jest.fn();

describe("AddRepositoryModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("모달 표시", () => {
    it("GIVEN isOpen=true WHEN 렌더링 THEN 모달이 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="project-1"
        />
      );

      // THEN
      expect(screen.getByText("저장소 추가")).toBeInTheDocument();
    });

    it("GIVEN isOpen=false WHEN 렌더링 THEN 모달이 표시되지 않아야 한다", () => {
      // GIVEN & WHEN
      render(
        <AddRepositoryModal
          isOpen={false}
          onClose={jest.fn()}
          projectId="project-1"
        />
      );

      // THEN
      expect(screen.queryByText("저장소 추가")).not.toBeInTheDocument();
    });
  });

  describe("프로바이더 선택", () => {
    it("GIVEN 모달 열림 WHEN GitHub 선택 THEN GitHub이 선택되어야 한다", () => {
      // GIVEN
      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="project-1"
        />
      );

      // WHEN
      const githubButton = screen.getByRole("button", { name: /GitHub/i });
      fireEvent.click(githubButton);

      // THEN
      expect(githubButton).toHaveClass("border-primary");
    });

    it("GIVEN 모달 열림 WHEN GitLab 선택 THEN GitLab이 선택되어야 한다", () => {
      // GIVEN
      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="project-1"
        />
      );

      // WHEN
      const gitlabButton = screen.getByRole("button", { name: /GitLab/i });
      fireEvent.click(gitlabButton);

      // THEN
      expect(gitlabButton).toHaveClass("border-primary");
    });

    it("GIVEN 모달 열림 WHEN 수동 업로드 선택 THEN 수동 업로드가 선택되어야 한다", () => {
      // GIVEN
      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="project-1"
        />
      );

      // WHEN
      const manualButton = screen.getByRole("button", { name: /수동 업로드/i });
      fireEvent.click(manualButton);

      // THEN
      expect(manualButton).toHaveClass("border-primary");
    });
  });

  describe("폼 입력", () => {
    it("GIVEN 프로바이더 선택 WHEN 저장소 이름 입력 THEN 이름이 입력되어야 한다", () => {
      // GIVEN
      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="project-1"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /수동 업로드/i }));

      // WHEN
      const nameInput = screen.getByLabelText(/저장소 이름/i);
      fireEvent.change(nameInput, { target: { value: "my-repo" } });

      // THEN
      expect(nameInput).toHaveValue("my-repo");
    });

    it("GIVEN 프로바이더 선택 WHEN 역할 입력 THEN 역할이 입력되어야 한다", () => {
      // GIVEN
      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="project-1"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /수동 업로드/i }));

      // WHEN
      const roleInput = screen.getByLabelText(/역할/i);
      fireEvent.change(roleInput, { target: { value: "backend" } });

      // THEN
      expect(roleInput).toHaveValue("backend");
    });

    it("GIVEN 프로바이더 선택 WHEN Primary 체크 THEN Primary가 체크되어야 한다", () => {
      // GIVEN
      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="project-1"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /수동 업로드/i }));

      // WHEN
      const primaryCheckbox = screen.getByRole("checkbox", { name: /Primary/i });
      fireEvent.click(primaryCheckbox);

      // THEN
      expect(primaryCheckbox).toBeChecked();
    });
  });

  describe("저장소 추가", () => {
    it("GIVEN 유효한 폼 데이터 WHEN 추가 버튼 클릭 THEN API가 호출되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: "new-repo", name: "my-repo" },
          }),
      });
      const onSuccess = jest.fn();

      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="project-1"
          onSuccess={onSuccess}
        />
      );

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /수동 업로드/i }));
      fireEvent.change(screen.getByLabelText(/저장소 이름/i), {
        target: { value: "my-repo" },
      });
      fireEvent.click(screen.getByRole("button", { name: "추가" }));

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/projects/project-1/repositories",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
        );
      });
    });

    it("GIVEN API 성공 WHEN 저장소 추가 THEN onSuccess가 호출되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: "new-repo", name: "my-repo" },
          }),
      });
      const onSuccess = jest.fn();

      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="project-1"
          onSuccess={onSuccess}
        />
      );

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /수동 업로드/i }));
      fireEvent.change(screen.getByLabelText(/저장소 이름/i), {
        target: { value: "my-repo" },
      });
      fireEvent.click(screen.getByRole("button", { name: "추가" }));

      // THEN
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("GIVEN API 에러 WHEN 저장소 추가 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: "이미 등록된 저장소 URL입니다",
          }),
      });

      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="project-1"
        />
      );

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /수동 업로드/i }));
      fireEvent.change(screen.getByLabelText(/저장소 이름/i), {
        target: { value: "my-repo" },
      });
      fireEvent.click(screen.getByRole("button", { name: "추가" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("이미 등록된 저장소 URL입니다")
        ).toBeInTheDocument();
      });
    });
  });

  describe("모달 닫기", () => {
    it("GIVEN 모달 열림 WHEN 취소 버튼 클릭 THEN onClose가 호출되어야 한다", () => {
      // GIVEN
      const onClose = jest.fn();
      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={onClose}
          projectId="project-1"
        />
      );

      // WHEN
      const cancelButton = screen.getByRole("button", { name: "취소" });
      fireEvent.click(cancelButton);

      // THEN
      expect(onClose).toHaveBeenCalled();
    });

    it("GIVEN 모달 열림 WHEN 백드롭 클릭 THEN onClose가 호출되어야 한다", () => {
      // GIVEN
      const onClose = jest.fn();
      render(
        <AddRepositoryModal
          isOpen={true}
          onClose={onClose}
          projectId="project-1"
        />
      );

      // WHEN
      const backdrop = screen.getByTestId("modal-backdrop");
      fireEvent.click(backdrop);

      // THEN
      expect(onClose).toHaveBeenCalled();
    });
  });
});
