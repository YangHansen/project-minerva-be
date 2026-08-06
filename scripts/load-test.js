import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Simulate 500 virtual users (VUs) continuously hitting the endpoint
  vus: 500,
  duration: '30s',
};

export default function () {
  // Hit a public endpoint to test global rate limiting and backend stability without requiring JWTs
  const res = http.get('http://localhost:3000/api/health');

  // We expect either 200 OK or 429 Too Many Requests (Rate Limit)
  // We want to verify it doesn't crash (500)
  check(res, {
    'is status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'not crashing (no 500s)': (r) => r.status !== 500 && r.status !== 502,
  });

  // Short sleep to simulate real-world rapid fire but allow for some context switching
  sleep(0.1);
}
