// 햄스터 오프라인 진행과 한국 날짜 경계를 검증한다.
import assert from "node:assert/strict";
import test from "node:test";
import { calculateHamsterTick, koreaDateKey, MAX_OFFLINE_MS } from "./balance";

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
