---
title: "PostgreSQL 05 - INSERT, SELECT 기본 쿼리"
date: 2025-01-05 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, INSERT, SELECT, DML, 기초]
---

# INSERT, SELECT 기본 쿼리

데이터베이스의 핵심은 데이터를 저장하고 조회하는 것입니다. INSERT와 SELECT 문을 통해 이를 수행할 수 있습니다.

## 샘플 테이블 생성

```sql
-- 예제를 위한 테이블들 생성
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    age INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## INSERT 문

### 기본 INSERT

```sql
-- 모든 컬럼에 값 삽입
INSERT INTO users (username, email, age) 
VALUES ('john_doe', 'john@example.com', 25);

-- 일부 컬럼만 지정 (나머지는 DEFAULT 또는 NULL)
INSERT INTO users (username, email) 
VALUES ('jane_smith', 'jane@example.com');

-- SERIAL 컬럼에도 값을 직접 지정 가능
INSERT INTO users (id, username, email, age) 
VALUES (100, 'admin', 'admin@example.com', 30);
```

### 여러 행 동시 삽입

```sql
-- 여러 행을 한 번에 삽입
INSERT INTO users (username, email, age) VALUES 
('alice', 'alice@example.com', 28),
('bob', 'bob@example.com', 32),
('charlie', 'charlie@example.com', 24),
('diana', 'diana@example.com', 29);

-- 외래키가 있는 테이블에 데이터 삽입
INSERT INTO posts (user_id, title, content, published) VALUES 
(1, '첫 번째 포스트', '안녕하세요!', true),
(1, '두 번째 포스트', '두 번째 글입니다.', false),
(2, 'Jane의 첫 글', 'Jane입니다.', true),
(3, 'Alice의 일기', '오늘은 좋은 날이었습니다.', true);
```

### INSERT with RETURNING

```sql
-- 삽입된 행의 정보 반환
INSERT INTO users (username, email, age) 
VALUES ('new_user', 'new@example.com', 26)
RETURNING id, username, created_at;

-- 여러 행 삽입 후 모든 정보 반환
INSERT INTO posts (user_id, title, content) VALUES 
(1, '제목1', '내용1'),
(2, '제목2', '내용2')
RETURNING *;
```

### INSERT ... ON CONFLICT (UPSERT)

```sql
-- 중복 시 아무것도 하지 않음
INSERT INTO users (username, email, age) 
VALUES ('john_doe', 'john_new@example.com', 26)
ON CONFLICT (username) DO NOTHING;

-- 중복 시 업데이트
INSERT INTO users (username, email, age) 
VALUES ('john_doe', 'john_updated@example.com', 27)
ON CONFLICT (username) 
DO UPDATE SET 
    email = EXCLUDED.email,
    age = EXCLUDED.age,
    created_at = CURRENT_TIMESTAMP;
```

## SELECT 문

### 기본 SELECT

```sql
-- 모든 컬럼 조회
SELECT * FROM users;

-- 특정 컬럼만 조회
SELECT username, email FROM users;

-- 컬럼에 별칭 지정
SELECT 
    username AS 사용자명,
    email AS 이메일,
    age AS 나이
FROM users;

-- 계산된 컬럼
SELECT 
    username,
    age,
    age + 10 AS age_plus_ten,
    CURRENT_TIMESTAMP - created_at AS account_age
FROM users;
```

### 조건부 조회

```sql
-- 나이가 25 이상인 사용자
SELECT * FROM users WHERE age >= 25;

-- 특정 사용자명 조회
SELECT * FROM users WHERE username = 'john_doe';

-- 이메일에 특정 도메인이 포함된 사용자
SELECT * FROM users WHERE email LIKE '%@example.com';

-- 여러 조건 (AND, OR)
SELECT * FROM users 
WHERE age >= 25 AND email LIKE '%@example.com';

SELECT * FROM users 
WHERE age < 25 OR username LIKE 'a%';
```

### NULL 처리

```sql
-- NULL 값이 있는 행 조회
SELECT * FROM users WHERE age IS NULL;

-- NULL이 아닌 행 조회
SELECT * FROM users WHERE age IS NOT NULL;

