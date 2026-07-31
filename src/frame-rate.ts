/** Rolling frame-rate measurement driven by animation-frame timestamps. */
export class FrameRateMonitor {
  private readonly timestamps: number[] = [];

  constructor(private readonly windowMs = 1000) {
    if (!Number.isFinite(windowMs) || windowMs <= 0) {
      throw new RangeError("3d-spinner: frame-rate window must be greater than zero.");
    }
  }

  /** Record one rendered frame. */
  record(now: number): void {
    this.timestamps.push(now);
    const cutoff = now - this.windowMs;
    while (this.timestamps.length > 1 && this.timestamps[0] < cutoff) this.timestamps.shift();
  }

  /** Current rolling frames per second, or `0` before two frames have been recorded. */
  getFrameRate(): number {
    const count = this.timestamps.length;
    if (count < 2) return 0;
    const elapsed = this.timestamps[count - 1] - this.timestamps[0];
    return elapsed > 0 ? ((count - 1) * 1000) / elapsed : 0;
  }
}
