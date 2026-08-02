# Checklist - 화면 우선 MVP 구현

기준 문서. [docs/specs/screen-design.md](docs/specs/screen-design.md) (11장 "화면 우선 개발 순서" 1~10단계를 기본 골격으로 삼되, 아래 진행 순서를 따른다)

방향 전환. Docker/WSL2 문제로 DB 연결이 막혀서, 실제 API 없이 목업 데이터 + localStorage로 1~9단계(전체 화면)를 먼저 완성하고 10단계에서 실제 API로 교체하기로 결정.

리스크 완화 장치. `shared/types/*`에 실제 API와 주고받을 타입을 미리 정의하고 목업 데이터가 그 타입을 그대로 따르게 한다. 나중에 로컬 상태를 API 호출로 바꿀 때 화면 컴포넌트는 거의 건드리지 않는 것이 목표.

## 진행 순서 (캐릭터 에셋 우선순위 재조정, 2026-08-01)

햄스터 스프라이트가 아직 골든 3포즈만 있어서, 캐릭터 의존도가 낮은 화면부터 먼저 만들기로 결정.

1. 3단계 - 공통 게임 레이아웃 (캐릭터 없음)
2. 8단계 - 상점 화면 (캐릭터 없음)
3. 설정 및 계정 화면 - 원래 10단계 목록에 없던 화면, 이번에 추가 (캐릭터 없음)
4. 9단계 중 미션 탭 (캐릭터 없음)
5. 7단계 - 정원 화면 (캐릭터 의존 낮음, 자리표시자로 진행)
6. 9단계 중 행동 도감 탭 (캐릭터 의존 낮음 - 미발견 상태는 스펙상 실루엣이라 원래 실제 그림 불필요)

**보류.** 온보딩(외형 선택 자체가 캐릭터 중심), 케이지 화면의 캐릭터 상호작용/애니메이션(4, 5, 6단계), 시작 화면의 캐릭터 연출. 골든 12포즈 + 나머지 색상이 어느 정도 채워지면 이어서 진행.

## 이전에 완료한 작업

- [x] npm workspace 스캐폴딩 (client / server / shared) - 커밋 e248503
- [x] 백엔드 인증 API 코드 (signup / login / logout / me) - DB 미연결로 대기 중
- [x] 1단계 디자인 시스템 (컬러 토큰, PixelButton, PixelCard, Modal, BottomSheet, LoadingHamster, Toast, StatusBar, BottomTabBar, SideMenu) - 커밋 ef77cc3
- [x] 캐릭터 타입/에셋 인프라 (`shared/types/hamster.ts`, `hamsterAssets.ts`, `HamsterSprite` 자동 폴백) - 커밋 b9a4873
- [x] 닉네임 + 비밀번호 목업 인증 (`tester`/`1234`), `AuthContext`, `ProtectedRoute`, AuthPage 재작업 - 커밋 9cb0a0d

미해결로 남겨둔 것 (2단계 나머지, 보류 그룹과 함께 나중에). StartPage 분리 여부, 로그인/회원가입 화면 분리 여부, 오류 상태 세분화, 온보딩 1/2단계, 로그인 성공 시 `/home` vs `/onboarding` 분기. 서버는 여전히 email 기준(10단계에서 닉네임으로 정정 필요).

---

## 1. 3단계 - 공통 게임 레이아웃

- [x] `GameStateContext` 최초 도입 - 재화만 우선(기본 100, localStorage 유지), 이후 단계에서 필드 확장
- [x] `GameShell` 레이아웃 - 상단 정보 영역(닉네임/재화/설정 버튼). 알림은 실제 알림 시스템이 생기는 단계에서 추가
- [x] PC 좌측 메뉴 (`md:` 이상, 1단계 `SideMenu` 재사용) / 모바일 하단 탭 (`md:` 미만, `BottomTabBar` 재사용) - Tailwind `md`(768px) 기준으로 분기, 정확한 기준 px는 설계서에 없어 임의 선택
- [x] React Router 중첩 라우트로 탭 전환 (`/home/cage`, `/home/garden`, `/home/shop`, `/home/collection`, `/home/settings`) - 설정은 탭이 아니라 상단 버튼으로 접근(설계서 4.1 다이어그램 기준)
- [x] 각 탭은 순서대로 채워질 때까지 임시 자리표시자 화면
- [x] 버그 수정. 설정 화면처럼 4탭에 없는 경로에서 좌측메뉴/하단탭이 "케이지"를 잘못 활성 표시하던 것 수정

