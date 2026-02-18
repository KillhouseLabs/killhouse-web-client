/**
 * PasswordInput Component Tests
 *
 * 비밀번호 입력 필드의 미리보기(표시/숨기기) 토글 기능 테스트
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordInput } from "@/components/ui/password-input";

describe("PasswordInput", () => {
  describe("렌더링", () => {
    it("GIVEN PasswordInput 컴포넌트 WHEN 렌더링 THEN 비밀번호 입력 필드가 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(
        <div>
          <label htmlFor="password">비밀번호</label>
          <PasswordInput id="password" />
        </div>
      );

      // THEN
      const input = screen.getByLabelText("비밀번호");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "password");
    });

    it("GIVEN placeholder prop WHEN 렌더링 THEN placeholder가 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<PasswordInput id="password" placeholder="비밀번호를 입력하세요" />);

      // THEN
      expect(
        screen.getByPlaceholderText("비밀번호를 입력하세요")
      ).toBeInTheDocument();
    });

    it("GIVEN 토글 버튼 WHEN 렌더링 THEN 비밀번호 보기 버튼이 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<PasswordInput id="password" />);

      // THEN
      expect(
        screen.getByRole("button", { name: "비밀번호 보기" })
      ).toBeInTheDocument();
    });

    it("GIVEN disabled prop WHEN 렌더링 THEN 입력 필드가 비활성화되어야 한다", () => {
      // GIVEN & WHEN
      render(
        <div>
          <label htmlFor="password">비밀번호</label>
          <PasswordInput id="password" disabled />
        </div>
      );

      // THEN
      expect(screen.getByLabelText("비밀번호")).toBeDisabled();
    });
  });

  describe("비밀번호 토글", () => {
    it("GIVEN 비밀번호 숨김 상태 WHEN 토글 버튼 클릭 THEN 비밀번호가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<PasswordInput id="password" value="secret123" onChange={() => {}} />);
      const toggleButton = screen.getByRole("button", { name: "비밀번호 보기" });

      // WHEN
      await user.click(toggleButton);

      // THEN
      const input = screen.getByDisplayValue("secret123");
      expect(input).toHaveAttribute("type", "text");
    });

    it("GIVEN 비밀번호 표시 상태 WHEN 토글 버튼 다시 클릭 THEN 비밀번호가 숨겨져야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<PasswordInput id="password" value="secret123" onChange={() => {}} />);
      const toggleButton = screen.getByRole("button", { name: "비밀번호 보기" });

      // WHEN - 두 번 클릭
      await user.click(toggleButton);
      await user.click(screen.getByRole("button", { name: "비밀번호 숨기기" }));

      // THEN
      const input = screen.getByDisplayValue("secret123");
      expect(input).toHaveAttribute("type", "password");
    });

    it("GIVEN 비밀번호 표시 상태 WHEN 토글 THEN 버튼 라벨이 변경되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<PasswordInput id="password" />);

      // WHEN
      await user.click(screen.getByRole("button", { name: "비밀번호 보기" }));

      // THEN
      expect(
        screen.getByRole("button", { name: "비밀번호 숨기기" })
      ).toBeInTheDocument();
    });
  });

  describe("값 입력", () => {
    it("GIVEN onChange 핸들러 WHEN 비밀번호 입력 THEN onChange가 호출되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(
        <div>
          <label htmlFor="pw">비밀번호</label>
          <PasswordInput id="pw" value="" onChange={handleChange} />
        </div>
      );

      // WHEN
      await user.type(screen.getByLabelText("비밀번호"), "test");

      // THEN
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("접근성", () => {
    it("GIVEN PasswordInput WHEN label과 함께 사용 THEN label로 접근 가능해야 한다", () => {
      // GIVEN & WHEN
      render(
        <div>
          <label htmlFor="pw">비밀번호</label>
          <PasswordInput id="pw" />
        </div>
      );

      // THEN
      expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    });

    it("GIVEN 토글 버튼 WHEN 렌더링 THEN form submit을 트리거하지 않아야 한다", () => {
      // GIVEN & WHEN
      render(<PasswordInput id="password" />);
      const toggleButton = screen.getByRole("button", { name: "비밀번호 보기" });

      // THEN
      expect(toggleButton).toHaveAttribute("type", "button");
    });

    it("GIVEN 토글 버튼 WHEN 렌더링 THEN 탭 순서에서 제외되어야 한다", () => {
      // GIVEN & WHEN
      render(<PasswordInput id="password" />);
      const toggleButton = screen.getByRole("button", { name: "비밀번호 보기" });

      // THEN
      expect(toggleButton).toHaveAttribute("tabIndex", "-1");
    });
  });
});
