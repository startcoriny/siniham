#!/bin/sh
# 운영 DB를 로컬 포트로 끌어오는 SSH 터널을 연다. DB는 서버 루프백에만 열려 있어 이 경로로만 접근한다.
set -eu

ssh_host="${SSH_HOST:-ubuntu@161.33.177.165}"
remote_dir="${REMOTE_DIR:-/opt/siniham}"
# 로컬 5432는 docker-compose.yml의 개발 DB가 쓰므로 피한다.
local_port="${LOCAL_PORT:-55432}"

show_url=0
for arg in "$@"; do
  case "$arg" in
    --url) show_url=1 ;;
    *) echo "알 수 없는 인자: $arg" >&2; exit 1 ;;
  esac
done

# SSH_KEY 경로에 공백이 있어도 깨지지 않도록 위치 인자로 옵션을 만든다.
set -- -o ConnectTimeout=10
if [ -n "${SSH_KEY:-}" ]; then
  set -- "$@" -i "$SSH_KEY"
fi

if [ "$show_url" -eq 1 ]; then
  keys='^POSTGRES_(USER|DB|PASSWORD)='
else
  keys='^POSTGRES_(USER|DB)='
fi

remote_env="$(ssh "$@" "$ssh_host" "grep -E '$keys' '$remote_dir/.env'")"

read_env() {
  printf '%s\n' "$remote_env" | sed -n "s/^$1=//p" | sed 's/\r$//; s/^"//; s/"$//'
}

db_user="$(read_env POSTGRES_USER)"
db_name="$(read_env POSTGRES_DB)"

echo "터널을 엽니다. localhost:$local_port -> $ssh_host 의 127.0.0.1:5432"
echo "  user=$db_user  db=$db_name"
if [ "$show_url" -eq 1 ]; then
  echo "  postgresql://$db_user:$(read_env POSTGRES_PASSWORD)@localhost:$local_port/$db_name"
else
  echo "  비밀번호는 서버 $remote_dir/.env 에 있습니다. 전체 URL이 필요하면 --url 을 붙입니다."
fi
echo "Ctrl+C 로 종료합니다."

exec ssh "$@" -N -L "$local_port:127.0.0.1:5432" "$ssh_host"
