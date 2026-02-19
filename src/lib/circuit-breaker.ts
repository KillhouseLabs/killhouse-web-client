export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly threshold: number = 3,
    private readonly resetTimeMs: number = 300000
  ) {}

  canExecute(): boolean {
    if (this.state === "CLOSED" || this.state === "HALF_OPEN") {
      return true;
    }

    const elapsed = Date.now() - this.lastFailureTime;
    if (elapsed >= this.resetTimeMs) {
      this.state = "HALF_OPEN";
      return true;
    }

    return false;
  }

  onSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN" || this.failureCount >= this.threshold) {
      this.state = "OPEN";
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}
