// 햄스터 오프라인 진행, 한국 날짜 경계, 정원 잡초 생성을 검증한다.
import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateHamsterTick,
  koreaDateKey,
  msUntilKoreaMidnight,
  shouldGrowWeed,
  MAX_OFFLINE_MS,
  WEED_INTERVAL_MS,
} from "./balance";

const base = { hunger: 80, thirst: 80, cleanliness: 80, mood: 80, stamina: 50 };

test("한 시간 경과 상태를 계산한다", () => {
  const result = calculateHamsterTick(base, 3_600_000);
  assert.equal(result.hunger, 68);
  assert.equal(result.thirst, 63);
  assert.equal(result.cleanliness, 76);
  assert.equal(result.stamina, 60);
  assert.equal(result.shouldSleep, true);
});

test("오프라인 계산은 3일을 넘지 않는다", () => {
  assert.deepEqual(
    calculateHamsterTick(base, MAX_OFFLINE_MS * 10),
    calculateHamsterTick(base, MAX_OFFLINE_MS),
  );
});

test("한국 자정 기준 날짜를 반환한다", () => {
  assert.equal(koreaDateKey(new Date("2026-08-01T15:30:00.000Z")), "2026-08-02");
});

test("한국 자정까지 남은 시간을 계산한다", () => {
  // 15:00Z = 한국 자정 정각이라 꼬박 하루가 남는다.
  assert.equal(msUntilKoreaMidnight(new Date("2026-08-01T15:00:00.000Z")), 24 * 60 * 60 * 1000);
  // 14:00Z = 한국 23시라 1시간 남는다.
  assert.equal(msUntilKoreaMidnight(new Date("2026-08-01T14:00:00.000Z")), 60 * 60 * 1000);
});

test("기준 시각부터 잡초 주기가 지나야 잡초가 생긴다", () => {
  const from = new Date("2026-08-01T00:00:00.000Z");
  assert.equal(shouldGrowWeed(from, from.getTime() + WEED_INTERVAL_MS - 1), false);
  assert.equal(shouldGrowWeed(from, from.getTime() + WEED_INTERVAL_MS), true);
});

test("기준 시각이 없으면 잡초가 생기지 않는다", () => {
  assert.equal(shouldGrowWeed(null, Date.now()), false);
});
