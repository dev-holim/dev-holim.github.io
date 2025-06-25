---
title: "PostgreSQL 11 - JOIN (INNER, LEFT, RIGHT, FULL)"
date: 2025-01-11 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, JOIN, INNER, LEFT, RIGHT, FULL]
---

# JOIN (INNER, LEFT, RIGHT, FULL)

## INNER JOIN
```sql
-- 기본 INNER JOIN
SELECT u.username, p.title 
FROM users u
INNER JOIN posts p ON u.id = p.user_id;

-- 여러 테이블 JOIN
SELECT u.username, p.title, c.name as category
FROM users u
INNER JOIN posts p ON u.id = p.user_id
INNER JOIN categories c ON p.category_id = c.id;
```

## LEFT JOIN (LEFT OUTER JOIN)
```sql
-- 모든 사용자와 그들의 포스트 (포스트가 없어도 사용자는 표시)
SELECT u.username, p.title 
FROM users u
LEFT JOIN posts p ON u.id = p.user_id;

-- 포스트가 없는 사용자만 찾기
SELECT u.username 
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE p.id IS NULL;
```

## RIGHT JOIN (RIGHT OUTER JOIN)
```sql
-- 모든 포스트와 그들의 작성자
SELECT u.username, p.title 
FROM users u
RIGHT JOIN posts p ON u.id = p.user_id;
```

## FULL OUTER JOIN
```sql
-- 모든 사용자와 모든 포스트
SELECT u.username, p.title 
FROM users u
FULL OUTER JOIN posts p ON u.id = p.user_id;
```

## CROSS JOIN
```sql
-- 카테시안 곱 (모든 조합)
SELECT u.username, c.name 
FROM users u
CROSS JOIN categories c;
```

## 자기 JOIN (Self Join)
```sql
-- 같은 나이의 다른 사용자들 찾기
SELECT u1.username as user1, u2.username as user2, u1.age
FROM users u1
JOIN users u2 ON u1.age = u2.age AND u1.id < u2.id
WHERE u1.age IS NOT NULL;
```

## 복합 조건 JOIN
```sql
-- 여러 조건으로 JOIN
SELECT u.username, p.title 
FROM users u
JOIN posts p ON u.id = p.user_id 
    AND p.published = true 
    AND p.created_at >= u.created_at;
```

## JOIN 성능 팁
```sql
-- 인덱스를 활용한 효율적인 JOIN
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published);

-- WHERE 조건을 먼저 적용
SELECT u.username, p.title 
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.created_at >= '2024-01-01' AND p.published = true;
```

다음 포스트에서는 서브쿼리와 CTE에 대해 알아보겠습니다. 