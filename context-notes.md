# Context Notes

## 2026-08-01 (계속) - 화면 우선 전략으로 전환

Docker Desktop 설치는 했지만 WSL2가 안 깔려 있어서 DB 연결이 재부팅 전까지 막힘. 사용자 결정으로 전략을 바꿈. 인증/데이터를 전부 프론트 목업 + localStorage로 채우고 [docs/specs/screen-design.md](docs/specs/screen-design.md) 기준 화면 전부(1~9단계)를 먼저 완성한 뒤, 나중에 10단계에서 실제 API로 순서대로 교체.

리스크 완화 장치. `shared/types/*`에 실제 API와 주고받을 타입을 미리 정의하고 목업 데이터가 그 타입을 그대로 따르게 해서, 나중에 "로컬 상태 -> API 호출" 교체 시 화면 컴포넌트는 거의 안 건드리게 함.

캐릭터 아트 한계. 설계서 8장의 실제 픽셀 아트 스프라이트(48x48, 7색, 약 59프레임)는 제가 그릴 수 없음. 준비될 때까지 자리표시자로 진행하고, 5단계(애니메이션)부터는 자리표시자의 한계가 드러날 것.

설계서 핵심 수치.

- 케이지 스테이지 논리 크기 1000x700, 가구/햄스터 위치는 절대 픽셀이 아니라 0~1 비율(posX/posY)로 저장 - PC/모바일 공용
- 스프라이트 작업 크기 48x48px, 화면 표시는 96/144/192px 정수배, `image-rendering: pixelated`
- 컬러 팔레트. 배경 #FFF4DD, 카드 #FFF9EB, 메인브라운 #5A3928, 포인트핑크 #F28C9A, 포인트그린 #77A96B, 포인트옐로 #F5C451, 위험 #D86464
- PC 콘텐츠 최대폭 1200px, 좌측메뉴 180~220px / 모바일 하단탭 60~72px, 터치 최소 44px
- 상태 저장은 localStorage로 임시 구현 후 서버로 교체 예정

## 표기 관련

사용자 환경(Windows PowerShell)에서 유니코드 기호가 깨져 보인 적이 있어서(`wsl --status` 결과 한글이 깨짐), 이후 문서와 채팅 답변에서는 화살표(->) 등 특수기호 대신 일반 텍스트를 우선 사용.

## 2026-08-01 — 개발 순서 설계

풀스택을 기능 단위 수직 슬라이스로 진행하기로 결정. 슬라이스 안에서는 백엔드(모델+API) 먼저, 프론트 나중. 이유는 JWT 쿠키 인증과 lazy-tick 계산처럼 프론트가 흉내 내기 어려운 로직이 많아서, 목업을 만들었다가 실제 API에 맞춰 다시 고치는 비용을 피하기 위함.

슬라이스 순서. 인증 → 케이지 핵심 루프 → 정원 → 상점/가구 → 미션/도감 → 에셋 교체 → 배포. 케이지가 정원보다 먼저인 이유는 서비스 한 문장(케이지·햄스터 관찰)에 가장 가깝기 때문.

## 2026-08-01 — 개발 환경 구축

이 환경(Windows, VS Code 확장)에 Git, Node.js, Docker가 전부 설치되어 있지 않은 상태로 시작. Git과 Node.js는 winget으로 설치(가벼움, 재부팅 불필요). Docker Desktop은 WSL2 활성화·재부팅이 필요할 수 있어 사용자 확인 후 진행 여부 결정하기로 함.

- Git 2.55.0, Node.js v24.18.1(LTS) 설치 완료.
- Docker/PostgreSQL은 사용자가 "지금은 DB 없이 화면만" 선택. → 0~1단계는 DB 없이 코드와 화면까지만 만들고, 실제 회원가입/로그인 동작 검증은 DB 연결 이후로 미룸. 서버가 부팅되는지, 타입이 맞는지까지만 확인.

## Repository

