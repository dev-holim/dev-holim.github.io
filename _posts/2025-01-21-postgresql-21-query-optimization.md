---
title: "PostgreSQL 21 - 쿼리 최적화 기법"
date: 2025-01-21 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, Query, Optimization, 최적화, 성능]
---

# 쿼리 최적화 기법

## EXPLAIN으로 실행 계획 분석
```sql
-- 기본 실행 계획
EXPLAIN SELECT * FROM users WHERE age > 25;

-- 상세 정보 포함
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) 
SELECT u.username, COUNT(p.id)
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.username;
```

## 인덱스 최적화
```sql
-- 복합 인덱스 순서 최적화
CREATE INDEX idx_posts_user_published_date ON posts(user_id, published, created_at);

-- 부분 인덱스로 성능 향상
CREATE INDEX idx_active_users ON users(created_at) WHERE age IS NOT NULL;

-- 함수 기반 인덱스
CREATE INDEX idx_users_lower_email ON users(lower(email));
```

## 조건절 최적화
```sql
-- SARGABLE 조건 사용
-- 좋은 예
SELECT * FROM posts WHERE created_at >= '2024-01-01';

-- 피해야 할 예
SELECT * FROM posts WHERE EXTRACT(YEAR FROM created_at) = 2024;

-- EXISTS vs IN
-- EXISTS가 더 효율적인 경우
SELECT * FROM users u 
WHERE EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id);
```

## JOIN 최적화
```sql
-- 적절한 JOIN 순서
SELECT u.username, p.title
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.created_at >= '2024-01-01'
  AND p.published = true;

-- 서브쿼리를 JOIN으로 변환
-- 개선 전
SELECT username, 
       (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count
FROM users;

-- 개선 후
SELECT u.username, COALESCE(p.post_count, 0) as post_count
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) as post_count
    FROM posts 
    GROUP BY user_id
) p ON u.id = p.user_id;
```

## 집계 쿼리 최적화
```sql
-- 윈도우 함수 활용
SELECT username, age,
       ROW_NUMBER() OVER (ORDER BY age DESC) as age_rank,
       AVG(age) OVER () as avg_age
FROM users;

-- 부분 집계 활용
-- 월별 통계를 미리 계산
CREATE MATERIALIZED VIEW monthly_stats AS
SELECT DATE_TRUNC('month', created_at) as month,
       COUNT(*) as user_count,
       AVG(age) as avg_age
FROM users
GROUP BY DATE_TRUNC('month', created_at);
```

## 파티셔닝을 통한 최적화
```sql
-- 날짜 기반 파티셔닝
CREATE TABLE posts_2024 PARTITION OF posts
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 해시 파티셔닝
CREATE TABLE users_part_0 PARTITION OF users
FOR VALUES WITH (MODULUS 4, REMAINDER 0);
```

## 설정 최적화
```sql
-- 통계 정보 업데이트
ANALYZE users;
ANALYZE posts;

-- 작업 메모리 조정
SET work_mem = '256MB';

-- 효과적인 캐시 크기 설정
-- postgresql.conf
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
```

다음 포스트에서는 실행 계획 분석에 대해 알아보겠습니다. 