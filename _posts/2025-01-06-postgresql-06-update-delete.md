---
title: "PostgreSQL 06 - UPDATE, DELETE 쿼리"
date: 2025-01-06 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, UPDATE, DELETE, DML]
---

# UPDATE, DELETE 쿼리

## UPDATE 문

### 기본 UPDATE
```sql
-- 단일 컬럼 업데이트
UPDATE users SET age = 26 WHERE username = 'john_doe';

-- 여러 컬럼 업데이트
UPDATE users SET 
    email = 'john.doe@newdomain.com',
    age = 27
WHERE username = 'john_doe';

-- 계산식을 사용한 업데이트
UPDATE users SET age = age + 1;
```

### 조건부 UPDATE
```sql
-- WHERE 조건으로 특정 행만 업데이트
UPDATE posts SET published = true 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- 서브쿼리를 사용한 업데이트
UPDATE users SET age = 30 
WHERE id IN (SELECT user_id FROM posts WHERE published = true);
```

### UPDATE with RETURNING
```sql
UPDATE users SET age = age + 1 
WHERE age < 30 
RETURNING id, username, age;
```

### UPDATE with JOIN
```sql
-- PostgreSQL의 FROM 절 사용
UPDATE posts SET published = true 
FROM users 
WHERE posts.user_id = users.id 
  AND users.username = 'john_doe';
```

## DELETE 문

### 기본 DELETE
```sql
-- 조건에 맞는 행 삭제
DELETE FROM posts WHERE published = false;

-- 모든 행 삭제 (주의!)
DELETE FROM temp_table;

-- 특정 사용자의 모든 포스트 삭제
DELETE FROM posts WHERE user_id = 1;
```

### DELETE with RETURNING
```sql
DELETE FROM users WHERE age IS NULL 
RETURNING id, username, email;
```

### CASCADE 삭제
```sql
-- 외래키 제약조건이 CASCADE로 설정된 경우
DELETE FROM users WHERE username = 'john_doe';
-- 관련된 posts도 자동 삭제됨
```

## UPSERT (INSERT ... ON CONFLICT)
```sql
-- 중복 시 업데이트
INSERT INTO users (username, email, age) 
VALUES ('john_doe', 'john@updated.com', 28)
ON CONFLICT (username) 
DO UPDATE SET 
    email = EXCLUDED.email,
    age = EXCLUDED.age;
```

## 트랜잭션과 안전성
```sql
BEGIN;
    UPDATE users SET age = 99 WHERE username = 'test';
    -- 결과 확인 후
ROLLBACK; -- 또는 COMMIT;
```

다음 포스트에서는 WHERE 절과 조건문에 대해 자세히 알아보겠습니다. 