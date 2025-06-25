---
title: "PostgreSQL 27: JSON과 NoSQL 기능 완전 정복"
date: 2025-01-27 00:00:00 +0900
categories: [Database, PostgreSQL]
tags: [postgresql, json, jsonb, nosql, document-database, indexing]
---

## PostgreSQL의 JSON 지원

PostgreSQL은 강력한 JSON 지원을 통해 관계형 데이터베이스와 문서형 데이터베이스의 장점을 모두 제공합니다.

### JSON vs JSONB

```sql
-- JSON 타입 (텍스트 저장, 키 순서 유지)
CREATE TABLE documents_json (
    id SERIAL PRIMARY KEY,
    data JSON
);

-- JSONB 타입 (바이너리 저장, 더 효율적)
CREATE TABLE documents_jsonb (
    id SERIAL PRIMARY KEY,
    data JSONB
);
```

### 기본 JSON 데이터 삽입

```sql
-- JSON 데이터 삽입
INSERT INTO documents_jsonb (data) VALUES 
('{"name": "홍길동", "age": 30, "skills": ["Java", "Python"], "address": {"city": "서울", "district": "강남구"}}'),
('{"name": "김영희", "age": 25, "skills": ["JavaScript", "React"], "address": {"city": "부산", "district": "해운대구"}}'),
('{"name": "이철수", "age": 35, "skills": ["PostgreSQL", "MongoDB"], "address": {"city": "대구", "district": "수성구"}}');
```

## JSON 데이터 조회와 조작

### 기본 조회 연산자

```sql
-- -> 연산자: JSON 객체에서 값 추출 (텍스트 반환)
SELECT data->'name' as name FROM documents_jsonb;

-- ->> 연산자: JSON 객체에서 값 추출 (텍스트 형태)
SELECT data->>'name' as name FROM documents_jsonb;

-- 중첩된 객체 접근
SELECT data->'address'->>'city' as city FROM documents_jsonb;

-- 배열 인덱스 접근
SELECT data->'skills'->0 as first_skill FROM documents_jsonb;
```

### JSON 경로 쿼리

```sql
-- #> 연산자: 경로 배열로 값 추출
SELECT data #> '{address,city}' as city FROM documents_jsonb;

-- #>> 연산자: 경로 배열로 텍스트 추출
SELECT data #>> '{address,city}' as city FROM documents_jsonb;

-- jsonb_path_query: JSON Path 표현식 사용
SELECT jsonb_path_query(data, '$.skills[*]') as skill 
FROM documents_jsonb;
```

### 조건부 검색

```sql
-- 특정 키 존재 여부 확인
SELECT * FROM documents_jsonb 
WHERE data ? 'age';

-- 특정 값을 가진 문서 검색
SELECT * FROM documents_jsonb 
WHERE data->>'name' = '홍길동';

-- 숫자 비교
SELECT * FROM documents_jsonb 
WHERE (data->>'age')::int > 30;

-- 배열 포함 여부 확인
SELECT * FROM documents_jsonb 
WHERE data->'skills' ? 'Python';

-- JSONB 연산자 활용
SELECT * FROM documents_jsonb 
WHERE data @> '{"address": {"city": "서울"}}';
```

## JSON 데이터 수정

### 데이터 업데이트

```sql
-- jsonb_set: 특정 경로의 값 수정
UPDATE documents_jsonb 
SET data = jsonb_set(data, '{age}', '31')
WHERE data->>'name' = '홍길동';

-- 중첩된 값 수정
UPDATE documents_jsonb 
SET data = jsonb_set(data, '{address,district}', '"종로구"')
WHERE data->>'name' = '홍길동';

-- 배열에 요소 추가
UPDATE documents_jsonb 
SET data = jsonb_set(data, '{skills}', (data->'skills') || '["Spring"]')
WHERE data->>'name' = '홍길동';
```

### 키 추가 및 제거

```sql
-- 새 키 추가
UPDATE documents_jsonb 
SET data = data || '{"email": "hong@example.com"}'
WHERE data->>'name' = '홍길동';

-- 키 제거
UPDATE documents_jsonb 
SET data = data - 'email'
WHERE data->>'name' = '홍길동';

-- 중첩된 키 제거
UPDATE documents_jsonb 
SET data = data #- '{address,district}'
WHERE data->>'name' = '홍길동';
```

## JSON 인덱싱

### GIN 인덱스 생성

```sql
-- 전체 JSONB 컬럼에 GIN 인덱스
CREATE INDEX idx_documents_data_gin ON documents_jsonb USING gin (data);

-- 특정 경로에 대한 인덱스
CREATE INDEX idx_documents_name ON documents_jsonb USING gin ((data->>'name'));
CREATE INDEX idx_documents_age ON documents_jsonb USING gin (((data->>'age')::int));

-- 특정 중첩 경로 인덱스
CREATE INDEX idx_documents_city ON documents_jsonb USING gin ((data->'address'->>'city'));
```

### 부분 인덱스 활용

```sql
-- 조건부 인덱스
CREATE INDEX idx_documents_active_users ON documents_jsonb USING gin (data)
WHERE data->>'status' = 'active';

-- 표현식 인덱스
CREATE INDEX idx_documents_skills_array ON documents_jsonb USING gin ((data->'skills'));
```

