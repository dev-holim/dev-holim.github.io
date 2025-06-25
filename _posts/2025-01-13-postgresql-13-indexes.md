---
title: "PostgreSQL 13 - 인덱스 생성과 활용"
date: 2025-01-13 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, Index, 인덱스, 성능최적화]
---

# 인덱스 생성과 활용

## 기본 인덱스 생성
```sql
-- B-tree 인덱스 (기본)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_published ON posts(published);

-- 복합 인덱스
CREATE INDEX idx_posts_user_published ON posts(user_id, published);

-- 유니크 인덱스
CREATE UNIQUE INDEX idx_users_username ON users(username);
```

## 인덱스 타입
```sql
-- Hash 인덱스 (등호 조건만)
CREATE INDEX idx_users_age_hash ON users USING HASH(age);

-- GIN 인덱스 (배열, JSONB용)
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- GiST 인덱스 (전문검색, 지리정보)
CREATE INDEX idx_posts_content_gist ON posts USING GIST(to_tsvector('korean', content));
```

## 부분 인덱스
```sql
-- 조건부 인덱스 (published된 포스트만)
CREATE INDEX idx_published_posts ON posts(created_at) 
WHERE published = true;

-- NULL이 아닌 값만
CREATE INDEX idx_users_age_not_null ON users(age) 
WHERE age IS NOT NULL;
```

## 함수 기반 인덱스
```sql
-- 소문자 변환 인덱스
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- 날짜 부분 인덱스
CREATE INDEX idx_posts_year ON posts(EXTRACT(YEAR FROM created_at));
```

## 인덱스 관리
```sql
-- 인덱스 목록 조회
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users';

-- 인덱스 사용량 확인
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats 
WHERE tablename = 'users';

-- 인덱스 재구성
REINDEX INDEX idx_users_email;
REINDEX TABLE users;

-- 인덱스 삭제
DROP INDEX idx_users_email;
```

다음 포스트에서는 뷰(View) 생성과 관리에 대해 알아보겠습니다. 