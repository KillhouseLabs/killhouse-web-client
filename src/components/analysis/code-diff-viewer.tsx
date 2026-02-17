"use client";

import { useState } from "react";
import ReactDiffViewer from "react-diff-viewer-continued";

interface CodeDiffViewerProps {
  originalCode: string;
  fixedCode: string;
  filePath: string;
  startLine?: number;
  explanation: string;
}

export function CodeDiffViewer({
  originalCode,
  fixedCode,
  filePath,
  startLine = 1,
  explanation,
}: CodeDiffViewerProps) {
  const [splitView, setSplitView] = useState(false);

  return (
    <div className="space-y-3">
      {/* Explanation */}
      <div>
        <h4 className="mb-1 text-sm font-medium text-muted-foreground">
          수정 설명
        </h4>
        <p className="text-sm">{explanation}</p>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">
          코드 변경사항
        </h4>
        <div className="flex rounded-lg border border-border text-xs">
          <button
            onClick={() => setSplitView(false)}
            className={`px-3 py-1 transition-colors ${
              !splitView ? "bg-accent font-medium" : "hover:bg-accent/50"
            }`}
          >
            Unified
          </button>
          <button
            onClick={() => setSplitView(true)}
            className={`px-3 py-1 transition-colors ${
              splitView ? "bg-accent font-medium" : "hover:bg-accent/50"
            }`}
          >
            Split
          </button>
        </div>
      </div>

      {/* Diff Viewer */}
      <div className="overflow-hidden rounded-lg border border-border">
        <ReactDiffViewer
          oldValue={originalCode}
          newValue={fixedCode}
          splitView={splitView}
          linesOffset={startLine - 1}
          useDarkTheme={true}
          leftTitle="원본 코드"
          rightTitle="수정 코드"
          summary={filePath}
          showDiffOnly={false}
          styles={{
            contentText: {
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "12px",
              lineHeight: "1.5",
            },
          }}
        />
      </div>
    </div>
  );
}
