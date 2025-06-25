---
title: "PostgreSQL 17: 트랜잭션과 동시성 제어 마스터하기"
date: 2025-01-17 00:00:00 +0900
categories: [Database, PostgreSQL]
tags: [postgresql, transaction, acid, isolation, concurrency, savepoint]
---

## 트랜잭션의 기본 개념

트랜잭션은 데이터베이스에서 하나의 논리적 작업 단위로 취급되는 SQL 문들의 집합입니다. PostgreSQL은 완전한 ACID 속성을 지원합니다.

### ACID 속성

- **Atomicity (원자성)**: 트랜잭션의 모든 작업이 완전히 수행되거나 전혀 수행되지 않음
- **Consistency (일관성)**: 트랜잭션 실행 전후에 데이터베이스가 일관된 상태 유지
- **Isolation (격리성)**: 동시에 실행되는 트랜잭션들이 서로 영향을 주지 않음
- **Durability (지속성)**: 커밋된 트랜잭션의 결과는 영구적으로 저장

## 트랜잭션 제어 명령어

### 기본 트랜잭션 제어

```sql
-- 트랜잭션 시작
BEGIN;
-- 또는
START TRANSACTION;

-- 트랜잭션 커밋
COMMIT;

-- 트랜잭션 롤백
ROLLBACK;
```

### 실제 예제

```sql
-- 계좌 이체 예제
BEGIN;

UPDATE accounts 
SET balance = balance - 1000 
WHERE account_id = 1;

UPDATE accounts 
SET balance = balance + 1000 
WHERE account_id = 2;

-- 잔액 확인 후 문제가 없으면 커밋
COMMIT;
```

## 격리 수준 (Isolation Levels)

PostgreSQL은 4가지 격리 수준을 제공합니다:

### 1. READ UNCOMMITTED
```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN;
-- 커밋되지 않은 데이터도 읽을 수 있음 (Dirty Read 가능)
COMMIT;
```

### 2. READ COMMITTED (기본값)
```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
-- 커밋된 데이터만 읽을 수 있음
COMMIT;
```

### 3. REPEATABLE READ
```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
-- 트랜잭션 동안 같은 데이터를 여러 번 읽어도 일관된 결과
COMMIT;
```

### 4. SERIALIZABLE
```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
-- 가장 높은 격리 수준, 직렬화 가능
COMMIT;
```

## 세이브포인트 (Savepoints)

트랜잭션 내에서 부분적인 롤백을 위한 체크포인트를 설정할 수 있습니다.

```sql
BEGIN;

INSERT INTO products (name, price) VALUES ('Product A', 100);

-- 세이브포인트 설정
SAVEPOINT sp1;

INSERT INTO products (name, price) VALUES ('Product B', 200);

-- 조건에 따라 부분 롤백
ROLLBACK TO SAVEPOINT sp1;

-- 세이브포인트 해제
RELEASE SAVEPOINT sp1;

COMMIT;
```

## 동시성 제어와 잠금

### 행 수준 잠금

```sql
-- 공유 잠금
SELECT * FROM products WHERE id = 1 FOR SHARE;

-- 배타적 잠금
SELECT * FROM products WHERE id = 1 FOR UPDATE;

-- 잠금 대기 없이 시도
SELECT * FROM products WHERE id = 1 FOR UPDATE NOWAIT;

-- 잠금 대기 시간 제한
SELECT * FROM products WHERE id = 1 FOR UPDATE SKIP LOCKED;
```

### 테이블 수준 잠금

```sql
-- 테이블 잠금
LOCK TABLE products IN ACCESS EXCLUSIVE MODE;
```

## 데드락 처리

### 데드락 감지 및 해결

```sql
-- 데드락 타임아웃 설정 확인
SHOW deadlock_timeout;

-- 데드락 상황 모니터링
SELECT * FROM pg_locks WHERE NOT granted;
```

### 데드락 방지 전략

```sql
-- 1. 일관된 순서로 테이블/행 접근
BEGIN;
UPDATE table_a SET value = 1 WHERE id = 1;
UPDATE table_b SET value = 2 WHERE id = 1;
COMMIT;

-- 2. 짧은 트랜잭션 사용
BEGIN;
-- 필요한 작업만 빠르게 수행
COMMIT;
```

## 트랜잭션 모니터링

### 현재 실행 중인 트랜잭션 확인

```sql
SELECT 
    pid,
    state,
    query_start,
    xact_start,
    query
FROM pg_stat_activity 
WHERE state IN ('active', 'idle in transaction');
```

### 트랜잭션 통계

```sql
SELECT 
    datname,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit
FROM pg_stat_database;
```

## 실용적인 팁

### 1. 트랜잭션 크기 최적화
```sql
-- 큰 배치 작업을 작은 단위로 분할
DO $$
DECLARE
    counter INTEGER := 0;
BEGIN
    FOR i IN 1..100000 LOOP
        INSERT INTO large_table (data) VALUES ('data' || i);
        counter := counter + 1;
        
        -- 1000개마다 커밋
        IF counter % 1000 = 0 THEN
            COMMIT;
            BEGIN;
        END IF;
    END LOOP;
    COMMIT;
END $$;
```

### 2. 트랜잭션 타임아웃 설정
```sql
-- 세션 레벨에서 타임아웃 설정
SET statement_timeout = '30s';
SET idle_in_transaction_session_timeout = '10min';
```

트랜잭션과 동시성 제어를 잘 이해하고 활용하면 안전하고 효율적인 데이터베이스 애플리케이션을 구축할 수 있습니다. 다음 글에서는 PostgreSQL의 보안과 권한 관리에 대해 자세히 알아보겠습니다. 