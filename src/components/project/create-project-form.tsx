"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProjectType = "CODE" | "CONTAINER";

export function CreateProjectForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProjectType>("CODE");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("프로젝트 이름을 입력하세요");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "프로젝트 생성에 실패했습니다");
        return;
      }

      router.push(`/projects/${data.data.id}`);
      router.refresh();
    } catch {
      setError("프로젝트 생성 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          프로젝트 이름 <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome Project"
          className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          설명
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">프로젝트 유형</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setType("CODE")}
            disabled={isLoading}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
              type === "CODE"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-8 w-8 ${type === "CODE" ? "text-primary" : "text-muted-foreground"}`}
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span className="text-sm font-medium">코드 분석</span>
            <span className="text-xs text-muted-foreground">
              소스 코드 취약점 분석
            </span>
          </button>

          <button
            type="button"
            onClick={() => setType("CONTAINER")}
            disabled={isLoading}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
              type === "CONTAINER"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-8 w-8 ${type === "CONTAINER" ? "text-primary" : "text-muted-foreground"}`}
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span className="text-sm font-medium">컨테이너 스캔</span>
            <span className="text-xs text-muted-foreground">
              Docker 이미지 취약점 스캔
            </span>
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "생성 중..." : "프로젝트 생성"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
