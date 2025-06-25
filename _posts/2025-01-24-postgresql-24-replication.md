---
title: "PostgreSQL 24 - 복제(Replication) 설정"
date: 2025-01-24 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, Replication, 복제, HA]
---

# 복제(Replication) 설정

## 스트리밍 복제 (Streaming Replication)
```bash
# 마스터 서버 설정 (postgresql.conf)
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
listen_addresses = '*'

# pg_hba.conf에 복제 권한 추가
host replication replicator 192.168.1.0/24 md5
```

```sql
-- 복제 사용자 생성
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replica_password';
```

```bash
# 슬레이브 서버 초기 설정
pg_basebackup -h master_host -D /var/lib/postgresql/data -U replicator -P -W

# recovery.conf 파일 생성 (슬레이브)
standby_mode = 'on'
primary_conninfo = 'host=master_host port=5432 user=replicator password=replica_password'
trigger_file = '/tmp/postgresql.trigger.5432'
```

## 논리적 복제 (Logical Replication)
```sql
-- 마스터에서 발행(Publication) 생성
CREATE PUBLICATION my_publication FOR ALL TABLES;
-- 또는 특정 테이블만
CREATE PUBLICATION users_publication FOR TABLE users, posts;

-- 슬레이브에서 구독(Subscription) 생성
CREATE SUBSCRIPTION my_subscription 
CONNECTION 'host=master_host dbname=myapp user=replicator password=replica_password' 
PUBLICATION my_publication;
```

## 복제 상태 모니터링
```sql
-- 마스터에서 복제 상태 확인
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn, sync_state
FROM pg_stat_replication;

-- 슬레이브에서 복제 지연 확인
SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds;

-- WAL 수신 상태 확인
SELECT status, receive_start_lsn, receive_start_tli, received_lsn, received_tli
FROM pg_stat_wal_receiver;
```

## 동기식 복제 설정
```bash
# postgresql.conf
synchronous_standby_names = 'standby1,standby2'
synchronous_commit = on
```

```sql
-- 동기식 복제 상태 확인
SELECT application_name, state, sync_state 
FROM pg_stat_replication;
```

## Failover 및 Switchover
```bash
# 자동 failover를 위한 trigger 파일 생성
touch /tmp/postgresql.trigger.5432

# 수동 promote (슬레이브를 마스터로 승격)
pg_ctl promote -D /var/lib/postgresql/data

# 기존 마스터를 새로운 슬레이브로 구성
# recovery.conf 재설정 필요
```

## Read Replica 활용
```sql
-- 읽기 전용 쿼리를 슬레이브로 분산
-- 애플리케이션에서 읽기/쓰기 분리

-- 슬레이브에서 읽기 전용 사용자 생성
CREATE USER readonly_user WITH PASSWORD 'readonly_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

## 복제 성능 튜닝
```bash
# postgresql.conf 튜닝
wal_buffers = 16MB
checkpoint_segments = 32
checkpoint_completion_target = 0.9
archive_mode = on
archive_command = 'cp %p /archive/%f'
```

다음 포스트에서는 고가용성(HA) 구성에 대해 알아보겠습니다. 