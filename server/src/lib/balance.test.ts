import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateHamsterTick,
  koreaDateKey,
  msUntilKoreaMidnight,
  shouldGrowWeed,
  weedCheckCount,
  MAX_OFFLINE_MS,
  WEED_IMMUNITY_MS,
  WEED_INTERVAL_MS,
} from "./balance";

const base = { hunger: 80, thirst: 80, cleanliness: 80, mood: 80, stamina: 50 };

test("시간 경과에 따른 햄스터 상태를 계산한다", () => {
  const result = calculateHamsterTick(base, 3_600_000);
  assert.equal(result.hunger, 68);
  assert.equal(result.thirst, 63);
  assert.equal(result.cleanliness, 76);
  assert.equal(result.stamina, 60);
  assert.equal(result.shouldSleep, true);
});

test("오프라인 계산은 3일을 넘지 않는다", () => {
  assert.deepEqual(calculateHamsterTick(base, MAX_OFFLINE_MS * 10), calculateHamsterTick(base, MAX_OFFLINE_MS));
});

test("한국 자정 기준 날짜를 반환한다", () => {
  assert.equal(koreaDateKey(new Date("2026-08-01T15:30:00.000Z")), "2026-08-02");
});

test("한국 자정까지 남은 시간을 계산한다", () => {
  assert.equal(msUntilKoreaMidnight(new Date("2026-08-01T15:00:00.000Z")), 24 * 60 * 60 * 1000);
  assert.equal(msUntilKoreaMidnight(new Date("2026-08-01T14:00:00.000Z")), 60 * 60 * 1000);
});

test("잡초 면역 시간이 끝난 뒤 3시간마다 판정 횟수가 증가한다", () => {
  const from = new Date("2026-08-01T00:00:00.000Z");
  assert.equal(weedCheckCount(from, from.getTime() + WEED_IMMUNITY_MS), 0);
  assert.equal(weedCheckCount(from, from.getTime() + WEED_IMMUNITY_MS + WEED_INTERVAL_MS), 1);
  assert.equal(weedCheckCount(from, from.getTime() + WEED_IMMUNITY_MS + WEED_INTERVAL_MS * 3), 3);
});

test("잡초 기준 시각이 없으면 판정하지 않는다", () => {
  assert.equal(weedCheckCount(null, Date.now()), 0);
});

test("여러 번 누적된 잡초 판정을 하나의 누적 확률로 계산한다", () => {
  assert.equal(shouldGrowWeed(1, 0.08, 0.079), true);
  assert.equal(shouldGrowWeed(1, 0.08, 0.08), false);
  assert.equal(shouldGrowWeed(2, 0.08, 0.15), true);
  assert.equal(shouldGrowWeed(0, 0.12, 0), false);
});
