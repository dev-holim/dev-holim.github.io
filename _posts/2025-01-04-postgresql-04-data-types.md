---
title: "PostgreSQL 04 - 데이터 타입 이해하기"
date: 2025-01-04 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, 데이터타입, 기초, 스키마]
---

# 데이터 타입 이해하기

PostgreSQL은 풍부한 데이터 타입을 지원하여 다양한 애플리케이션 요구사항을 충족할 수 있습니다.

## 숫자 타입

### 정수 타입

```sql
-- 정수 타입 예제
CREATE TABLE numeric_examples (
    tiny_num SMALLINT,        -- -32,768 ~ 32,767 (2바이트)
    regular_num INTEGER,      -- -2,147,483,648 ~ 2,147,483,647 (4바이트)
    big_num BIGINT,          -- -9,223,372,036,854,775,808 ~ 9,223,372,036,854,775,807 (8바이트)
    auto_id SERIAL,          -- 자동 증가 정수 (INTEGER + 시퀀스)
    big_auto_id BIGSERIAL    -- 자동 증가 큰 정수 (BIGINT + 시퀀스)
);
```

### 부동소수점과 고정소수점

```sql
-- 실수 타입 예제
CREATE TABLE decimal_examples (
    float_num REAL,                    -- 4바이트 부동소수점
    double_num DOUBLE PRECISION,       -- 8바이트 부동소수점
    exact_decimal DECIMAL(10,2),       -- 정확한 소수점 (10자리 중 2자리가 소수)
    money_amount NUMERIC(15,2),        -- 정확한 숫자 (돈 계산용)
    percentage DECIMAL(5,2)            -- 백분율용 (999.99까지)
);

-- 예제 데이터
INSERT INTO decimal_examples VALUES 
(3.14159, 3.141592653589793, 1234.56, 999999.99, 85.75);
```

## 문자 타입

```sql
-- 문자열 타입 예제
CREATE TABLE text_examples (
    fixed_char CHAR(10),        -- 고정 길이 (항상 10자리, 공백으로 패딩)
    var_char VARCHAR(50),       -- 가변 길이 (최대 50자리)
    unlimited_text TEXT,        -- 무제한 길이 텍스트
    name_field VARCHAR(100) NOT NULL
);

-- 문자열 함수 예제
SELECT 
    LENGTH('Hello World'),           -- 11
    UPPER('hello'),                  -- 'HELLO'
    LOWER('WORLD'),                  -- 'world'
    SUBSTRING('PostgreSQL', 1, 8),   -- 'Postgres'
    CONCAT('Hello', ' ', 'World'),   -- 'Hello World'
    TRIM('  spaces  ');              -- 'spaces'
```

## 날짜와 시간 타입

```sql
-- 날짜/시간 타입 예제
CREATE TABLE datetime_examples (
    birth_date DATE,                           -- 날짜만 (1000-01-01 ~ 9999-12-31)
    appointment_time TIME,                     -- 시간만 (00:00:00 ~ 24:00:00)
    created_at TIMESTAMP,                      -- 날짜 + 시간 (타임존 없음)
    updated_at TIMESTAMPTZ,                    -- 날짜 + 시간 (타임존 있음)
    work_duration INTERVAL                     -- 시간 간격
);

-- 날짜/시간 함수 예제
SELECT 
    NOW(),                                     -- 현재 날짜시간
    CURRENT_DATE,                              -- 현재 날짜
    CURRENT_TIME,                              -- 현재 시간
    EXTRACT(YEAR FROM NOW()),                  -- 연도 추출
    AGE('2000-01-01'),                         -- 나이 계산
    DATE_TRUNC('month', NOW()),                -- 월 단위로 절사
    NOW() + INTERVAL '1 day',                  -- 하루 후
    NOW() - INTERVAL '3 hours';                -- 3시간 전
```

## 불린 타입

```sql
-- 불린 타입 예제
CREATE TABLE boolean_examples (
    is_active BOOLEAN DEFAULT true,
    is_verified BOOL,                    -- BOOLEAN과 동일
    settings JSONB
);

-- 불린 값 사용
INSERT INTO boolean_examples VALUES 
(true, false, '{"notifications": true}'),
(false, true, '{"dark_mode": false}'),
(NULL, NULL, '{}');  -- NULL도 가능
```

## JSON 타입

