#!/bin/sh
# 운영 PostgreSQL 데이터를 날짜별 압축 SQL 파일로 백업한다.
set -eu
backup_dir="${BACKUP_DIR:-/backups}"
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
pg_dump "$DATABASE_URL" | gzip > "$backup_dir/siniham-$timestamp.sql.gz"
find "$backup_dir" -type f -name 'siniham-*.sql.gz' -mtime +14 -delete