## 고급 JSON 함수와 연산자

### JSON 집계 함수

```sql
-- JSON 객체들을 배열로 집계
SELECT json_agg(data) as all_documents 
FROM documents_jsonb;

-- 특정 키들만 객체로 집계
SELECT json_object_agg(data->>'name', data->>'age') as name_age_map
FROM documents_jsonb;

-- JSONB 배열 요소들을 행으로 확장
SELECT jsonb_array_elements_text(data->'skills') as skill
FROM documents_jsonb;
```

### JSON 스키마 검증

```sql
-- 사용자 정의 함수로 스키마 검증
CREATE OR REPLACE FUNCTION validate_user_schema(doc JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        doc ? 'name' AND 
        doc ? 'age' AND 
        doc ? 'skills' AND
        jsonb_typeof(doc->'name') = 'string' AND
        jsonb_typeof(doc->'age') = 'number' AND
        jsonb_typeof(doc->'skills') = 'array'
    );
END;
$$ LANGUAGE plpgsql;

-- 체크 제약조건으로 스키마 강제
ALTER TABLE documents_jsonb 
ADD CONSTRAINT valid_user_schema 
CHECK (validate_user_schema(data));
```

## 문서형 데이터베이스 패턴

### 컬렉션 시뮬레이션

```sql
-- 문서 타입별 테이블 생성
CREATE TABLE users_collection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_users_collection_gin ON users_collection USING gin (document);

-- 문서 삽입
INSERT INTO users_collection (document) VALUES 
('{"type": "user", "name": "홍길동", "email": "hong@example.com", "profile": {"bio": "개발자", "location": "서울"}}');
```

### 다형성 문서 처리

```sql
-- 다양한 타입의 문서 저장
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- 타입별 인덱스
CREATE INDEX idx_entities_type ON entities (entity_type);
CREATE INDEX idx_entities_data_gin ON entities USING gin (data);

-- 다양한 엔티티 삽입
INSERT INTO entities (entity_type, data) VALUES 
('user', '{"name": "홍길동", "email": "hong@example.com"}'),
('product', '{"name": "MacBook", "price": 2000000, "category": "laptop"}'),
('order', '{"user_id": "123", "products": [{"id": "456", "quantity": 1}], "total": 2000000}');
```

### 관계형 + 문서형 하이브리드

```sql
-- 하이브리드 접근법
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    profile JSONB,
    preferences JSONB
);

-- 구조화된 데이터는 컬럼으로, 유연한 데이터는 JSON으로
INSERT INTO users (email, profile, preferences) VALUES 
('user@example.com', 
 '{"name": "홍길동", "bio": "개발자", "avatar_url": "/avatars/hong.jpg"}',
 '{"theme": "dark", "language": "ko", "notifications": {"email": true, "push": false}}');
```

## 성능 최적화

### 효율적인 쿼리 작성

```sql
-- 비효율적: 함수 사용
SELECT * FROM documents_jsonb 
WHERE jsonb_extract_path_text(data, 'name') = '홍길동';

-- 효율적: 연산자 사용
SELECT * FROM documents_jsonb 
WHERE data->>'name' = '홍길동';

-- 복합 조건의 최적화
SELECT * FROM documents_jsonb 
WHERE data @> '{"address": {"city": "서울"}}' 
  AND (data->>'age')::int BETWEEN 25 AND 35;
```

### 통계와 분석

```sql
-- JSON 키 통계
SELECT 
    key,
    count(*) as frequency
FROM documents_jsonb, jsonb_object_keys(data) as key
GROUP BY key
ORDER BY frequency DESC;

-- 값 분포 분석
SELECT 
    data->>'age' as age_group,
    count(*) as count
FROM documents_jsonb
WHERE data ? 'age'
GROUP BY data->>'age'
ORDER BY count DESC;
```

## 실무 활용 예제

### 사용자 활동 로그 시스템

```sql
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT now()
);

-- 인덱스 설정
CREATE INDEX idx_activity_logs_user_id ON activity_logs (user_id);
CREATE INDEX idx_activity_logs_event_type ON activity_logs (event_type);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs (timestamp);
CREATE INDEX idx_activity_logs_event_data_gin ON activity_logs USING gin (event_data);

-- 활동 로그 삽입
INSERT INTO activity_logs (user_id, event_type, event_data) VALUES 
(1, 'login', '{"ip": "192.168.1.100", "user_agent": "Chrome/91.0", "success": true}'),
(1, 'page_view', '{"page": "/dashboard", "duration": 120, "referrer": "/login"}'),
(2, 'purchase', '{"product_id": 123, "amount": 50000, "payment_method": "card"}');

-- 복잡한 분석 쿼리
SELECT 
    event_type,
    count(*) as total_events,
    count(DISTINCT user_id) as unique_users,
    avg((event_data->>'duration')::int) as avg_duration
FROM activity_logs 
WHERE timestamp >= now() - interval '7 days'
  AND event_data ? 'duration'
GROUP BY event_type;
```

PostgreSQL의 JSON 기능을 활용하면 관계형 데이터베이스의 강력함과 문서형 데이터베이스의 유연함을 동시에 얻을 수 있습니다. 다음 글에서는 PostgreSQL의 확장 기능과 플러그인에 대해 알아보겠습니다. 