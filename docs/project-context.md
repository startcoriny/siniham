# Project Context

프로젝트를 시작하기 전에 반드시 확인해야 하는 프로젝트별 설정입니다.

기획 내용의 원본은 [product-plan.md](product-plan.md)입니다. 이 문서는 그중 개발 작업에 필요한 설정만 추린 것으로, 두 문서가 충돌하면 product-plan.md가 기준입니다.

`(미정)` 항목은 아직 결정되지 않았다는 뜻입니다. 임의로 가정하지 않고 사용자에게 확인합니다.

---

# Project Information

- Project: 시니햄 (햄스터 육성 게임. 대외 서비스명은 미정. 후보: 햄찌하우스 / 해미홈 / 햄스터 가든)
- Description: 여러 마리의 귀여운 햄스터를 돌보고 케이지를 꾸미며, 햄스터들의 다양한 행동을 관찰하는 웹 기반 힐링 육성 게임
- Repository: https://github.com/startcoriny/siniham.git
- Environment: 로컬 개발 → Oracle Cloud Always Free ARM VM 운영
- Team: 1인 개발
- Target: 실제 사용자에게 공개할 정식 서비스. 초기 지인 테스트 10~30명

---

# AI Configuration

이 프로젝트는 **Claude 단독**으로 진행합니다. 에이전트를 분리하지 않고 Claude가 아래 역할을 단계로 나누어 순차 수행합니다.

## Agent Roles

- Planning Agent: Claude Code (Planning)
- Implementation Agent: Claude Code (Implementation)
- Review Agent: Claude Code (Review)

## Agent Rules

- Planning Agent Rule: CLAUDE.md
- Implementation Agent Rule: CLAUDE.md
- Review Agent Rule: CLAUDE.md

## Work Log Tool

- Work Log Tool: Notion
- 기록 위치: `햄스터 키우기(시니햄) > 기록` 페이지의 자식 페이지로 생성
  https://app.notion.com/p/3af9f20303a48062b290e3fc25c2ccf1

---

# Technology Stack

- Language: TypeScript (프론트/백엔드 공통, 타입 공유)
- Framework: React (프론트엔드) / Express (백엔드)
- Runtime: Node.js
- Package Manager: npm (workspaces 사용)
- Database: PostgreSQL — Docker 컨테이너로 앱과 같은 서버에서 직접 관리
- ORM: Prisma
- Cache: 사용하지 않음 (JWT httpOnly 쿠키 방식이라 세션 저장소 불필요)
- Message Queue: 사용하지 않음
- Storage: (미정 — BehaviorLog.captureImageUrl 저장 위치)
- Styling: Tailwind CSS
- Game Engine: 사용하지 않음. 케이지/캐릭터는 DOM(이미지 + CSS 트랜지션)으로 구현
- Infrastructure: Oracle Cloud Always Free ARM VM + Docker Compose + Nginx 리버스 프록시 + Let's Encrypt + DuckDNS

---

# Architecture

- Architecture: 단일 서버에서 프론트/백엔드를 같은 도메인으로 서빙. 상태 갱신은 lazy-tick 방식
- API Style: REST

## Directory Structure

```text
siniham/
├─ client/              React + Vite + TypeScript + Tailwind
│  ├─ src/
│  └─ package.json
├─ server/              Express + TypeScript + Prisma
│  ├─ src/
│  ├─ prisma/schema.prisma
│  └─ package.json
├─ shared/              client·server 공용 타입·상수 (빌드 없음, 패키지 아님)
├─ docs/
├─ docker-compose.yml
├─ package.json         npm workspaces: ["client", "server"] + 스크립트만
└─ CLAUDE.md
```

## Module Strategy

- `client`와 `server`만 npm workspace입니다. 루트에서 `npm install` 한 번으로 양쪽이 설치됩니다.
- `shared`는 workspace 패키지가 아니라 그냥 타입·상수 폴더입니다. `package.json`을 만들지 않습니다.
- `shared` import는 `@shared/*` 경로 별칭을 씁니다. 상대 경로(`../../../shared/...`)를 쓰지 않습니다.
  - client. `tsconfig.json`의 `paths` + `vite.config.ts`의 `resolve.alias` + `server.fs.allow: ['..']`
  - server. `tsconfig.json`의 `paths` (tsx가 그대로 읽습니다)
- 서버는 번들/컴파일 없이 `tsx`로 실행합니다. 개발과 운영 모두 동일합니다. `tsc`는 `--noEmit` 타입 체크 전용입니다.
- 클라이언트는 `vite build`로 정적 파일을 만들고 Nginx가 서빙합니다. `/api`는 Nginx가 Express로 프록시합니다.

