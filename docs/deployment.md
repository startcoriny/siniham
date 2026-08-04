# 배포 가이드

Oracle 서버(Ubuntu 기준)에 Docker Compose로 올리는 순서입니다. 외부에 열리는 포트는 Caddy의 80, 443뿐이고 앱과 DB는 도커 내부 네트워크에만 있습니다.

## 1. 사전 준비

- 서버에 Docker Engine과 Docker Compose 플러그인이 설치돼 있어야 합니다.
- 도메인의 A 레코드가 서버 공인 IP를 가리켜야 합니다. 이게 안 되어 있으면 인증서 발급이 실패합니다.
- 방화벽에서 80, 443을 열어야 합니다. Oracle Cloud는 인스턴스 보안 목록과 OS 방화벽 두 곳을 모두 열어야 합니다.

```bash
sudo ufw allow 80
sudo ufw allow 443
```

## 2. 코드 받기

```bash
git clone https://github.com/startcoriny/siniham.git
cd siniham
```

## 3. 환경변수 작성

```bash
cp .env.production.example .env
openssl rand -base64 48   # JWT_SECRET에 붙여넣기
openssl rand -hex 32      # POSTGRES_PASSWORD에 붙여넣기
vi .env                   # DOMAIN, ACME_EMAIL까지 채우기
chmod 600 .env
```

개발용 `.env` 값을 그대로 쓰지 않습니다. 로컬 값은 이미 여러 곳에 노출돼 있어 그대로 올리면 계정 위조가 가능합니다.

## 4. 기동

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

앱 컨테이너가 시작할 때 `prisma migrate deploy`로 마이그레이션을 먼저 적용하고 서버를 띄웁니다. 별도로 실행할 필요가 없습니다.

## 5. 확인

```bash
docker compose -f docker-compose.prod.yml ps          # 세 컨테이너가 Up인지
docker compose -f docker-compose.prod.yml logs -f app # 마이그레이션과 기동 로그
curl -I https://<도메인>/api/health                    # 200 이어야 정상
```

인증서 발급에는 처음 한 번 수십 초가 걸릴 수 있습니다. `caddy` 로그에서 발급 결과를 볼 수 있습니다.

```bash
docker compose -f docker-compose.prod.yml logs caddy
```

## 6. 업데이트

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 7. 백업

`backup` 프로파일로 DB 덤프를 `./backups`에 남깁니다.

```bash
docker compose -f docker-compose.prod.yml --profile backup run --rm backup
```

정기 백업은 cron에 등록합니다.

```bash
0 4 * * * cd /path/to/siniham && docker compose -f docker-compose.prod.yml --profile backup run --rm backup
```

---

## 알아둘 것

**HTTPS가 필수입니다.** 인증 쿠키에 `secure` 플래그가 붙기 때문에 HTTP로 접속하면 브라우저가 쿠키를 저장하지 않아 로그인이 되지 않습니다. Caddy를 거치지 않고 앱에 직접 붙는 구성은 동작하지 않습니다.

**요청 제한이 걸려 있습니다.** 로그인과 회원가입은 IP당 10분에 20회, 그 외 API는 분당 300회입니다. 조정은 `server/src/middleware/rateLimit.ts`에서 합니다.

**`.env`는 서버에만 둡니다.** `.gitignore`에 있어 커밋되지 않지만, 파일 권한을 `600`으로 두고 백업이나 로그에 섞이지 않도록 주의합니다.

**인증서 볼륨을 지우지 않습니다.** `caddy-data` 볼륨에 발급 상태가 들어 있습니다. 지우고 반복 발급하면 Let's Encrypt 발급 한도에 걸립니다.
