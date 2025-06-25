---
title: "PostgreSQL 15 - 스토어드 프로시저와 함수"
date: 2025-01-15 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, Function, Procedure, 함수, 프로시저]
---

# 스토어드 프로시저와 함수

## 기본 함수 생성
```sql
-- 간단한 함수
CREATE OR REPLACE FUNCTION get_user_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM users);
END;
$$ LANGUAGE plpgsql;

-- 함수 호출
SELECT get_user_count();
```

## 매개변수가 있는 함수
```sql
-- 나이별 사용자 수
CREATE OR REPLACE FUNCTION get_users_by_age(min_age INTEGER, max_age INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) FROM users 
        WHERE age BETWEEN min_age AND max_age
    );
END;
$$ LANGUAGE plpgsql;

-- 함수 호출
SELECT get_users_by_age(20, 30);
```

## 테이블 반환 함수
```sql
-- 사용자 통계 반환
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE(username TEXT, post_count BIGINT, avg_content_length NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT u.username::TEXT, 
           COUNT(p.id), 
           COALESCE(AVG(LENGTH(p.content)), 0)
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    GROUP BY u.id, u.username;
END;
$$ LANGUAGE plpgsql;

-- 함수 호출
SELECT * FROM get_user_stats();
```

## 프로시저 (PostgreSQL 11+)
```sql
-- 사용자 생성 프로시저
CREATE OR REPLACE PROCEDURE create_user(
    p_username TEXT,
    p_email TEXT,
    p_age INTEGER DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO users (username, email, age) 
    VALUES (p_username, p_email, p_age);
    
    COMMIT;
END;
$$;

-- 프로시저 호출
CALL create_user('new_user', 'new@example.com', 25);
```

## 예외 처리
```sql
CREATE OR REPLACE FUNCTION safe_create_user(p_username TEXT, p_email TEXT)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO users (username, email) VALUES (p_username, p_email);
    RETURN 'User created successfully';
EXCEPTION
    WHEN unique_violation THEN
        RETURN 'Username already exists';
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

## 함수 관리
```sql
-- 함수 목록 조회
SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname LIKE 'get_%';

-- 함수 삭제
DROP FUNCTION get_user_count();
DROP FUNCTION IF EXISTS get_users_by_age(INTEGER, INTEGER);
```

다음 포스트에서는 트리거에 대해 알아보겠습니다. 