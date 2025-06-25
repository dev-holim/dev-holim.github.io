---
title: "PostgreSQL 29: 마이그레이션과 버전 업그레이드 전략"
date: 2025-01-29 00:00:00 +0900
categories: [Database, PostgreSQL]
tags: [postgresql, migration, upgrade, pg_upgrade, logical-replication, downtime]
---

## PostgreSQL 버전 업그레이드 개요

PostgreSQL 버전 업그레이드는 새로운 기능 활용과 보안 업데이트를 위해 필수적인 과정입니다. 메이저 버전 업그레이드와 마이너 버전 업그레이드에 따라 다른 전략이 필요합니다.

### 버전 정보 확인

```sql
-- 현재 PostgreSQL 버전 확인
SELECT version();

-- 서버 버전 정보 상세
SHOW server_version;
SHOW server_version_num;

-- 클라이언트 버전 확인
\conninfo
```

## 메이저 버전 업그레이드 방법

### 1. pg_upgrade 사용 (권장)

```bash
# 1. 새 PostgreSQL 버전 설치
sudo apt-get install postgresql-15

# 2. 기존 서버 중지
sudo systemctl stop postgresql

# 3. 새 클러스터 초기화
sudo -u postgres /usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/15/main

# 4. pg_upgrade 실행
sudo -u postgres /usr/lib/postgresql/15/bin/pg_upgrade \
    --old-datadir=/var/lib/postgresql/13/main \
    --new-datadir=/var/lib/postgresql/15/main \
    --old-bindir=/usr/lib/postgresql/13/bin \
    --new-bindir=/usr/lib/postgresql/15/bin \
    --check

# 5. 실제 업그레이드 수행
sudo -u postgres /usr/lib/postgresql/15/bin/pg_upgrade \
    --old-datadir=/var/lib/postgresql/13/main \
    --new-datadir=/var/lib/postgresql/15/main \
    --old-bindir=/usr/lib/postgresql/13/bin \
    --new-bindir=/usr/lib/postgresql/15/bin

# 6. 새 서버 시작
sudo systemctl start postgresql@15-main

# 7. 통계 업데이트
sudo -u postgres ./analyze_new_cluster.sh
```

### 2. 논리적 복제를 이용한 업그레이드

```sql
-- 1. 구 버전에서 논리적 복제 설정
-- postgresql.conf 설정
wal_level = logical
max_wal_senders = 10
max_replication_slots = 10

-- 2. 퍼블리케이션 생성
CREATE PUBLICATION all_tables FOR ALL TABLES;

-- 3. 복제 사용자 생성
CREATE USER replication_user WITH REPLICATION LOGIN PASSWORD 'strong_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replication_user;

-- 4. 새 버전에서 서브스크립션 생성
CREATE SUBSCRIPTION upgrade_subscription
CONNECTION 'host=old_server port=5432 dbname=mydb user=replication_user password=strong_password'
PUBLICATION all_tables;

-- 5. 동기화 확인
SELECT * FROM pg_subscription;
SELECT * FROM pg_stat_subscription;
```

### 3. 덤프/복원 방식

```bash
# 1. 기존 데이터베이스 덤프
pg_dump -h localhost -U postgres -d mydb -f mydb_backup.sql

# 또는 바이너리 형식으로
pg_dump -h localhost -U postgres -d mydb -Fc -f mydb_backup.dump

# 2. 새 버전에 복원
psql -h localhost -U postgres -d mydb -f mydb_backup.sql

# 또는 바이너리 덤프 복원
pg_restore -h localhost -U postgres -d mydb mydb_backup.dump
```

## 무중단 마이그레이션 전략

### 1. 논리적 복제를 이용한 무중단 마이그레이션

```sql
-- Step 1: 원본 서버에서 초기 설정
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET max_replication_slots = 10;
-- 서버 재시작 필요

-- Step 2: 퍼블리케이션 생성
CREATE PUBLICATION migration_pub FOR ALL TABLES;

-- Step 3: 대상 서버에서 구조 복사
pg_dump -h source_host -U postgres -s -d source_db | psql -h target_host -U postgres -d target_db

-- Step 4: 초기 데이터 동기화
CREATE SUBSCRIPTION migration_sub
CONNECTION 'host=source_host port=5432 dbname=source_db user=postgres'
PUBLICATION migration_pub
WITH (copy_data = true);

-- Step 5: 동기화 상태 모니터링
SELECT 
    subscription_name,
    pid,
    received_lsn,
    latest_end_lsn,
    latest_end_time
FROM pg_stat_subscription;

-- Step 6: 지연시간 확인
SELECT 
    slot_name,
    active,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) as replication_lag
FROM pg_replication_slots;
```

