export interface AnalysisLogEntry {
  timestamp: string;
  step: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

export function parseAnalysisLogs(raw: string | null): AnalysisLogEntry[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function appendLog(
  existingLogs: string | null,
  entry: AnalysisLogEntry
): string {
  const logs = parseAnalysisLogs(existingLogs);
  logs.push(entry);
  return JSON.stringify(logs);
}

export function groupLogsByStep(
  logs: AnalysisLogEntry[]
): Map<string, AnalysisLogEntry[]> {
  const grouped = new Map<string, AnalysisLogEntry[]>();
  for (const log of logs) {
    const existing = grouped.get(log.step) || [];
    existing.push(log);
    grouped.set(log.step, existing);
  }
  return grouped;
}
