---
title: "PostgreSQL 19 - 백업과 복원"
date: 2025-01-19 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, Backup, Restore, 백업, 복원]
---

# 백업과 복원

## pg_dump를 이용한 백업
```bash
# 전체 데이터베이스 백업
pg_dump -h localhost -U postgres -d myapp > myapp_backup.sql

# 압축 백업
pg_dump -h localhost -U postgres -d myapp | gzip > myapp_backup.sql.gz

# 커스텀 포맷 백업 (빠른 복원, 선택적 복원 가능)
pg_dump -h localhost -U postgres -Fc -d myapp > myapp_backup.custom

# 특정 테이블만 백업
pg_dump -h localhost -U postgres -d myapp -t users -t posts > tables_backup.sql

# 스키마만 백업 (데이터 제외)
pg_dump -h localhost -U postgres -d myapp -s > schema_backup.sql

# 데이터만 백업 (스키마 제외)
pg_dump -h localhost -U postgres -d myapp -a > data_backup.sql
```

## pg_dumpall을 이용한 전체 백업
```bash
# 모든 데이터베이스와 글로벌 객체 백업
pg_dumpall -h localhost -U postgres > full_backup.sql

# 글로벌 객체만 백업 (사용자, 역할 등)
pg_dumpall -h localhost -U postgres -g > globals_backup.sql
```

## 복원 (pg_restore)
```bash
# SQL 파일 복원
psql -h localhost -U postgres -d myapp < myapp_backup.sql

# 커스텀 포맷 복원
pg_restore -h localhost -U postgres -d myapp myapp_backup.custom

# 새 데이터베이스 생성 후 복원
createdb -h localhost -U postgres myapp_restored
pg_restore -h localhost -U postgres -d myapp_restored myapp_backup.custom

# 특정 테이블만 복원
pg_restore -h localhost -U postgres -d myapp -t users myapp_backup.custom

# 병렬 복원 (성능 향상)
pg_restore -h localhost -U postgres -d myapp -j 4 myapp_backup.custom
```

## 온라인 백업 (WAL 기반)
```bash
# 베이스 백업 시작
pg_basebackup -h localhost -U postgres -D /backup/base -Ft -z -P

# WAL 아카이빙 설정 (postgresql.conf)
# wal_level = replica
# archive_mode = on
# archive_command = 'cp %p /backup/wal/%f'
```

## 스크립트를 이용한 자동 백업
```bash
#!/bin/bash
# backup_script.sh

BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="myapp"

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

# 백업 실행
pg_dump -h localhost -U postgres -Fc $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.custom

# 7일 이상 된 백업 파일 삭제
find $BACKUP_DIR -name "${DB_NAME}_*.custom" -mtime +7 -delete

# 크론탭 등록 예시
# 0 2 * * * /path/to/backup_script.sh
```

## Point-in-Time Recovery (PITR)
```bash
# 1. 베이스 백업
pg_basebackup -h localhost -U postgres -D /backup/base -Ft -z

# 2. WAL 파일 보관
# postgresql.conf 설정 필요

# 3. 특정 시점으로 복원
# recovery.conf 파일 생성
echo "restore_command = 'cp /backup/wal/%f %p'" > recovery.conf
echo "recovery_target_time = '2024-01-15 14:30:00'" >> recovery.conf

# 4. PostgreSQL 재시작
```

## 논리적 복제를 이용한 백업
```sql
-- 발행자 설정
CREATE PUBLICATION myapp_pub FOR ALL TABLES;

-- 구독자에서 구독
CREATE SUBSCRIPTION myapp_sub 
CONNECTION 'host=source_host dbname=myapp user=postgres' 
PUBLICATION myapp_pub;
```

다음 포스트에서는 성능 모니터링에 대해 알아보겠습니다. 