검증. PC(1280px)/모바일(390px) 각각 케이지/정원/상점/설정 탭 전환 스크린샷, typecheck·build 통과

## 2. 8단계 - 상점 화면

- [x] `shared/types/cage.ts` - ItemId, ItemMasterInfo, CageItem 타입. ITEM_MASTERS 카탈로그(5종), STARTER_ITEM_IDS
- [x] ShopItemCard (쳇바퀴 100 / 터널 150, 먹이통·물통·집은 기본 지급이라 상점 목록에서 제외)
- [x] PurchaseModal (구매 확인 -> 재화 확인 -> 완료)
- [x] 재화 부족 안내 상태 ("재화가 조금 부족해요..." + 구매 버튼 비활성화)
- [x] `GameStateContext`에 `ownedItemIds`, `purchaseItem()` 추가 (재화는 1번 작업에서 이미 있음)

검증. 쳇바퀴(재화 100 정확히 소진) 구매 성공 -> "보유중" 표시, 터널(150) 구매 시도 -> 재화 부족 안내, Playwright 스크린샷 확인. typecheck·build 통과.

## 3. 설정 및 계정 화면 (신규 추가)

- [x] `Toggle` 공용 컴포넌트 신규 추가 (1단계에 없었음)
- [x] 닉네임 표시, 효과음/배경음/애니메이션 효과 감소 토글(localStorage 유지, 실제 오디오 시스템은 없음)
- [x] 로그아웃 - 확인 모달 추가 (기존 GameShell/HomePage에서는 확인 없이 즉시 실행했던 걸 정정, 설계서 2.4 "로그아웃 확인" 공통 모달 반영)
- [x] 회원 탈퇴 - 확인 모달, 확인 시 `GameStateContext` 초기화 + 로그아웃 (재화/보유아이템도 함께 리셋)
- [x] 이용약관, 개인정보처리방침, 버전 정보 (텍스트/자리표시자 수준)

버그 수정. `Toggle`을 `<label><button>` 구조로 만들었더니 라벨 텍스트를 클릭해도 안 눌림(label은 button을 자동 트리거하지 않음). 행 전체를 button 하나로 바꿔서 해결.

검증. 토글 클릭 반영, 로그아웃/회원탈퇴 확인 모달, 탈퇴 후 로그인 화면 복귀까지 Playwright 스크린샷. typecheck·build 통과.

## 4. 9단계 중 미션 탭

- [x] `shared/types/mission.ts` - MissionId, MissionInfo, MISSIONS 카탈로그(밥/물/애정표현/정원, product-plan.md 7장 수치 그대로)
- [x] MissionCard - 진행중/보상받기/완료 3가지 상태
- [x] `CollectionPage`에 "일일 미션" / "행동 도감" 상단 서브탭 구조 추가 (행동 도감 내용은 6번 작업에서 채움)
- [x] `GameStateContext`에 `missionProgress`, `claimMissionReward()` 추가. 보상받으면 재화 반영 + "완료" 도장으로 전환
- [ ] 자정 리셋 로직, 오늘 남은 미션 수/자정까지 남은 시간 표시 - 스킵함 (핵심 흐름 확인이 우선이라 후순위로 미룸)

임시 시연용 초기 진행도. 케이지/정원이 없어 실제 행동으로 진행도가 안 쌓여서, 4가지 상태(진행중/보상받기/완료 2종)를 한 화면에서 다 보여주려고 미션마다 다른 초기값을 넣어둠(밥 2/3, 물 1/1, 애정표현 0/3, 정원 1/1 완료). 실제 게임플레이를 반영한 값이 아님 - 케이지/정원 액션이 생기면 전부 0부터 시작하도록 정정 필요.

