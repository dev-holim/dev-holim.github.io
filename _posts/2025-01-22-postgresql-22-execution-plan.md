---
title: "PostgreSQL 22 - 실행 계획 분석"
date: 2025-01-22 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, EXPLAIN, 실행계획, 분석]
---

# 실행 계획 분석

## EXPLAIN 기본 사용법
```sql
-- 간단한 실행 계획
EXPLAIN SELECT * FROM users WHERE age > 25;

-- 실제 실행 통계 포함
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 25;

-- 버퍼 사용량 포함
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM users WHERE age > 25;

-- JSON 형태로 출력
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM users WHERE age > 25;
```

## 주요 실행 계획 노드 해석
```sql
-- Seq Scan (전체 테이블 스캔)
EXPLAIN SELECT * FROM users;
-- Result: Seq Scan on users (cost=0.00..15.00 rows=1000 width=4)

-- Index Scan (인덱스 스캔)
EXPLAIN SELECT * FROM users WHERE id = 1;
-- Result: Index Scan using users_pkey on users (cost=0.29..8.30 rows=1 width=4)

-- Nested Loop (중첩 루프 조인)
EXPLAIN SELECT u.username, p.title 
FROM users u JOIN posts p ON u.id = p.user_id;

-- Hash Join (해시 조인)
EXPLAIN SELECT u.username, p.title 
FROM users u JOIN posts p ON u.id = p.user_id
WHERE u.age > 25;
```

## 비용(Cost) 분석
```sql
-- cost=0.00..15.00 해석
-- 첫 번째 숫자(0.00): 첫 번째 행을 반환하기까지의 비용
-- 두 번째 숫자(15.00): 모든 행을 반환하기까지의 총 비용
-- rows=1000: 예상 반환 행 수
-- width=4: 평균 행 크기(바이트)

-- 실제 실행 시간 분석
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 25;
-- Planning Time: 0.123 ms
-- Execution Time: 1.456 ms
```

## 조인 실행 계획 분석
```sql
-- Nested Loop Join
EXPLAIN ANALYZE 
SELECT u.username, p.title 
FROM users u 
JOIN posts p ON u.id = p.user_id 
WHERE u.id = 1;

-- Hash Join
EXPLAIN ANALYZE 
SELECT u.username, p.title 
FROM users u 
JOIN posts p ON u.id = p.user_id;

-- Merge Join
SET enable_hashjoin = off;
SET enable_nestloop = off;
EXPLAIN ANALYZE 
SELECT u.username, p.title 
FROM users u 
JOIN posts p ON u.id = p.user_id 
ORDER BY u.id;
```

## 집계 쿼리 실행 계획
```sql
-- GroupAggregate
EXPLAIN ANALYZE 
SELECT user_id, COUNT(*) 
FROM posts 
GROUP BY user_id 
ORDER BY user_id;

-- HashAggregate
EXPLAIN ANALYZE 
SELECT user_id, COUNT(*) 
FROM posts 
GROUP BY user_id;
```

## 실행 계획 최적화 힌트
```sql
-- 통계 정보 업데이트로 더 정확한 계획 생성
ANALYZE users;
ANALYZE posts;

-- 플래너 설정 조정
SET random_page_cost = 1.1;  -- SSD 환경
SET effective_cache_size = '1GB';

-- 특정 조인 방법 강제
SET enable_nestloop = off;
SET enable_hashjoin = on;
```

## 문제가 있는 실행 계획 식별
```sql
-- 높은 비용을 가진 노드 찾기
-- Seq Scan이 큰 테이블에서 발생
-- Nested Loop Join의 내부 테이블이 인덱스가 없음
-- Sort 연산이 디스크를 사용 (external sort)

-- 개선 예시
-- 인덱스 추가
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- 부분 인덱스 활용
CREATE INDEX idx_published_posts ON posts(user_id) WHERE published = true;
```

다음 포스트에서는 파티셔닝 전략에 대해 알아보겠습니다. 