### 2. 애플리케이션 레벨 마이그레이션

```python
# Python을 이용한 점진적 마이그레이션
import psycopg2
import time
from datetime import datetime

class DatabaseMigrator:
    def __init__(self, source_config, target_config):
        self.source_conn = psycopg2.connect(**source_config)
        self.target_conn = psycopg2.connect(**target_config)
        
    def migrate_table_batch(self, table_name, batch_size=1000, id_column='id'):
        source_cur = self.source_conn.cursor()
        target_cur = self.target_conn.cursor()
        
        # 마지막 마이그레이션된 ID 확인
        target_cur.execute(f"SELECT COALESCE(MAX({id_column}), 0) FROM {table_name}")
        last_migrated_id = target_cur.fetchone()[0]
        
        while True:
            # 배치 단위로 데이터 조회
            source_cur.execute(f"""
                SELECT * FROM {table_name} 
                WHERE {id_column} > %s 
                ORDER BY {id_column} 
                LIMIT %s
            """, (last_migrated_id, batch_size))
            
            rows = source_cur.fetchall()
            if not rows:
                break
                
            # 대상 데이터베이스에 삽입
            for row in rows:
                target_cur.execute(f"""
                    INSERT INTO {table_name} VALUES ({','.join(['%s'] * len(row))})
                    ON CONFLICT ({id_column}) DO UPDATE SET 
                    {','.join([f'col{i} = EXCLUDED.col{i}' for i in range(1, len(row))])}
                """, row)
            
            self.target_conn.commit()
            last_migrated_id = rows[-1][0]  # ID 컬럼이 첫 번째라고 가정
            
            print(f"Migrated batch ending with ID: {last_migrated_id}")
            time.sleep(0.1)  # 부하 조절
```

## 다른 데이터베이스에서 PostgreSQL로 마이그레이션

### MySQL에서 PostgreSQL로

```bash
# 1. MySQL 덤프 (PostgreSQL 호환 형식)
mysqldump --compatible=postgresql --default-character-set=utf8 \
    --single-transaction --routines --triggers \
    -u root -p mydb > mysql_dump.sql

# 2. 데이터 타입 변환 스크립트
sed -i 's/ENGINE=InnoDB//g' mysql_dump.sql
sed -i 's/AUTO_INCREMENT//g' mysql_dump.sql
sed -i 's/`//g' mysql_dump.sql

# 3. PostgreSQL에 복원
psql -U postgres -d mydb -f mysql_dump.sql
```

### Oracle에서 PostgreSQL로

```sql
-- ora2pg 도구 사용
-- 1. ora2pg 설치 및 설정
-- /etc/ora2pg/ora2pg.conf 수정

-- 2. 스키마 추출
ora2pg -c /etc/ora2pg/ora2pg.conf -t TABLE

-- 3. 데이터 마이그레이션
ora2pg -c /etc/ora2pg/ora2pg.conf -t COPY
```

## 마이그레이션 검증 및 테스트

### 데이터 무결성 검증

```sql
-- 1. 행 수 비교
SELECT 
    'source' as database,
    schemaname,
    tablename,
    n_tup_ins as inserted_rows,
    n_tup_upd as updated_rows,
    n_tup_del as deleted_rows
FROM pg_stat_user_tables
UNION ALL
SELECT 
    'target' as database,
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables;

-- 2. 체크섬 비교
SELECT 
    table_name,
    md5(array_agg(md5(t.*::text) ORDER BY (t.*::text))::text) as table_checksum
FROM (
    SELECT * FROM users ORDER BY id
) t,
information_schema.tables ist
WHERE ist.table_name = 'users'
GROUP BY table_name;

-- 3. 샘플 데이터 비교
WITH source_sample AS (
    SELECT * FROM users ORDER BY random() LIMIT 100
),
target_sample AS (
    SELECT * FROM users WHERE id IN (SELECT id FROM source_sample)
)
SELECT 
    s.id,
    s.name = t.name as name_match,
    s.email = t.email as email_match
