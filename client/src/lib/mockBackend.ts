// 서버 없이 앱 전체 흐름을 확인하는 브라우저 목업 백엔드.
// 인증 세션과 게임 상태를 localStorage에 저장해 새로고침 후에도 유지한다.
import { ITEM_MASTERS, STARTER_ITEM_IDS } from "@shared/types/cage";
import type { CageItem, ItemId } from "@shared/types/cage";
import { HARVEST_REWARD } from "@shared/types/garden";
import { MISSIONS } from "@shared/types/mission";
import type { MissionId } from "@shared/types/mission";
import type { AuthResponse, LoginRequest, SignupRequest } from "@shared/types/auth";
import type { GameStateResponse } from "@shared/types/gameState";
import type {
  CreateHamsterRequest,
  HamsterAction,
  HamsterBehavior,
  IdleActivityItemId,
} from "@shared/types/hamster";

const SESSION_KEY = "siniham.mock.session";
const ACCOUNTS_KEY = "siniham.mock.accounts";
const STATE_PREFIX = "siniham.mock.state.";
const GROW_DURATION_MS = 10 * 60 * 1000;

type Accounts = Record<string, string>;

function accounts(): Accounts {
  const saved = localStorage.getItem(ACCOUNTS_KEY);
  return { ...(saved ? JSON.parse(saved) as Accounts : {}), tester: "1234" };
}

function saveAccounts(value: Accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(value));
}

function currentNickname(): string {
  const nickname = localStorage.getItem(SESSION_KEY);
  if (!nickname) throw new Error("로그인이 필요해요.");
  return nickname;
}

function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function missionResetInMs(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return ((23 - get("hour")) * 3600 + (59 - get("minute")) * 60 + (60 - get("second"))) * 1000;
}

function starterItem(itemId: ItemId, index: number): CageItem {
  const positions = [
    { x: 0.22, y: 0.76 },
    { x: 0.78, y: 0.67 },
    { x: 0.5, y: 0.55 },
    { x: 0.72, y: 0.7 },
    { x: 0.32, y: 0.72 },
  ];
  const position = positions[index] ?? { x: 0.5, y: 0.75 };
  return { id: `mock-${itemId.toLowerCase()}`, itemId, posX: position.x, posY: position.y, scale: 1, flipped: false };
}

function createInitialState(nickname: string): GameStateResponse {
  const now = Date.now();
  const ownedItemIds: ItemId[] = [...STARTER_ITEM_IDS, "WHEEL", "SAND_BATH"];
  return {
    currency: 500,
    seedCount: 6,
    missionResetInMs: missionResetInMs(),
    gardenSummary: null,
    ownedItemIds,
    cageItems: ownedItemIds.map(starterItem),
    gardenPlots: [
      { id: 0, status: "EMPTY", hasWeed: false, plantedAt: null },
      { id: 1, status: "GROWING", hasWeed: false, plantedAt: now - 3 * 60 * 1000 },
      { id: 2, status: "READY", hasWeed: false, plantedAt: now - GROW_DURATION_MS },
      { id: 3, status: "GROWING", hasWeed: true, plantedAt: now - 5 * 60 * 1000 },
    ],
    missionProgress: {
      FEED: { progress: 0, claimed: false },
      WATER: { progress: 0, claimed: false },
      PET: { progress: 0, claimed: false },
      GARDEN: { progress: 0, claimed: false },
    },
    discoveredBehaviors: {
      IDLE: today(),
      WALK: today(),
      EAT: today(),
      DRINK: today(),
      WASH: today(),
      SLEEP: today(),
    },
    hamster: {
      id: `mock-hamster-${nickname}`,
      name: nickname === "tester" ? "햄찌" : "몽글이",
      appearance: "GOLDEN",
      personality: "느긋함",
      stats: { hunger: 75, thirst: 75, cleanliness: 80, mood: 85, stamina: 90, intimacy: 30 },
      growthStage: "ADULT",
      state: "IDLE",
      displayScale: 1,
      createdAt: new Date().toISOString(),
    },
  };
}

function loadState(): GameStateResponse {
  const nickname = currentNickname();
  const key = `${STATE_PREFIX}${nickname}`;
  const saved = localStorage.getItem(key);
  const state = saved ? JSON.parse(saved) as GameStateResponse : createInitialState(nickname);
  let changed = !saved;
  for (const plot of state.gardenPlots) {
    if (plot.status === "GROWING" && plot.plantedAt && Date.now() - plot.plantedAt >= GROW_DURATION_MS) {
      plot.status = "READY";
      changed = true;
    }
  }
  state.missionResetInMs = missionResetInMs();
  if (changed) saveState(state);
  return structuredClone(state);
}