- GitHub. https://github.com/startcoriny/siniham.git (연결 완료, main 브랜치)
- Notion Work Log 위치. `햄스터 키우기(시니햄) > 기록` (https://app.notion.com/p/3af9f20303a48062b290e3fc25c2ccf1)

## 결정 — 패키지 버전

package.json의 의존성 버전은 직접 하드코딩하지 않고 `npm install <pkg> -w <workspace>`로 설치해 npm이 현재 시점 최신 안정 버전을 resolve하도록 함. 모델의 기억에 의존한 버전 번호는 최신성이 보장되지 않기 때문.

## 알려진 이슈 — npm audit (react-router)

`react-router-dom` 7.18.2 설치 시 high severity 취약점 1건 발견. RSC(React Server Components) 모드의 CSRF 우회 이슈(GHSA-qwww-vcr4-c8h2). 이 프로젝트는 Vite SPA + 클라이언트 사이드 라우팅만 쓰고 RSC를 쓰지 않아 해당 사항 없음으로 판단해 지금은 그대로 둠. `npm audit fix --force`는 7.11.0으로 다운그레이드하는 breaking change라 임의로 적용하지 않음. 배포 전에 재확인 필요.

## 2026-08-01 — 0단계 스캐폴딩 + 1단계 인증 화면 구현 중 발견한 것

npm install로 최신 버전을 그대로 받았더니 기억(학습 시점) 기준과 다른 major 버전들이 깔렸다. 전부 실제 동작을 검증하며 맞춤.

- **Prisma 7.** 기본 generator가 `prisma-client`(ESM)로 바뀌었고 `output` 경로 명시가 필수. `datasource`에 `url = env(...)`를 안 쓰고 대신 `prisma.config.ts`에서 `datasource.url`로 읽음(`dotenv` 별도 설치 필요). 클라이언트 생성 방식도 바뀌어서 `new PrismaClient()` 단독 호출이 안 되고 `@prisma/adapter-pg`로 driver adapter를 넘겨야 함 (`new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`). `npx prisma init`이 `.claude/skills`, `.windsurf/skills`, `.agents/skills`, `skills-lock.json`까지 같이 만들어주는데, 이 프로젝트는 Claude 단독 진행이라 전부 삭제함.
- **TypeScript 7.** `tsconfig.json`의 `baseUrl`이 제거됨 (`TS5102`). `baseUrl` 없이 `paths`만 써도 tsconfig 파일 위치 기준으로 정상 동작.
- **Tailwind v4.** `tailwind.config.js` + `postcss.config.js` 조합 대신 `@tailwindcss/vite` 플러그인 + `src/index.css`에 `@import "tailwindcss";` 한 줄로 충분. `postcss`/`autoprefixer`는 이제 불필요해서 설치했다가 제거함.
- **tsx의 tsconfig paths 해석.** `@shared/*` 별칭이 `tsc --noEmit`뿐 아니라 `tsx` 런타임에서도 별도 설정 없이 그대로 해석됨. 실제로 서버를 띄우고 `/api/auth/signup`을 호출해 확인.

## 결정 — 브라우저 검증 방법

이 환경(Windows)에는 `chromium-cli`가 없어서 run 스킬의 fallback대로 Playwright를 직접 사용. 단, 브라우저 바이너리를 새로 받지 않고 시스템에 이미 설치된 Chrome을 `channel: "chrome"`으로 구동해 다운로드 비용을 없앰. Playwright는 프로젝트 저장소가 아니라 OS 임시 스크래치패드에만 설치해서 레포에 흔적을 남기지 않음. 스크린샷으로 로그인/회원가입 두 모드 렌더링을 눈으로 확인함.

## 결정 — shared 폴더

`shared/`는 npm workspace 패키지로 만들지 않음(package.json 없음). client/server 양쪽 tsconfig에 `@shared/*` 경로 별칭만 걸어서 참조. 지금 실제로 공유할 내용(인증 요청/응답 타입)이 생겼을 때만 파일을 추가함 — 당장 쓰이지 않는 타입은 미리 만들지 않음.