-- NULL 값을 기본값으로 대체
SELECT 
    username,
    COALESCE(age, 0) AS age_with_default,
    CASE 
        WHEN age IS NULL THEN '미입력'
        WHEN age < 30 THEN '젊음'
        ELSE '성숙'
    END AS age_group
FROM users;
```

### 패턴 매칭

```sql
-- LIKE 패턴 매칭
SELECT * FROM users WHERE username LIKE 'j%';      -- j로 시작
SELECT * FROM users WHERE username LIKE '%_doe';   -- _doe로 끝남
SELECT * FROM users WHERE email LIKE '%@%';        -- @가 포함됨

-- ILIKE (대소문자 무시)
SELECT * FROM users WHERE username ILIKE 'JOHN%';

-- 정규표현식
SELECT * FROM users WHERE username ~ '^[a-c]';     -- a, b, c로 시작
SELECT * FROM users WHERE email !~ '\.com$';       -- .com으로 끝나지 않음
```

### IN과 BETWEEN

```sql
-- IN 연산자
SELECT * FROM users WHERE age IN (25, 28, 30);
SELECT * FROM users WHERE username IN ('john_doe', 'jane_smith');

-- NOT IN
SELECT * FROM users WHERE age NOT IN (25, 30);

-- BETWEEN 연산자
SELECT * FROM users WHERE age BETWEEN 25 AND 30;
SELECT * FROM users WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';
```

### 서브쿼리

```sql
-- 스칼라 서브쿼리 (단일 값 반환)
SELECT 
    username,
    (SELECT COUNT(*) FROM posts WHERE posts.user_id = users.id) AS post_count
FROM users;

-- EXISTS 서브쿼리
SELECT * FROM users 
WHERE EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.user_id = users.id AND published = true
);

-- IN 서브쿼리
SELECT * FROM users 
WHERE id IN (
    SELECT DISTINCT user_id FROM posts WHERE published = true
);
```

### DISTINCT

```sql
-- 중복 제거
SELECT DISTINCT age FROM users WHERE age IS NOT NULL;

-- 여러 컬럼 조합의 중복 제거
SELECT DISTINCT 
    EXTRACT(YEAR FROM created_at) AS year,
    EXTRACT(MONTH FROM created_at) AS month
FROM users;

-- DISTINCT ON (PostgreSQL 특화 기능)
SELECT DISTINCT ON (user_id) 
    user_id, title, created_at
FROM posts 
ORDER BY user_id, created_at DESC;  -- 사용자별 최신 포스트
```

### 함수와 연산자

```sql
-- 문자열 함수
SELECT 
    UPPER(username) AS username_upper,
    LENGTH(email) AS email_length,
    SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1) AS email_username
FROM users;

-- 수학 함수
SELECT 
    age,
    ROUND(age / 10.0, 1) AS age_decade,
    age % 10 AS age_remainder,
    POWER(age, 2) AS age_squared
FROM users
WHERE age IS NOT NULL;

-- 날짜 함수
SELECT 
    username,
    created_at,
    EXTRACT(YEAR FROM created_at) AS year_created,
    AGE(created_at) AS account_age,
    created_at + INTERVAL '1 year' AS one_year_later
FROM users;
```

### CASE 문

```sql
-- 조건부 값 반환
SELECT 
    username,
    age,
    CASE 
        WHEN age < 20 THEN '10대'
        WHEN age < 30 THEN '20대'
        WHEN age < 40 THEN '30대'
        ELSE '40대 이상'
    END AS age_group,
    CASE 
        WHEN age IS NULL THEN '나이 미입력'
        WHEN age >= 30 THEN '성인'
        ELSE '젊은층'
    END AS category
FROM users;
```

### SELECT INTO

```sql
-- 쿼리 결과로 새 테이블 생성
SELECT username, email, age 
INTO temp_users 
FROM users 
WHERE age >= 25;

-- 임시 테이블 생성
SELECT * 
INTO TEMPORARY TABLE session_users 
FROM users 
WHERE created_at >= CURRENT_DATE;
```

다음 포스트에서는 UPDATE, DELETE 쿼리에 대해 알아보겠습니다. 