---
title: "PostgreSQL 08 - ORDER BY, LIMIT, OFFSET"
date: 2025-01-08 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, ORDER BY, LIMIT, OFFSET, 정렬]
---

# ORDER BY, LIMIT, OFFSET

## ORDER BY 기본 사용법
```sql
-- 오름차순 정렬
SELECT * FROM users ORDER BY age;
SELECT * FROM users ORDER BY age ASC;

-- 내림차순 정렬  
SELECT * FROM users ORDER BY age DESC;

-- 여러 컬럼으로 정렬
SELECT * FROM users ORDER BY age DESC, username ASC;
```

## NULL 값 정렬
```sql
-- NULL 값을 마지막에
SELECT * FROM users ORDER BY age NULLS LAST;

-- NULL 값을 처음에
SELECT * FROM users ORDER BY age NULLS FIRST;
```

## 표현식으로 정렬
```sql
-- 계산된 값으로 정렬
SELECT *, LENGTH(username) as name_len 
FROM users ORDER BY LENGTH(username);

-- CASE 문으로 정렬
SELECT * FROM users 
ORDER BY CASE WHEN age IS NULL THEN 1 ELSE 0 END, age;
```

## LIMIT으로 결과 제한
```sql
-- 상위 5개 행만
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

-- 특정 범위의 행들 (페이징)
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;
```

## 페이징 구현
```sql
-- 1페이지 (1-10번째)
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 0;

-- 2페이지 (11-20번째)  
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 10;

-- 3페이지 (21-30번째)
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;
```

다음 포스트에서는 집계 함수에 대해 알아보겠습니다. 