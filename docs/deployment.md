# 배포 가이드

Oracle 서버(Ubuntu 기준)에 Docker Compose로 올리는 순서입니다. HTTPS 종단은 호스트에 설치된 nginx가 맡습니다. 앱과 DB 모두 호스트 루프백에만 게시하므로 공인 IP로 직접 붙을 수 있는 포트는 nginx의 80과 443뿐입니다.

```text
인터넷 → nginx (호스트, 80/443, TLS 종단) → 127.0.0.1:3000 → app 컨테이너 → db 컨테이너
로컬 PC → SSH 터널 → 127.0.0.1:5432 → db 컨테이너
```

## 1. 사전 준비

- 서버에 Docker Engine과 Docker Compose 플러그인이 설치돼 있어야 합니다.
- 도메인의 A 레코드가 서버 공인 IP를 가리켜야 합니다. 이게 안 되어 있으면 인증서 발급이 실패합니다.
- 방화벽에서 80, 443을 열어야 합니다. Oracle Cloud는 인스턴스 보안 목록과 OS 방화벽 두 곳을 모두 열어야 합니다.

```bash
sudo ufw allow 80
sudo ufw allow 443
```

3000번은 열지 않습니다. 앱은 localhost에만 바인딩되므로 외부에서 직접 붙을 일이 없습니다.

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
vi .env
chmod 600 .env
```

개발용 `.env` 값을 그대로 쓰지 않습니다. 로컬 값은 이미 여러 곳에 노출돼 있어 그대로 올리면 계정 위조가 가능합니다.

`POSTGRES_PASSWORD`는 hex로 만듭니다. base64에는 `/`, `+`, `=`가 섞여 있어 `DATABASE_URL`에 그대로 들어가면 접속 문자열 파싱이 깨집니다.

## 4. 기동

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

앱 컨테이너가 시작할 때 `prisma migrate deploy`로 마이그레이션을 먼저 적용하고 서버를 띄웁니다. 별도로 실행할 필요가 없습니다.

## 5. nginx 설정

운영 도메인은 `siniham.app`이며 `www.siniham.app`도 같은 서버로 받습니다. 설정 파일은 `/etc/nginx/sites-available/siniham`에 두고 `sites-enabled`로 심볼릭 링크를 겁니다.

처음에는 80 포트 블록만 작성합니다.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name siniham.app www.siniham.app;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`X-Forwarded-For`를 반드시 넘겨야 합니다. 서버가 `trust proxy`로 이 헤더를 읽어 요청 제한을 IP별로 겁니다. 없으면 모든 요청이 같은 IP로 보여서 요청 제한이 전체 사용자에게 한꺼번에 걸립니다.

그다음 certbot을 실행하면 이 블록을 443용으로 고쳐 쓰고, 80은 HTTPS로 리다이렉트하는 별도 블록으로 분리합니다.

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d siniham.app -d www.siniham.app
sudo nginx -t && sudo systemctl reload nginx
```

certbot은 갱신 타이머를 함께 등록합니다. 상태는 `systemctl status certbot.timer`로 봅니다. `# managed by Certbot` 주석이 붙은 줄은 갱신 때 다시 쓰이므로 직접 고치지 않습니다.

### 보안 헤더와 압축

443 블록의 `server { ... }` 안에 직접 추가합니다. certbot이 만들어주지 않는 부분입니다.

```nginx
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

HSTS는 브라우저가 `max-age` 기간 동안 기억합니다. 한 번 켜면 그동안 이 도메인을 HTTP로 열 수 없으니, 도메인을 계속 쓸 것이 확실할 때 넣습니다.

## 6. 확인

```bash
docker compose -f docker-compose.prod.yml ps          # 두 컨테이너가 Up인지
docker compose -f docker-compose.prod.yml logs -f app # 마이그레이션과 기동 로그
curl -I https://<도메인>/api/health                    # 200 이어야 정상
```

## 7. 업데이트

로컬에서 `scripts/deploy.sh`를 실행합니다. 서버에 SSH로 들어갈 필요가 없습니다.

```bash
./scripts/deploy.sh
```

백업 -> `origin/main`으로 갱신 -> 재빌드 -> 헬스체크 순으로 진행하고, 헬스체크가 30회(약 60초) 안에 200을 못 받으면 **직전 커밋으로 자동 롤백**한 뒤 앱 로그를 출력합니다.

배포 대상은 항상 `origin/main`입니다. 로컬 브랜치가 아니라 원격 main을 서버가 받아갑니다.

새 마이그레이션이 포함된 배포는 진행 전에 확인을 받습니다. 롤백은 코드만 되돌리고 스키마는 되돌리지 않아서, 구버전 코드와 신버전 스키마가 어긋날 수 있기 때문입니다. 그 경우 백업으로 복구합니다.

설정은 환경변수로 바꿉니다.

| 변수 | 기본값 |
| --- | --- |
| `SSH_HOST` | `ubuntu@161.33.177.165` |
| `SSH_KEY` | 없음. `~/.ssh/config`에 등록했다면 불필요 |
| `REMOTE_DIR` | `/opt/siniham` |
| `HEALTH_URL` | `https://siniham.app/api/health` |

nginx는 건드리지 않아도 됩니다.

## 8. 백업

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

**HTTPS가 필수입니다.** 인증 쿠키에 `secure` 플래그가 붙기 때문에 HTTP로 접속하면 브라우저가 쿠키를 저장하지 않아 로그인이 되지 않습니다. nginx를 거치지 않고 `127.0.0.1:3000`에 직접 붙는 구성은 로그인이 동작하지 않습니다. 로컬 개발에서는 `NODE_ENV`가 production이 아니라 이 플래그가 꺼지므로 `http://localhost`로 정상 동작합니다.

**DB는 SSH 터널로만 접근합니다.** `db` 서비스는 `127.0.0.1:5432`에만 게시되어 공인 IP로는 붙을 수 없습니다. 로컬에서 GUI 툴을 쓰려면 터널을 엽니다.

```bash
./scripts/db-tunnel.sh
```

로컬 `55432`가 서버의 `127.0.0.1:5432`로 연결됩니다. 로컬 `5432`는 `docker-compose.yml`의 개발 DB가 쓰고 있어 피했습니다. DBeaver, TablePlus, `psql -h localhost -p 55432`, `DATABASE_URL=... npx prisma studio` 모두 이걸로 붙습니다.

비밀번호는 기본적으로 출력하지 않습니다. 터미널 출력을 어딘가에 붙여넣다가 운영 비밀번호가 새는 것을 막기 위해서입니다. 전체 접속 문자열이 필요하면 `--url`을 붙입니다.

서버에서 바로 볼 때는 컨테이너 안으로 들어갑니다.

```bash
docker compose -f docker-compose.prod.yml exec db psql -U <POSTGRES_USER> -d <POSTGRES_DB>
```

**요청 제한이 걸려 있습니다.** 로그인과 회원가입은 IP당 10분에 20회, 그 외 API는 분당 300회입니다. 조정은 `server/src/middleware/rateLimit.ts`에서 합니다.

**`.env`는 서버에만 둡니다.** `.gitignore`에 있어 커밋되지 않지만, 파일 권한을 `600`으로 두고 백업이나 로그에 섞이지 않도록 주의합니다.