검증. 4가지 상태 스크린샷, "물 채우기" 보상받기 클릭 -> 재화 100->110 반영 + 완료 도장 전환 + 토스트 확인. typecheck·build 통과.

## 5. 7단계 - 정원 화면

- [x] `shared/types/garden.ts` - PlotStatus(EMPTY/GROWING/READY), GardenPlot 타입. "씨앗 심음"은 설계서의 밭 정보 패널 구성상 GROWING과 동일하게 취급, 잡초는 GROWING 상태의 부가 플래그(`hasWeed`)로 모델링
- [x] GardenPlotTile - 4개 밭, 상태별 라벨 + 잡초 표시, 선택 시 테두리 강조
- [x] GardenActionSheet - 밭 선택 -> 하단 정보 패널 (빈밭/성장중(+잡초)/수확가능 별 다른 내용)
- [x] 심기 -> 잡초제거 -> 수확 흐름 (`GameStateContext`에 `plantSeed`/`removeWeed`/`harvestPlot`/`tickGardenGrowth`) + Toast로 보상 안내. 햄스터는 `HamsterSprite` 자리표시자를 정적으로 배치(실제 이동 애니메이션은 케이지 단계로 미룸)
- [x] 오프라인 진행 요약 모달 - localStorage에 마지막으로 본 날짜 저장, 하루 1회만 노출. 문구는 설계서 예시 그대로 고정(실제 이벤트 로그가 없어 트리거 로직만 구현, 내용은 10단계에서 실제 데이터로 교체)
- [x] 목업 성장 타이머 - lazy-tick을 흉내내어 심은 지 10초(데모용, 실제 값 아님) 지나면 자동으로 수확 가능 상태로 전환. `MOCK_GROW_DURATION_MS`로 명시

임시 시연용 초기 정원 상태. 4개 밭을 각각 빈밭/성장중/수확가능/성장중+잡초로 시작해서 모든 상태를 한 화면에서 보여줌. 실제 플레이 값이 아님.

검증. 오프라인 요약 모달, 4가지 밭 상태, 잡초 제거(씨앗 +1), 수확(재화 +5, 밭이 빈 상태로), 심기(씨앗 소모, 성장중으로 전환)까지 Playwright 스크린샷. typecheck·build 통과.

검증. 밭 상태 전환(빈밭->심기->성장중->수확) 스크린샷 순회

## 6. 9단계 중 행동 도감 탭

- [x] `shared/types/behavior.ts` - BEHAVIOR_INFO 12종(이름/힌트/설명, product-plan.md 6장 + hamster-character-info.md 7장 기준)
- [x] BehaviorCard - 미발견(실루엣 "?" + 힌트)/발견(`HamsterSprite`로 실제 이미지 자동 표시 + 설명 + 발견일) 상태
- [x] `GameStateContext`에 `discoveredBehaviors`, `discoverBehavior()` 추가
- [x] DiscoveryModal - 새 행동 발견 알림. 케이지가 없어 트리거할 방법이 없어서 "테스트. 다음 미발견 행동 발견하기" 버튼으로 임시 확인 (케이지 완성되면 실제 행동 실행 시 자동 호출로 교체하고 이 버튼은 제거)

임시 시연용 초기값. IDLE/WALK/EAT 3개만 미리 발견된 상태로 시작(자주 볼 행동이라 가정), 나머지 9개는 미발견. 실제로는 전부 미발견 상태로 시작해야 함 - 10단계에서 정정.

검증. 실제 이미지 3개(가만히 있기/걷기/먹기) + 실루엣 9개 동시 표시, 테스트 버튼으로 발견 트리거 -> 발견 모달 -> 카드가 실루엣에서 실제 이미지로 전환까지 Playwright 스크린샷. typecheck·build 통과.

## 중간 통합 확인 (보류 그룹 시작 전)

