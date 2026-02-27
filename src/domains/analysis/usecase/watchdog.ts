/**
 * Watchdog — 장시간 멈춘 분석을 자동 실패 처리
 *
 * 30분 이상 비터미널 상태에 머무른 분석을 FAILED로 전환하는 도메인 로직.
 */

import {
  isTerminalStatus,
  type AnalysisStatus,
} from "@/domains/analysis/model/analysis-state-machine";

const STUCK_THRESHOLD_MS = 30 * 60 * 1000;

interface AnalysisLike {
  id: string;
  status: string;
  startedAt: Date | string;
}

/**
 * 터미널이 아닌 상태에서 STUCK_THRESHOLD_MS 이상 경과한 분석 ID를 반환한다.
 */
export function findStuckAnalysisIds(
  analyses: AnalysisLike[],
  now: number = Date.now()
): string[] {
  return analyses
    .filter(
      (a) =>
        !isTerminalStatus(a.status as AnalysisStatus) &&
        now - new Date(a.startedAt).getTime() > STUCK_THRESHOLD_MS
    )
    .map((a) => a.id);
}