function saveState(state: GameStateResponse): GameStateResponse {
  state.missionResetInMs = missionResetInMs();
  localStorage.setItem(`${STATE_PREFIX}${currentNickname()}`, JSON.stringify(state));
  return structuredClone(state);
}

function changeStat(value: number, amount: number) {
  return Math.max(0, Math.min(100, value + amount));
}

function discover(state: GameStateResponse, behavior: HamsterBehavior) {
  state.discoveredBehaviors[behavior] ??= today();
}

function incrementMission(state: GameStateResponse, missionId: MissionId) {
  const mission = state.missionProgress[missionId];
  mission.progress = Math.min(MISSIONS[missionId].target, mission.progress + 1);
}

export async function mockLogin(data: LoginRequest): Promise<AuthResponse> {
  if (accounts()[data.nickname] !== data.password) {
    throw new Error("닉네임 또는 비밀번호가 일치하지 않습니다.");
  }
  localStorage.setItem(SESSION_KEY, data.nickname);
  return { user: { id: `mock-user-${data.nickname}`, nickname: data.nickname, currency: loadState().currency } };
}

export async function mockSignup(data: SignupRequest): Promise<AuthResponse> {
  const next = accounts();
  if (next[data.nickname]) throw new Error("이미 사용 중인 닉네임이에요.");
  next[data.nickname] = data.password;
  saveAccounts(next);
  localStorage.setItem(SESSION_KEY, data.nickname);
  return { user: { id: `mock-user-${data.nickname}`, nickname: data.nickname, currency: loadState().currency } };
}

export async function mockFetchMe(): Promise<AuthResponse> {
  const nickname = currentNickname();
  return { user: { id: `mock-user-${nickname}`, nickname, currency: loadState().currency } };
}

export async function mockLogout(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
}

export async function mockDeleteAccount(): Promise<void> {
  const nickname = currentNickname();
  const next = accounts();
  delete next[nickname];
  saveAccounts(next);
  localStorage.removeItem(`${STATE_PREFIX}${nickname}`);
  localStorage.removeItem(SESSION_KEY);
}

export async function mockFetchState() { return loadState(); }

export async function mockPurchaseItem(itemId: ItemId) {
  const state = loadState();
  const item = ITEM_MASTERS[itemId];
  if (!item.purchasable) throw new Error("구매할 수 없는 아이템입니다.");
  if (state.ownedItemIds.includes(itemId)) throw new Error("이미 보유한 아이템입니다.");
  if (state.currency < item.cost) throw new Error("재화가 조금 부족해요.");
  state.currency -= item.cost;
  state.ownedItemIds.push(itemId);
  state.cageItems.push(starterItem(itemId, state.cageItems.length));
  return saveState(state);
}

export async function mockPlantSeed(plotId: number) {
  const state = loadState();
  const plot = state.gardenPlots.find((item) => item.id === plotId);
  if (!plot || plot.status !== "EMPTY") throw new Error("심을 수 있는 밭이 아니에요.");
  if (state.seedCount < 1) throw new Error("심을 수 있는 씨앗이 없어요.");
  state.seedCount--;
  Object.assign(plot, { status: "GROWING", hasWeed: false, plantedAt: Date.now() });
  incrementMission(state, "GARDEN");
  discover(state, "GARDEN");
  return saveState(state);
}

export async function mockRemoveWeed(plotId: number) {
  const state = loadState();
  const plot = state.gardenPlots.find((item) => item.id === plotId);
  if (!plot?.hasWeed) throw new Error("제거할 잡초가 없어요.");
  plot.hasWeed = false;
  state.seedCount++;
  return saveState(state);
}

export async function mockHarvestPlot(plotId: number) {
  const state = loadState();
  const plot = state.gardenPlots.find((item) => item.id === plotId);
  if (!plot || plot.status !== "READY") throw new Error("수확할 수 있는 밭이 아니에요.");
  Object.assign(plot, { status: "EMPTY", hasWeed: false, plantedAt: null });
  state.currency += HARVEST_REWARD;
  return saveState(state);
}

export async function mockAckGardenSummary() {
  const state = loadState();
  state.gardenSummary = null;
  return saveState(state);
}

export async function mockClaimMissionReward(missionId: MissionId) {
  const state = loadState();
  const progress = state.missionProgress[missionId];
  if (progress.claimed || progress.progress < MISSIONS[missionId].target) throw new Error("아직 받을 수 없는 보상이에요.");
  progress.claimed = true;
  state.currency += MISSIONS[missionId].reward;
  return saveState(state);
}

export async function mockDiscoverBehavior(behavior: HamsterBehavior) {
  const state = loadState();
  discover(state, behavior);
  return saveState(state);
}

