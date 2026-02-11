"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function DeleteAccountButton() {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "계정 삭제에 실패했습니다");
        setIsDeleting(false);
        return;
      }

      // Sign out and redirect to home
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("계정 삭제 중 오류가 발생했습니다");
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
    setError("");
  };

  return (
    <div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {isConfirming ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {isDeleting ? "삭제 중..." : "정말 삭제합니다"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isDeleting}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            취소
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          계정 삭제
        </button>
      )}
    </div>
  );
}
