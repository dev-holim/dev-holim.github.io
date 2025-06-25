---
title: "PostgreSQL 14 - 뷰(View) 생성과 관리"
date: 2025-01-14 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, View, 뷰, 가상테이블]
---

# 뷰(View) 생성과 관리

## 기본 뷰 생성
```sql
-- 사용자 정보 요약 뷰
CREATE VIEW user_summary AS
SELECT username, email, age, 
       CASE WHEN age < 30 THEN 'young' ELSE 'adult' END as age_group
FROM users;

-- 게시된 포스트만 보는 뷰
CREATE VIEW published_posts AS
SELECT p.title, p.content, u.username, p.created_at
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.published = true;
```

## 복잡한 뷰
```sql
-- 사용자별 통계 뷰
CREATE VIEW user_stats AS
SELECT 
    u.username,
    u.email,
    COUNT(p.id) as total_posts,
    COUNT(CASE WHEN p.published THEN 1 END) as published_posts,
    COALESCE(AVG(LENGTH(p.content)), 0) as avg_content_length,
    MAX(p.created_at) as last_post_date
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.username, u.email;
```

## 뷰 조회와 사용
```sql
-- 뷰 사용 (테이블처럼)
SELECT * FROM user_summary WHERE age_group = 'young';
SELECT * FROM published_posts ORDER BY created_at DESC LIMIT 10;

-- 뷰에 조건 추가
SELECT username, total_posts FROM user_stats WHERE total_posts > 5;
```

## 뷰 관리
```sql
-- 뷰 목록 조회
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public';

-- 뷰 정의 확인
\d+ user_summary

-- 뷰 수정
CREATE OR REPLACE VIEW user_summary AS
SELECT username, email, age, created_at,
       CASE WHEN age < 30 THEN 'young' ELSE 'adult' END as age_group
FROM users;

-- 뷰 삭제
DROP VIEW user_summary;
DROP VIEW IF EXISTS user_summary;
```

## 업데이트 가능한 뷰
```sql
-- 단순 뷰는 UPDATE/INSERT 가능
CREATE VIEW active_users AS
SELECT id, username, email FROM users WHERE age IS NOT NULL;

-- 뷰를 통한 데이터 수정
UPDATE active_users SET email = 'new@email.com' WHERE username = 'john';
INSERT INTO active_users (username, email) VALUES ('new_user', 'new@example.com');
```

## 구체화된 뷰 (Materialized View)
```sql
-- 물리적으로 저장되는 뷰
CREATE MATERIALIZED VIEW daily_user_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_users,
    AVG(age) as avg_age
FROM users 
GROUP BY DATE(created_at);

-- 구체화된 뷰 새로고침
REFRESH MATERIALIZED VIEW daily_user_stats;

-- 동시성을 위한 새로고침
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_user_stats;
```

다음 포스트에서는 스토어드 프로시저와 함수에 대해 알아보겠습니다. 