FROM source_sample s
JOIN target_sample t ON s.id = t.id;
```

### 성능 테스트

```sql
-- 쿼리 성능 비교 테스트
CREATE OR REPLACE FUNCTION benchmark_query(query_text TEXT, iterations INT DEFAULT 100)
RETURNS TABLE(avg_time NUMERIC, min_time NUMERIC, max_time NUMERIC) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    elapsed_time NUMERIC;
    times NUMERIC[] := ARRAY[]::NUMERIC[];
    i INT;
BEGIN
    FOR i IN 1..iterations LOOP
        start_time := clock_timestamp();
        EXECUTE query_text;
        end_time := clock_timestamp();
        elapsed_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        times := times || elapsed_time;
    END LOOP;
    
    RETURN QUERY SELECT 
        round(AVG(t), 3) as avg_time,
        round(MIN(t), 3) as min_time,
        round(MAX(t), 3) as max_time
    FROM unnest(times) as t;
END;
$$ LANGUAGE plpgsql;

-- 사용 예제
SELECT * FROM benchmark_query('SELECT COUNT(*) FROM large_table WHERE status = ''active''');
```

## 롤백 전략

### 1. 스냅샷 기반 롤백

```bash
# LVM 스냅샷 생성 (업그레이드 전)
sudo lvcreate -L 10G -s -n pg_snapshot /dev/vg0/pg_data

# 문제 발생 시 롤백
sudo systemctl stop postgresql
sudo umount /var/lib/postgresql/data
sudo lvconvert --merge /dev/vg0/pg_snapshot
sudo mount /var/lib/postgresql/data
sudo systemctl start postgresql
```

### 2. 논리적 복제 롤백

```sql
-- 원본 서버로 다시 전환
-- 1. 새 서버에서 퍼블리케이션 생성
CREATE PUBLICATION rollback_pub FOR ALL TABLES;

-- 2. 원본 서버에서 서브스크립션 생성 (역방향)
CREATE SUBSCRIPTION rollback_sub
CONNECTION 'host=new_server port=5432 dbname=mydb user=postgres'
PUBLICATION rollback_pub
WITH (copy_data = false);  -- 구조적 변경사항만 동기화

-- 3. 애플리케이션 트래픽을 원본 서버로 다시 전환
```

## 마이그레이션 모니터링

### 진행상황 추적

```sql
-- 복제 지연 모니터링
SELECT 
    application_name,
    client_addr,
    state,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn)) as sending_lag,
    pg_size_pretty(pg_wal_lsn_diff(sent_lsn, flush_lsn)) as receiving_lag,
    pg_size_pretty(pg_wal_lsn_diff(flush_lsn, replay_lsn)) as replaying_lag
FROM pg_stat_replication;

-- 논리적 복제 슬롯 상태
SELECT 
    slot_name,
    slot_type,
    database,
    active,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) as replication_lag
FROM pg_replication_slots;
```

### 자동화된 검증 스크립트

```bash
#!/bin/bash
# migration_validator.sh

SOURCE_DB="postgresql://user:pass@source:5432/db"
TARGET_DB="postgresql://user:pass@target:5432/db"

echo "Starting migration validation..."

# 테이블 수 비교
SOURCE_TABLES=$(psql "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
TARGET_TABLES=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")

if [ "$SOURCE_TABLES" != "$TARGET_TABLES" ]; then
    echo "ERROR: Table count mismatch. Source: $SOURCE_TABLES, Target: $TARGET_TABLES"
    exit 1
fi

echo "Table count validation: PASSED"

# 주요 테이블 행 수 비교
for table in users orders products; do
    SOURCE_ROWS=$(psql "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM $table")
    TARGET_ROWS=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM $table")
    
    if [ "$SOURCE_ROWS" != "$TARGET_ROWS" ]; then
        echo "ERROR: Row count mismatch in $table. Source: $SOURCE_ROWS, Target: $TARGET_ROWS"
        exit 1
    fi
    
    echo "Table $table row count validation: PASSED"
done

echo "Migration validation completed successfully!"
```

성공적인 PostgreSQL 마이그레이션을 위해서는 철저한 계획과 테스트, 그리고 적절한 롤백 전략이 필요합니다. 다음 글에서는 PostgreSQL의 최신 기능과 미래 전망에 대해 알아보겠습니다. 