```sql
-- JSON 타입 예제
CREATE TABLE json_examples (
    data JSON,                          -- JSON 텍스트 저장
    structured_data JSONB,              -- 바이너리 JSON (더 효율적)
    metadata JSONB DEFAULT '{}'
);

-- JSON 데이터 삽입
INSERT INTO json_examples VALUES 
('{"name": "John", "age": 30}', 
 '{"preferences": {"theme": "dark", "language": "ko"}}',
 '{"created_by": "system"}');

-- JSON 쿼리 예제
SELECT 
    data->>'name' AS name,                    -- JSON 텍스트 추출
    structured_data->'preferences'->>'theme' AS theme,  -- 중첩 JSON 추출
    structured_data ? 'preferences' AS has_preferences  -- 키 존재 확인
FROM json_examples;
```

## 배열 타입

```sql
-- 배열 타입 예제
CREATE TABLE array_examples (
    tags TEXT[],                        -- 텍스트 배열
    scores INTEGER[],                   -- 정수 배열
    schedule TIME[],                    -- 시간 배열
    matrix INTEGER[][]                  -- 다차원 배열
);

-- 배열 데이터 삽입
INSERT INTO array_examples VALUES 
(ARRAY['tag1', 'tag2', 'tag3'],
 ARRAY[85, 90, 78, 92],
 ARRAY['09:00'::TIME, '14:00'::TIME, '18:00'::TIME],
 ARRAY[[1, 2], [3, 4]]);

-- 배열 쿼리 예제
SELECT 
    tags[1] AS first_tag,              -- 첫 번째 요소
    array_length(scores, 1) AS score_count,  -- 배열 길이
    85 = ANY(scores) AS has_85,        -- 값 포함 확인
    UNNEST(tags) AS tag                -- 배열을 행으로 분해
FROM array_examples;
```

## UUID 타입

```sql
-- UUID 확장 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- UUID 타입 예제
CREATE TABLE uuid_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID,
    user_token UUID
);

-- UUID 생성 예제
SELECT 
    uuid_generate_v1(),    -- MAC 주소 기반
    uuid_generate_v4(),    -- 랜덤 기반
    gen_random_uuid();     -- 암호학적으로 안전한 랜덤
```

## 기하학적 타입

```sql
-- 기하학적 타입 예제
CREATE TABLE geometric_examples (
    location POINT,                     -- 점 (x, y)
    area_box BOX,                      -- 직사각형
    route_line LINE,                   -- 직선
    boundaries POLYGON,                -- 다각형
    radius CIRCLE                      -- 원
);

-- 기하학적 데이터 삽입
INSERT INTO geometric_examples VALUES 
(POINT(37.5665, 126.9780),           -- 서울 좌표
 BOX(POINT(0,0), POINT(100,100)),    -- 정사각형
 LINE(POINT(0,0), POINT(1,1)),       -- 대각선
 POLYGON('((0,0),(0,10),(10,10),(10,0))'),  -- 사각형
 CIRCLE(POINT(50,50), 25));          -- 중심(50,50), 반지름 25
```

## 사용자 정의 타입

```sql
-- ENUM 타입 생성
CREATE TYPE status_type AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- 복합 타입 생성
CREATE TYPE address_type AS (
    street VARCHAR(100),
    city VARCHAR(50),
    zipcode VARCHAR(10),
    country VARCHAR(50)
);

-- 사용자 정의 타입 사용
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    status status_type DEFAULT 'pending',
    shipping_address address_type,
    billing_address address_type
);
```

## 타입 변환

```sql
-- 명시적 타입 변환
SELECT 
    '123'::INTEGER,                    -- 문자열을 정수로
    123::TEXT,                         -- 정수를 문자열로
    '2024-01-01'::DATE,               -- 문자열을 날짜로
    CAST('3.14' AS DECIMAL(10,2)),    -- CAST 함수 사용
    '2024-01-01 10:30:00'::TIMESTAMP; -- 문자열을 타임스탬프로

-- 타입 정보 조회
SELECT 
    pg_typeof(123),                    -- integer
    pg_typeof('hello'),                -- unknown
    pg_typeof(NOW()),                  -- timestamp with time zone
    pg_typeof(ARRAY[1,2,3]);          -- integer[]
```

다음 포스트에서는 INSERT, SELECT 기본 쿼리에 대해 알아보겠습니다. 