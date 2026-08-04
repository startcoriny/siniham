// 시간 경과에 따른 햄스터 상태와 한국 날짜를 계산하는 순수 도메인 로직.
export const MAX_OFFLINE_MS = 3 * 24 * 60 * 60 * 1000;

export interface TickStats {
  hunger: number;
  thirst: number;
  cleanliness: number;
  mood: number;
  stamina: number;
}

function decreasePerHour(value: number, elapsedHours: number, amount: number) {
  return Math.max(0, Math.round(value - elapsedHours * amount));
}

export function calculateHamsterTick(stats: TickStats, elapsedMs: number) {
  const cappedMs = Math.max(0, Math.min(elapsedMs, MAX_OFFLINE_MS));
  const hours = cappedMs / 3_600_000;
  const hunger = decreasePerHour(stats.hunger, hours, 12.5);
  const thirst = decreasePerHour(stats.thirst, hours, 100 / 6);
  return {
    hunger,
    thirst,
    cleanliness: decreasePerHour(stats.cleanliness, hours, 100 / 24),
    mood: decreasePerHour(stats.mood, hours, hunger === 0 || thirst === 0 ? 8 : 2),
    stamina: Math.min(100, Math.round(stats.stamina + hours * 10)),
    shouldSleep: hours >= 0.5,
  };
}

export function koreaDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
}

// 다음 한국 자정까지 남은 시간(ms). 미션 탭의 남은 시간 표시와 같은 기준을 서버에서도 쓴다.
export function msUntilKoreaMidnight(now = new Date()): number {
  const dayMs = 24 * 60 * 60 * 1000;
  // Asia/Seoul은 서머타임이 없어 UTC+9 고정이라 오프셋을 더해 하루 경계를 계산할 수 있다.
  const seoulMs = now.getTime() + 9 * 60 * 60 * 1000;
  return dayMs - (((seoulMs % dayMs) + dayMs) % dayMs);
}

// 자리를 비운 것으로 보고 "정원 소식"을 모을 기준. 햄스터가 잠드는 기준(30분)과 맞춘다.
export const OFFLINE_SUMMARY_THRESHOLD_MS = 30 * 60 * 1000;

// product-plan.md 오프라인 진행 로직에 "잡초 생성"만 있고 주기 수치는 없어 임시로 정함.
// 성장(10분)의 절반이라 방치하면 수확 전에 한 번 잡초가 생긴다.
export const WEED_INTERVAL_MS = 5 * 60 * 1000;

// 심거나 잡초를 뽑은 시점(weedFrom) 이후 WEED_INTERVAL_MS가 지나면 잡초가 생긴다.
export function shouldGrowWeed(weedFrom: Date | null, now = Date.now()): boolean {
  if (!weedFrom) return false;
  return now - weedFrom.getTime() >= WEED_INTERVAL_MS;
}
