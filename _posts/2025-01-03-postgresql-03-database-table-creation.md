---
title: "PostgreSQL 03 - 데이터베이스와 테이블 생성"
date: 2025-01-03 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, DDL, 데이터베이스, 테이블, 생성]
---

# 데이터베이스와 테이블 생성

## 데이터베이스 생성

```sql
-- 기본 데이터베이스 생성
CREATE DATABASE myapp;

-- 소유자 지정하여 생성
CREATE DATABASE myapp OWNER myuser;

-- 인코딩과 로케일 지정
CREATE DATABASE myapp
    OWNER myuser
    ENCODING 'UTF8'
    LC_COLLATE = 'ko_KR.UTF-8'
    LC_CTYPE = 'ko_KR.UTF-8';

-- 템플릿 데이터베이스 사용
CREATE DATABASE myapp TEMPLATE template0;
```

## 데이터베이스 관리

```sql
-- 데이터베이스 목록 조회
\l
-- 또는
SELECT datname FROM pg_database;

-- 데이터베이스 정보 조회
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) as size,
    datcollate,
    datctype
FROM pg_database;

-- 데이터베이스 삭제
DROP DATABASE myapp;

-- 활성 연결이 있는 데이터베이스 강제 삭제
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'myapp'
  AND pid <> pg_backend_pid();

DROP DATABASE myapp;
```

## 스키마 생성

```sql
-- 스키마 생성
CREATE SCHEMA sales;
CREATE SCHEMA hr AUTHORIZATION hr_manager;

-- 스키마 목록 조회
\dn

-- 검색 경로 설정
SET search_path TO sales, public;
SHOW search_path;
```

## 테이블 생성

### 기본 테이블 생성

```sql
-- 간단한 테이블 생성
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 제약조건이 있는 테이블
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) CHECK (price > 0),
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 고급 테이블 생성

```sql
-- 외래키와 인덱스가 있는 테이블
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE,
        
    CONSTRAINT chk_status
        CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'))
);

-- 인덱스 생성
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);
```

## 테이블 구조 수정

```sql
-- 컬럼 추가
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- 컬럼 타입 변경
ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(30);

-- 컬럼 이름 변경
ALTER TABLE users RENAME COLUMN phone TO phone_number;

-- 컬럼 삭제
ALTER TABLE users DROP COLUMN phone_number;

-- NOT NULL 제약조건 추가
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- DEFAULT 값 설정
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 제약조건 추가
ALTER TABLE users ADD CONSTRAINT chk_username_length 
    CHECK (LENGTH(username) >= 3);

-- 제약조건 삭제
ALTER TABLE users DROP CONSTRAINT chk_username_length;
```

## 테이블 정보 조회

```sql
-- 테이블 목록 조회
\dt

-- 특정 스키마의 테이블
\dt schema_name.*

-- 테이블 구조 보기
\d table_name

-- 테이블 크기 조회
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public';

-- 컬럼 정보 상세 조회
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users';
```

## 테이블 삭제

```sql
-- 테이블 삭제
DROP TABLE users;

-- 의존성이 있는 테이블 강제 삭제
DROP TABLE users CASCADE;

-- 조건부 삭제 (존재할 경우에만)
DROP TABLE IF EXISTS users;

-- 여러 테이블 동시 삭제
DROP TABLE users, products, orders;
```

## 임시 테이블

```sql
-- 세션용 임시 테이블
CREATE TEMP TABLE temp_data (
    id SERIAL,
    value TEXT
);

-- 트랜잭션용 임시 테이블
CREATE TEMPORARY TABLE temp_calc (
    calculation_result DECIMAL
) ON COMMIT DROP;
```

다음 포스트에서는 PostgreSQL의 다양한 데이터 타입에 대해 알아보겠습니다. 