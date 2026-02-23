import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ResourceUsageCard } from "../resource-usage-card";

const mockData = {
  planId: "free",
  planName: "Free",
  status: "ACTIVE",
  resources: [
    { label: "월간 분석", current: 7, limit: 10, unlimited: false },
    { label: "활성 스캔", current: 2, limit: 2, unlimited: false },
    { label: "활성 샌드박스", current: 0, limit: 1, unlimited: false },
  ],
};

const unlimitedData = {
  planId: "enterprise",
  planName: "Enterprise",
  status: "ACTIVE",
  resources: [
    { label: "월간 분석", current: 50, limit: -1, unlimited: true },
    { label: "활성 스캔", current: 3, limit: 10, unlimited: false },
    { label: "활성 샌드박스", current: 2, limit: 5, unlimited: false },
  ],
};

describe("ResourceUsageCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("리소스 사용량을 표시한다", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    render(<ResourceUsageCard projectId="test-project-1" />);

    await waitFor(() => {
      expect(screen.getByText("리소스 사용량")).toBeInTheDocument();
    });

    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("월간 분석")).toBeInTheDocument();
    expect(screen.getByText("7/10")).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();
  });

  it("한도 도달 시 경고 메시지를 표시한다", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    render(<ResourceUsageCard projectId="test-project-2" />);

    await waitFor(() => {
      expect(
        screen.getByText("한도에 도달했습니다. 플랜 업그레이드가 필요합니다.")
      ).toBeInTheDocument();
    });
  });

  it("무제한 플랜은 무제한 배지를 표시한다", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(unlimitedData),
    });

    render(<ResourceUsageCard projectId="test-project-3" />);

    await waitFor(() => {
      expect(screen.getByText("Enterprise")).toBeInTheDocument();
    });

    expect(screen.getByText("무제한")).toBeInTheDocument();
  });

  it("API 실패 시 아무것도 렌더링하지 않는다", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { container } = render(
      <ResourceUsageCard projectId="test-project-4" />
    );

    await waitFor(() => {
      // Loading state gone, no data rendered
      expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
    });

    expect(screen.queryByText("리소스 사용량")).not.toBeInTheDocument();
  });
});
