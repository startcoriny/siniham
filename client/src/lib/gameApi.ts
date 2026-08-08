// 서버 API와 같은 함수 형태를 유지하는 localStorage 목업 어댑터.
export {
  mockFetchState as fetchState,
  mockPurchaseItem as purchaseItem,
  mockPlantSeed as plantSeed,
  mockRemoveWeed as removeWeed,
  mockHarvestPlot as harvestPlot,
  mockAckGardenSummary as ackGardenSummary,
  mockClaimMissionReward as claimMissionReward,
  mockDiscoverBehavior as discoverBehavior,
  mockCreateHamster as createHamster,
  mockPerformHamsterAction as performHamsterAction,
  mockPerformIdleActivity as performIdleActivity,
  mockMoveCageItem as moveCageItem,
  mockStoreCageItem as storeCageItem,
  mockPlaceCageItem as placeCageItem,
  mockResizeHamster as resizeHamster,
} from "./mockBackend";
