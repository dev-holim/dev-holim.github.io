---
title: "PostgreSQL 10 - GROUP BY와 HAVING"
date: 2025-01-10 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, GROUP BY, HAVING, 그룹화]
---

# GROUP BY와 HAVING

## 기본 GROUP BY
```sql
-- 나이별 사용자 수
SELECT age, COUNT(*) as user_count 
FROM users 
WHERE age IS NOT NULL
GROUP BY age 
ORDER BY age;

-- 여러 컬럼으로 그룹화
SELECT 
    EXTRACT(YEAR FROM created_at) as year,
    EXTRACT(MONTH FROM created_at) as month,
    COUNT(*) as monthly_users
FROM users 
GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
ORDER BY year, month;
```

## HAVING 절
```sql
-- 그룹화된 결과에 조건 적용
SELECT age, COUNT(*) as user_count
FROM users 
WHERE age IS NOT NULL
GROUP BY age 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- 집계 함수 결과로 조건
SELECT 
    user_id,
    COUNT(*) as post_count,
    AVG(LENGTH(title)) as avg_title_length
FROM posts 
GROUP BY user_id 
HAVING COUNT(*) >= 2 AND AVG(LENGTH(title)) > 10;
```

## GROUPING SETS
```sql
-- 여러 그룹화 레벨을 한 번에
SELECT 
    age,
    EXTRACT(YEAR FROM created_at) as year,
    COUNT(*) as user_count
FROM users 
GROUP BY GROUPING SETS (
    (age),
    (EXTRACT(YEAR FROM created_at)),
    ()  -- 전체 집계
);
```

## ROLLUP과 CUBE
```sql
-- ROLLUP: 계층적 집계
SELECT 
    EXTRACT(YEAR FROM created_at) as year,
    EXTRACT(MONTH FROM created_at) as month,
    COUNT(*) as user_count
FROM users 
GROUP BY ROLLUP(EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at));

-- CUBE: 모든 조합의 집계
SELECT 
    age,
    CASE WHEN age < 30 THEN 'young' ELSE 'old' END as age_group,
    COUNT(*)
FROM users 
WHERE age IS NOT NULL
GROUP BY CUBE(age, CASE WHEN age < 30 THEN 'young' ELSE 'old' END);
```

## 실용적인 예제
```sql
-- 사용자별 포스트 통계
SELECT 
    u.username,
    COUNT(p.id) as total_posts,
    COUNT(CASE WHEN p.published THEN 1 END) as published_posts,
    ROUND(AVG(LENGTH(p.content)), 2) as avg_content_length
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.username
HAVING COUNT(p.id) > 0
ORDER BY total_posts DESC;
```

다음 포스트에서는 JOIN에 대해 알아보겠습니다. 