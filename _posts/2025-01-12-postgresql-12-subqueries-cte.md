---
title: "PostgreSQL 12 - 서브쿼리와 CTE"
date: 2025-01-12 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, 서브쿼리, CTE, WITH]
---

# 서브쿼리와 CTE

## 스칼라 서브쿼리
```sql
-- 각 사용자의 포스트 수
SELECT username, 
       (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count
FROM users;

-- 평균보다 나이가 많은 사용자
SELECT username, age 
FROM users 
WHERE age > (SELECT AVG(age) FROM users WHERE age IS NOT NULL);
```

## 테이블 서브쿼리
```sql
-- FROM 절의 서브쿼리
SELECT * FROM (
    SELECT username, age, 
           CASE WHEN age < 30 THEN 'young' ELSE 'old' END as age_group
    FROM users
) as user_groups 
WHERE age_group = 'young';
```

## EXISTS 서브쿼리
```sql
-- 포스트가 있는 사용자만
SELECT username FROM users u
WHERE EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id);

-- 게시된 포스트가 있는 사용자만
SELECT username FROM users u
WHERE EXISTS (
    SELECT 1 FROM posts p 
    WHERE p.user_id = u.id AND p.published = true
);
```

## CTE (Common Table Expression)
```sql
-- 기본 CTE
WITH user_stats AS (
    SELECT user_id, 
           COUNT(*) as post_count,
           AVG(LENGTH(content)) as avg_content_length
    FROM posts 
    GROUP BY user_id
)
SELECT u.username, us.post_count, us.avg_content_length
FROM users u
JOIN user_stats us ON u.id = us.user_id;
```

## 재귀 CTE
```sql
-- 계층적 데이터 처리 (조직도 예제)
WITH RECURSIVE org_hierarchy AS (
    -- 기본 케이스: 최상위 관리자
    SELECT id, name, manager_id, 1 as level
    FROM employees 
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- 재귀 케이스: 하위 직원들
    SELECT e.id, e.name, e.manager_id, oh.level + 1
    FROM employees e
    JOIN org_hierarchy oh ON e.manager_id = oh.id
)
SELECT * FROM org_hierarchy ORDER BY level, name;
```

## 여러 CTE 사용
```sql
WITH 
young_users AS (
    SELECT * FROM users WHERE age < 30
),
active_posts AS (
    SELECT * FROM posts WHERE published = true
)
SELECT yu.username, COUNT(ap.id) as published_posts
FROM young_users yu
LEFT JOIN active_posts ap ON yu.id = ap.user_id
GROUP BY yu.id, yu.username;
```

## 윈도우 함수와 CTE
```sql
WITH ranked_posts AS (
    SELECT title, user_id, created_at,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM posts
)
SELECT u.username, rp.title as latest_post
FROM users u
JOIN ranked_posts rp ON u.id = rp.user_id AND rp.rn = 1;
```

다음 포스트에서는 인덱스 생성과 활용에 대해 알아보겠습니다. 