- [x] 로그인 -> 케이지 -> 정원 -> 상점 -> 도감(미션/행동) -> 설정 -> 케이지, PC(1280px)·모바일(390px) 각각 한 세션 안에서 전체 순회
- [x] 콘솔 에러 확인 - 파비콘 404(무해) 외 없음
- [x] `npm run typecheck`, `npm run build -w client` 통과

캐릭터 에셋 없이 진행 가능한 6개 작업(공통 레이아웃/상점/설정/미션/정원/행동도감)이 모두 끝났다. 여기서부터는 온보딩/케이지/캐릭터 애니메이션(보류 그룹)이고, 골든 12포즈 + 다른 색상이 채워지는 대로 이어간다.

---

## 보류 - 캐릭터 에셋 준비되면 진행

### 2단계 나머지 - 온보딩
- [ ] StartPage, 온보딩 1/2단계, 로그인 성공 시 `/home` vs `/onboarding` 분기

### 4, 5, 6단계 - 케이지 화면
- [ ] CageStage(1000x700, 비율 좌표), 레이어 순서, 기본 가구 배치, 상태바, 액션 버튼
- [ ] 캐릭터 애니메이션(대기/걷기/쳐다보기/먹기/물마시기/잠자기/쓰다듬기), 좌우 반전
- [ ] 액션 -> 이동 -> 행동 -> 상태 변경, 꾸미기 모드, 배치 제한, 클릭 반응, 말풍선, 상세 정보 모달

## 10단계 - 실제 API 연결

순서. 인증 -> 사용자 정보 -> 햄스터 상태 -> 케이지 데이터 -> 햄스터 액션 -> 정원 -> 상점 -> 미션 -> 행동 도감.

- [x] Docker/WSL2 정상화 확인, `docker compose up -d`로 로컬 Postgres 기동, 루트 `.env` 생성
- [x] `prisma migrate dev --name init` 적용
- [x] User 모델 email -> nickname 전환 (`schema.prisma`, `shared/types/auth.ts`, `server/src/routes/auth.ts`)
- [x] 실제 회원가입 -> 로그인 -> 쿠키 인증(`/me`) curl로 확인. `tester`/`1234` 계정 DB에 실제로 존재함
- [x] `client/src/lib/api.ts` 복원 - 닉네임 기준으로 signup/login/logout/fetchMe
- [x] `AuthContext`를 실제 API로 전환 - 앱 시작 시 `/api/auth/me`로 세션 확인(`isLoading`), `login`/`signup`은 이제 에러를 던지고 서버 메시지를 그대로 화면에 표시, `logout`도 실제 쿠키 삭제 호출
- [x] `mockAuth.ts` 삭제 (더 이상 참조하는 곳 없음)
- [x] `ProtectedRoute`, `AuthPage`에 세션 확인 중 로딩 화면(`LoadingHamster`) 추가 - 로그인된 사용자가 새로고침할 때 로그인 폼이 잠깐 보이는 깜빡임 방지
- [x] `SettingsPage`의 로그아웃/탈퇴를 `await logout()`으로 정정 (기존엔 동기 호출이었음)
- [x] 실제 검증. 틀린 비밀번호 -> 서버 에러 메시지 표시 / 올바른 로그인 -> `/home` 이동 / 새로고침 -> 세션(httpOnly 쿠키) 유지 / 로그아웃 -> 쿠키 실제로 삭제(`document.cookie`로 접근 불가, `httpOnly: true` 확인) 전부 Playwright로 확인. typecheck·build 통과.

알아둘 것. `GameStateContext`의 재화(currency)는 여전히 별개의 로컬 목업이라 서버 `User.currency`와 연결 안 돼 있음(둘 다 100에서 시작해서 지금은 안 보이지만 상점에서 구매하면 바로 어긋남). "사용자 정보" 단계에서 정리 필요.

## 다음 - 사용자 정보, 햄스터 상태, 케이지 데이터, 햄스터 액션, 정원, 상점, 미션, 행동 도감 순서로 계속 진행
