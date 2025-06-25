---
title: "PostgreSQL 07 - WHERE 절과 조건문"
date: 2025-01-07 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, WHERE, 조건문, 쿼리]
---

# WHERE 절과 조건문

## 기본 비교 연산자
```sql
-- 같음, 다름
SELECT * FROM users WHERE age = 25;
SELECT * FROM users WHERE age != 30;
SELECT * FROM users WHERE age <> 30;  -- != 와 동일

-- 크기 비교
SELECT * FROM users WHERE age > 25;
SELECT * FROM users WHERE age >= 25;
SELECT * FROM users WHERE age < 30;
SELECT * FROM users WHERE age <= 30;
```

## 논리 연산자
```sql
-- AND 연산자
SELECT * FROM users WHERE age >= 25 AND age <= 30;

-- OR 연산자
SELECT * FROM users WHERE age < 20 OR age > 50;

-- NOT 연산자
SELECT * FROM users WHERE NOT (age < 18);
```

## 패턴 매칭
```sql
-- LIKE 연산자
SELECT * FROM users WHERE username LIKE 'john%';    -- john으로 시작
SELECT * FROM users WHERE email LIKE '%@gmail.com'; -- gmail.com으로 끝남
SELECT * FROM users WHERE username LIKE 'j_hn';     -- j?hn 패턴

-- ILIKE (대소문자 무시)
SELECT * FROM users WHERE username ILIKE 'JOHN%';

-- 정규표현식
SELECT * FROM users WHERE username ~ '^[a-z]+$';    -- 소문자만
SELECT * FROM users WHERE email !~ '\\.edu$';       -- .edu로 끝나지 않음
```

## NULL 처리
```sql
-- NULL 확인
SELECT * FROM users WHERE age IS NULL;
SELECT * FROM users WHERE age IS NOT NULL;

-- NULL 안전 비교
SELECT * FROM users WHERE age IS DISTINCT FROM 25;
SELECT * FROM users WHERE age IS NOT DISTINCT FROM NULL;
```

## 범위 조건
```sql
-- BETWEEN
SELECT * FROM users WHERE age BETWEEN 25 AND 35;
SELECT * FROM users WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';

-- IN 연산자
SELECT * FROM users WHERE age IN (25, 30, 35);
SELECT * FROM users WHERE username IN ('john', 'jane', 'bob');

-- NOT IN
SELECT * FROM users WHERE age NOT IN (18, 65);
```

## 서브쿼리 조건
```sql
-- EXISTS
SELECT * FROM users 
WHERE EXISTS (SELECT 1 FROM posts WHERE posts.user_id = users.id);

-- IN 서브쿼리
SELECT * FROM users 
WHERE id IN (SELECT user_id FROM posts WHERE published = true);

-- ANY/SOME
SELECT * FROM users WHERE age > ANY(SELECT age FROM users WHERE username LIKE 'j%');

-- ALL
SELECT * FROM users WHERE age > ALL(SELECT age FROM users WHERE username LIKE 'a%');
```

## 날짜/시간 조건
```sql
-- 날짜 범위
SELECT * FROM posts WHERE DATE(created_at) = '2024-01-01';
SELECT * FROM posts WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- 시간 단위 추출
SELECT * FROM posts WHERE EXTRACT(YEAR FROM created_at) = 2024;
SELECT * FROM posts WHERE EXTRACT(DOW FROM created_at) = 1; -- 월요일
```

## 복합 조건
```sql
-- 괄호를 사용한 조건 그룹화
SELECT * FROM users 
WHERE (age BETWEEN 20 AND 30) 
   OR (age BETWEEN 40 AND 50 AND username LIKE 'a%');

-- CASE 문을 WHERE에서 활용
SELECT * FROM users 
WHERE CASE 
    WHEN age < 18 THEN false
    WHEN age >= 65 THEN false
    ELSE true
END;
```

다음 포스트에서는 ORDER BY, LIMIT, OFFSET에 대해 알아보겠습니다. 