## 핵심 도메인 규칙

구현 시 반드시 지켜야 하는 제약입니다.

- **햄스터는 죽지 않습니다.** 방치해도 상태가 무한정 나빠지지 않습니다.
- **lazy-tick.** 서버가 상시 갱신하지 않고, 요청 시점에 `lastActiveAt` 대비 경과 시간을 계산해 일괄 반영합니다.
- **경과 시간 계산 상한 3일.** 그 이상 방치돼도 3일치까지만 적용합니다.
- lazy-tick 대상은 배고픔/목마름/청결 감소, 수면 상태 전환, 식물 성장, 잡초 생성, 미션 갱신입니다.
- 감소율 초안은 배고픔 8시간에 0, 목마름 6시간에 0, 청결 24시간에 0입니다.
- 30분 이상 상호작용이 없으면 수면 상태로 전환합니다.
- 모든 리소스는 `userId` 기준으로 소유권을 검증합니다.

---

# Development Configuration

## Verification

- Format: (미정)
- Lint: (미정)
- Type Check: `npm run typecheck` → 양쪽 `tsc --noEmit`
- Test: (미정 — 테스트 러너 미선정)
- Build: `npm run build` → client만 `vite build`. server는 빌드 산출물이 없습니다

검증 명령어가 확정되기 전까지는 타입 체크와 빌드 확인을 최소 검증으로 사용합니다.

## Code Quality

- Formatter: (미정)
- Linter: (미정)
- Static Analysis: (미정)

## CI/CD

- CI: (미정 — GitHub Actions 도입 예정)
- CD: 초기 SSH 수동 배포 → 이후 GitHub Actions 자동화

---

# Coding Convention

- Naming Convention: (미정)
- Branch Strategy: (미정)
- Branch Naming: docs/rules/git.md 기본 원칙
- Commit Convention: Conventional Commits
- Code Review: 1인 개발. 구현 후 Claude가 Review 단계를 별도로 수행
- Error Handling: (미정)
- Logging: (미정)
- Authentication: JWT를 httpOnly 쿠키에 저장. 별도 세션 저장소 없음
- Authorization: 요청자 `userId`가 소유한 리소스만 접근 허용
- File Header: 새 소스 파일 첫 줄에 한 줄짜리 한국어 역할 주석 (CLAUDE.md 6번)
- Comment Style: docs/rules/coding.md

---

# Documentation

- Product Plan: docs/product-plan.md
- Onboarding: (미정)
- Specification: docs/specs
- API Documentation: docs/api
- Architecture: docs/architecture
- Decision: docs/decisions
- Work Log: Notion `햄스터 키우기(시니햄) > 기록`
- Issue Tracker: (미정)

---

# Development Principles

- Scope: 서비스 방향 한 문장("여러 마리의 귀여운 햄스터를 돌보고 케이지를 꾸미며, 햄스터들의 다양한 행동을 관찰하는 웹 기반 힐링 육성 게임")과 직접 연결되지 않는 기능은 전부 후순위로 미룹니다.
- Readability: 1인 개발이므로 다음 세션의 본인이 읽을 수 있는 코드를 우선합니다.
- Performance: lazy-tick + 3일 상한으로 상시 연산을 만들지 않습니다. 초기 사용자 10~30명 규모에 맞는 수준까지만 최적화합니다.
- Security: JWT는 httpOnly 쿠키에만 저장합니다. DB 컨테이너는 외부 포트를 노출하지 않고, Nginx는 80/443만 엽니다.
- Responsive: PC와 모바일을 모두 지원합니다. 마우스와 터치 입력을 함께 고려합니다.
- Testing: (미정)
- Documentation: 기술 선택은 docs/decisions에, 작업 과정은 Notion Work Log에 기록합니다.

---

# Additional Notes

## MVP 제외 범위

아래는 요청받아도 MVP 범위 밖입니다. 구현 전에 확인합니다.

- 여러 마리 동시 육성
- 친구 방문/커뮤니티
- 교배 시스템
- 유료 결제
- 계절 이벤트, 사용자 간 거래

## 미결정/보류 항목

- 서비스 최종 이름
- DB 백업 자동화 (cron + `pg_dump`) — 미착수. Docker 자체 관리라 자동 백업이 없음
- 배포 자동화 (GitHub Actions)
- 정원/상점/도감·미션 탭 컴포넌트 구현
- 백엔드 정원/상점/미션 API 라우트 구현
- 테스트 러너, 린터/포매터 선정