export async function mockCreateHamster(input: CreateHamsterRequest) {
  const state = loadState();
  state.hamster = {
    id: `mock-hamster-${currentNickname()}`,
    name: input.name,
    appearance: input.appearance,
    personality: "느긋함",
    stats: { hunger: 80, thirst: 80, cleanliness: 80, mood: 80, stamina: 100, intimacy: 0 },
    growthStage: "ADULT",
    state: "IDLE",
    displayScale: 1,
    createdAt: new Date().toISOString(),
  };
  return saveState(state);
}

export async function mockPerformHamsterAction(action: HamsterAction) {
  const state = loadState();
  const hamster = state.hamster;
  if (!hamster) throw new Error("먼저 햄스터를 만나 주세요.");
  const info: Record<HamsterAction, { behavior: HamsterBehavior; mission?: MissionId }> = {
    FEED: { behavior: "EAT", mission: "FEED" }, WATER: { behavior: "DRINK", mission: "WATER" },
    PET: { behavior: "PET", mission: "PET" }, WASH: { behavior: "WASH" }, SLEEP: { behavior: "SLEEP" },
  };
  if (action === "FEED") hamster.stats.hunger = changeStat(hamster.stats.hunger, 30);
  if (action === "WATER") hamster.stats.thirst = changeStat(hamster.stats.thirst, 30);
  if (action === "PET") {
    hamster.stats.mood = changeStat(hamster.stats.mood, 10);
    hamster.stats.intimacy = changeStat(hamster.stats.intimacy, 5);
  }
  if (action === "WASH") hamster.stats.cleanliness = changeStat(hamster.stats.cleanliness, 20);
  hamster.state = action === "SLEEP" ? "SLEEPING" : "IDLE";
  discover(state, info[action].behavior);
  if (info[action].mission) incrementMission(state, info[action].mission);
  return saveState(state);
}

export async function mockPerformIdleActivity(itemId: IdleActivityItemId) {
  const state = loadState();
  const hamster = state.hamster;
  if (!hamster) throw new Error("먼저 햄스터를 만나 주세요.");
  const effects: Record<IdleActivityItemId, { behavior: HamsterBehavior; mood?: number; stamina?: number; cleanliness?: number }> = {
    FOOD_BOWL: { behavior: "EAT", mood: 2 }, WATER_BOTTLE: { behavior: "DRINK" },
    HANDHELD_WATER_BOTTLE: { behavior: "DRINK" }, WATER_BOWL: { behavior: "DRINK" },
    WHEEL: { behavior: "WHEEL", mood: 6, stamina: -8 }, HOUSE: { behavior: "SLEEP", stamina: 8 },
    SAND_BATH: { behavior: "WASH", cleanliness: 8 }, SNACK_DISH: { behavior: "CHEEK", mood: 6 },
    LOOKOUT: { behavior: "LOOK", mood: 5 },
  };
  const effect = effects[itemId];
  hamster.stats.mood = changeStat(hamster.stats.mood, effect.mood ?? 0);
  hamster.stats.stamina = changeStat(hamster.stats.stamina, effect.stamina ?? 0);
  hamster.stats.cleanliness = changeStat(hamster.stats.cleanliness, effect.cleanliness ?? 0);
  if (itemId === "FOOD_BOWL") hamster.stats.hunger = changeStat(hamster.stats.hunger, 10);
  if (["WATER_BOTTLE", "HANDHELD_WATER_BOTTLE", "WATER_BOWL"].includes(itemId)) hamster.stats.thirst = changeStat(hamster.stats.thirst, 10);
  discover(state, effect.behavior);
  return saveState(state);
}

export async function mockMoveCageItem(itemId: string, posX: number, posY: number, scale?: number, flipped?: boolean) {
  const state = loadState();
  const item = state.cageItems.find((entry) => entry.id === itemId);
  if (!item) throw new Error("케이지에 없는 가구예요.");
  Object.assign(item, { posX, posY, ...(scale === undefined ? {} : { scale }), ...(flipped === undefined ? {} : { flipped }) });
  return saveState(state);
}

export async function mockStoreCageItem(itemId: string) {
  const state = loadState();
  state.cageItems = state.cageItems.filter((item) => item.id !== itemId);
  return saveState(state);
}

export async function mockPlaceCageItem(itemMasterId: ItemId) {
  const state = loadState();
  if (!state.ownedItemIds.includes(itemMasterId)) throw new Error("보유하지 않은 가구예요.");
  if (!state.cageItems.some((item) => item.itemId === itemMasterId)) state.cageItems.push(starterItem(itemMasterId, state.cageItems.length));
  return saveState(state);
}

export async function mockResizeHamster(scale: number) {
  const state = loadState();
  if (!state.hamster) throw new Error("먼저 햄스터를 만나 주세요.");
  state.hamster.displayScale = Math.max(0.7, Math.min(1.4, scale));
  return saveState(state);
}
