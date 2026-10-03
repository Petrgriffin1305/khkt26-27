const buckets = [0.01, 0.05, 0.1, 0.5, 1, 5, 30, 120];
const escaped = (value: string) => JSON.stringify(value);
export class Metrics {
  private requests = new Map<string, number>();
  private durations: number[] = Array(buckets.length).fill(0);
  private count = 0;
  private sum = 0;
  private errors = 0;
  private quizCount = 0;
  private quizSum = 0;
  record(method: string, route: string, status: number, seconds: number) {
    const labels = `method=${escaped(method)},route=${escaped(route)},status=${escaped(String(status))}`;
    this.requests.set(labels, (this.requests.get(labels) ?? 0) + 1);
    this.count++;
    this.sum += seconds;
    if (status >= 500) this.errors++;
    buckets.forEach((limit, i) => {
      if (seconds <= limit) this.durations[i]++;
    });
  }
  recordQuiz(seconds: number) {
    this.quizCount++;
    this.quizSum += seconds;
  }
  render(activeSessions: number) {
    return (
      [
        "# TYPE http_requests_total counter",
        ...[...this.requests].map(
          ([labels, count]) => `http_requests_total{${labels}} ${count}`,
        ),
        "# TYPE http_request_duration_seconds histogram",
        ...buckets.map(
          (limit, i) =>
            `http_request_duration_seconds_bucket{le="${limit}"} ${this.durations[i]}`,
        ),
        `http_request_duration_seconds_bucket{le="+Inf"} ${this.count}`,
        `http_request_duration_seconds_sum ${this.sum}`,
        `http_request_duration_seconds_count ${this.count}`,
        "# TYPE error_rate gauge",
        `error_rate ${this.count ? this.errors / this.count : 0}`,
        "# TYPE active_sessions gauge",
        `active_sessions ${activeSessions}`,
        "# TYPE quiz_generation_duration_seconds summary",
        `quiz_generation_duration_seconds_sum ${this.quizSum}`,
        `quiz_generation_duration_seconds_count ${this.quizCount}`,
      ].join("\n") + "\n"
    );
  }
}
