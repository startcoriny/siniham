#!/bin/sh
# 로컬에서 실행해 SSH로 운영 서버에 origin/main을 배포한다. 헬스체크가 실패하면 직전 커밋으로 되돌린다.
set -eu

ssh_host="${SSH_HOST:-ubuntu@161.33.177.165}"
remote_dir="${REMOTE_DIR:-/opt/siniham}"
health_url="${HEALTH_URL:-https://siniham.app/api/health}"
compose="docker compose -f docker-compose.prod.yml"

# SSH_KEY 경로에 공백이 있어도 깨지지 않도록 위치 인자로 옵션을 만든다.
set -- -o ConnectTimeout=10
if [ -n "${SSH_KEY:-}" ]; then
  set -- "$@" -i "$SSH_KEY"
fi

echo "== 1. 로컬 점검 =="
git fetch origin --quiet
target="$(git rev-parse --short origin/main)"
echo "배포 대상. origin/main @ $target"
if [ -n "$(git rev-list origin/main..HEAD)" ]; then
  echo "참고. 현재 브랜치에 origin/main으로 머지되지 않은 커밋이 있습니다. 배포되지 않습니다."
fi

echo "== 2. 서버 연결 =="
ssh "$@" "$ssh_host" true
echo "연결 확인"

echo "== 3. 배포 전 상태 =="
before="$(ssh "$@" "$ssh_host" "cd '$remote_dir' && git fetch origin --quiet && git rev-parse HEAD")"
echo "현재 서버 커밋. $(echo "$before" | cut -c1-7)"

echo "== 4. 마이그레이션 검사 =="
new_migrations="$(ssh "$@" "$ssh_host" "cd '$remote_dir' && git diff --name-only $before origin/main -- server/prisma/migrations")"
if [ -n "$new_migrations" ]; then
  echo "새 마이그레이션이 포함돼 있습니다."
  echo "$new_migrations"
  echo "롤백은 코드만 되돌립니다. 적용된 스키마는 되돌아가지 않아 구버전 코드와 어긋날 수 있습니다."
  printf "계속하려면 yes 를 입력하세요. "
  read -r answer < /dev/tty
  if [ "$answer" != "yes" ]; then
    echo "중단했습니다."
    exit 1
  fi
else
  echo "새 마이그레이션 없음"
fi

echo "== 5. DB 백업 =="
ssh "$@" "$ssh_host" "cd '$remote_dir' && mkdir -p backups && $compose --profile backup run --rm backup"
latest_backup="$(ssh "$@" "$ssh_host" "ls -t '$remote_dir'/backups/*.sql.gz | head -1")"
echo "백업 파일. $latest_backup"

echo "== 6. 코드 갱신과 재빌드 =="
ssh "$@" "$ssh_host" "cd '$remote_dir' && git reset --hard origin/main && $compose up -d --build"

echo "== 7. 헬스체크 =="
i=0
until curl -fsS -o /dev/null "$health_url"; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "헬스체크 실패. $before 로 롤백합니다."
    ssh "$@" "$ssh_host" "cd '$remote_dir' && git reset --hard $before && $compose up -d --build"
    echo "-- 실패 당시 앱 로그 --"
    ssh "$@" "$ssh_host" "cd '$remote_dir' && $compose logs --tail=50 app"
    if [ -n "$new_migrations" ]; then
      echo "주의. 이번 배포로 적용된 마이그레이션은 되돌아가지 않았습니다."
      echo "스키마까지 복구하려면 백업을 사용합니다. $latest_backup"
    fi
    exit 1
  fi
  sleep 2
done

echo "배포 완료. $target"
ssh "$@" "$ssh_host" "cd '$remote_dir' && $compose ps"
