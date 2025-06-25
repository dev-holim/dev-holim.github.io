---
title: "PostgreSQL 20 - 성능 모니터링"
date: 2025-01-20 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, Performance, Monitoring, 성능, 모니터링]
---

# 성능 모니터링

## 시스템 통계 조회
```sql
-- 활성 연결 및 쿼리
SELECT pid, usename, application_name, state, query_start, query
FROM pg_stat_activity 
WHERE state = 'active';

-- 데이터베이스 통계
SELECT datname, numbackends, xact_commit, xact_rollback, 
       blks_read, blks_hit, tup_returned, tup_fetched
FROM pg_stat_database;

-- 테이블 통계
SELECT schemaname, tablename, seq_scan, seq_tup_read, 
       idx_scan, idx_tup_fetch, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables;
```

## 슬로우 쿼리 모니터링
```sql
-- 슬로우 쿼리 로깅 설정
-- postgresql.conf에서 설정
-- log_min_duration_statement = 1000  -- 1초 이상

-- pg_stat_statements 확장 설치
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 슬로우 쿼리 조회
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

## 잠금 모니터링
```sql
-- 현재 잠금 상태
SELECT l.locktype, l.database, l.relation, l.page, l.tuple, 
       l.pid, l.mode, l.granted, a.query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted;

-- 블로킹 쿼리 찾기
SELECT blocking.pid AS blocking_pid, blocking.query AS blocking_query,
       blocked.pid AS blocked_pid, blocked.query AS blocked_query
FROM pg_stat_activity blocked
JOIN pg_locks bl ON blocked.pid = bl.pid
JOIN pg_locks kl ON bl.transactionid = kl.transactionid
JOIN pg_stat_activity blocking ON kl.pid = blocking.pid
WHERE NOT bl.granted AND kl.granted;
```

## 인덱스 사용량 분석
```sql
-- 사용되지 않는 인덱스
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;

-- 인덱스 효율성
SELECT schemaname, tablename, indexname, 
       idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

## 캐시 히트율
```sql
-- 버퍼 캐시 히트율
SELECT datname,
       round(blks_hit::numeric / (blks_hit + blks_read) * 100, 2) as cache_hit_ratio
FROM pg_stat_database 
WHERE blks_read > 0;
```

다음 포스트에서는 쿼리 최적화 기법에 대해 알아보겠습니다. 