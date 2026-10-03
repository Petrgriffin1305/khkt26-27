import http from "k6/http";
import { check, sleep } from "k6";
// Use multiple staging-user tokens to respect the per-user API rate limits.
const tokens = JSON.parse(__ENV.API_TOKENS ?? "[]");
const base = __ENV.API_URL ?? "http://localhost:3000/api/v1";
export const options = {
  vus: Number(__ENV.VUS ?? 5),
  duration: __ENV.DURATION ?? "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};
export default function () {
  if (!tokens.length)
    throw new Error("API_TOKENS must contain staging access tokens");
  const token = tokens[(__VU - 1) % tokens.length];
  const response = http.get(`${base}/sessions/stats?period=week`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(response, { "stats returned": (r) => r.status === 200 });
  sleep(1);
}
