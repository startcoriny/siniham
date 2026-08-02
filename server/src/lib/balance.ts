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
