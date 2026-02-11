/**
 * Project DTO Validation Tests
 *
 * 프로젝트 생성/수정 시 입력 데이터 검증 테스트
 */

import {
  createProjectSchema,
  updateProjectSchema,
} from "@/domains/project/dto/project.dto";

describe("createProjectSchema", () => {
  describe("name 필드 검증", () => {
    it("GIVEN 빈 이름 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "",
        type: "CODE",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("프로젝트 이름을 입력하세요");
      }
    });

    it("GIVEN 100자 초과 이름 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "a".repeat(101),
        type: "CODE",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "프로젝트 이름은 100자 이하여야 합니다"
        );
      }
    });

    it("GIVEN 유효한 이름 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "My Test Project",
        type: "CODE",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });
  });

  describe("description 필드 검증", () => {
    it("GIVEN 500자 초과 설명 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        description: "a".repeat(501),
        type: "CODE",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "설명은 500자 이하여야 합니다"
        );
      }
    });

    it("GIVEN 설명 없음 WHEN 검증 THEN 성공해야 한다 (optional)", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        type: "CODE",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });

    it("GIVEN 유효한 설명 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        description: "This is a valid description",
        type: "CODE",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("This is a valid description");
      }
    });
  });

  describe("type 필드 검증", () => {
    it("GIVEN CODE 타입 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        type: "CODE",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("CODE");
      }
    });

    it("GIVEN CONTAINER 타입 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        type: "CONTAINER",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("CONTAINER");
      }
    });

    it("GIVEN 잘못된 타입 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        type: "INVALID",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 타입 없음 WHEN 검증 THEN CODE가 기본값이어야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("CODE");
      }
    });
  });
});

describe("updateProjectSchema", () => {
  describe("부분 업데이트 검증", () => {
    it("GIVEN 이름만 제공 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Updated Name",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Name");
        expect(result.data.description).toBeUndefined();
      }
    });

    it("GIVEN 설명만 제공 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        description: "Updated description",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Updated description");
      }
    });

    it("GIVEN 빈 객체 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {};

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });
  });

  describe("status 필드 검증", () => {
    it("GIVEN ACTIVE 상태 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        status: "ACTIVE",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("ACTIVE");
      }
    });

    it("GIVEN ARCHIVED 상태 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        status: "ARCHIVED",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("ARCHIVED");
      }
    });

    it("GIVEN 잘못된 상태 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        status: "INVALID",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });
  });
});
