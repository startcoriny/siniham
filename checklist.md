# Checklist — 0단계 스캐폴딩 + 1단계 인증 화면

DB(PostgreSQL)는 아직 준비되지 않아 이번 작업 범위에서는 화면과 코드까지만 만들고, 실제 회원가입/로그인 동작 검증은 DB 연결 후로 미룬다.

## 0단계 — 스캐폴딩

- [x] 루트 `package.json` (npm workspaces: client, server)
- [x] `client/` Vite + React + TypeScript + Tailwind 초기화
- [x] `server/` Express + TypeScript + Prisma 초기화 (tsx로 실행)
- [x] `shared/` 폴더 생성 (인증 요청/응답 공용 타입)
- [x] `@shared/*` 경로 별칭 — client(tsconfig + vite), server(tsconfig)
- [x] `docker-compose.yml` (로컬 개발용 Postgres — 지금은 실행하지 않음)
- [x] `server/.env.example`, 루트 `.env.example`
- [x] `npm install` 성공 (루트에서 전체 워크스페이스)
- [x] `npm run typecheck` 통과 (client + server)

## 1단계 — 인증 기반

### 백엔드
- [x] `prisma/schema.prisma` — User 모델만 (email, passwordHash, currency, lastActiveAt)
- [x] `npx prisma generate` 성공 (DB 연결 없이 클라이언트 타입 생성만 확인)
- [x] JWT 발급/검증 유틸 (`src/lib/jwt.ts`)
- [x] `POST /api/auth/signup`
- [x] `POST /api/auth/login`
- [x] `POST /api/auth/logout`
- [x] `GET /api/auth/me` (쿠키 검증 미들웨어)
- [x] 서버 부팅 확인 (`npx tsx src/index.ts`, `/api/health` 200 확인, `/api/auth/signup`은 DB 없어 500 — 라우팅까지는 정상)

### 프론트
- [x] React Router 설정 (`/` = AuthPage, `/home` = 임시 플레이스홀더)
- [x] `src/lib/api.ts` — fetch 래퍼, `credentials: 'include'`
- [x] 로그인/회원가입 화면 (기획서 화면 1, 한 화면에서 모드 전환)
- [x] `npm run build -w client` 성공
- [x] 브라우저에서 화면 렌더링 확인 (Playwright + 시스템 Chrome, 로그인·회원가입 모드 둘 다 스크린샷 확인)

## 이번 범위에서 하지 않은 것 (다음 단계로 이연)

- Postgres 실행, 마이그레이션(`prisma migrate`), 실제 회원가입/로그인 동작 검증
- 세션 유지(새로고침 시 로그인 상태 복원), 라우트 보호(ProtectedRoute)
- 온보딩/케이지 등 이후 화면 (2단계부터)
- 배포 관련 작업
