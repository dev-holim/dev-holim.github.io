---
title: "PostgreSQL 09 - 집계 함수 (COUNT, SUM, AVG 등)"
date: 2025-01-09 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, 집계함수, COUNT, SUM, AVG]
---

# 집계 함수 (COUNT, SUM, AVG 등)

## 기본 집계 함수
```sql
-- COUNT: 행 개수
SELECT COUNT(*) FROM users;                    -- 전체 행 수
SELECT COUNT(age) FROM users;                  -- NULL이 아닌 age 행 수
SELECT COUNT(DISTINCT age) FROM users;         -- 중복 제거한 age 개수

-- SUM: 합계
SELECT SUM(age) FROM users;                    -- 나이 총합
SELECT SUM(age) FROM users WHERE age IS NOT NULL;

-- AVG: 평균
SELECT AVG(age) FROM users;                    -- 평균 나이
SELECT ROUND(AVG(age), 2) FROM users;         -- 소수점 2자리

-- MIN, MAX: 최솟값, 최댓값
SELECT MIN(age), MAX(age) FROM users;
SELECT MIN(created_at), MAX(created_at) FROM users;
```

## 문자열 집계 함수
```sql
-- STRING_AGG: 문자열 연결
SELECT STRING_AGG(username, ', ') FROM users;
SELECT STRING_AGG(username, ', ' ORDER BY username) FROM users;

-- ARRAY_AGG: 배열로 집계
SELECT ARRAY_AGG(username) FROM users;
SELECT ARRAY_AGG(age ORDER BY age) FROM users WHERE age IS NOT NULL;
```

## 통계 함수
```sql
-- 표준편차
SELECT STDDEV(age) FROM users;

-- 분산
SELECT VARIANCE(age) FROM users;

-- 상관계수 (두 컬럼 간)
SELECT CORR(age, LENGTH(username)) FROM users;
```

## 조건부 집계
```sql
-- FILTER를 사용한 조건부 집계
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE age >= 30) as adults,
    COUNT(*) FILTER (WHERE age < 30) as young_users;

-- CASE와 함께 사용
SELECT 
    COUNT(CASE WHEN age >= 30 THEN 1 END) as adults,
    COUNT(CASE WHEN age < 30 THEN 1 END) as young_users;
```

## 윈도우 함수와 집계
```sql
-- 누적 합계
SELECT username, age, 
       SUM(age) OVER (ORDER BY age) as running_total
FROM users WHERE age IS NOT NULL;

-- 이동 평균
SELECT username, age,
       AVG(age) OVER (ORDER BY age ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as moving_avg
FROM users WHERE age IS NOT NULL;
```

다음 포스트에서는 GROUP BY와 HAVING에 대해 알아보겠습니다. 