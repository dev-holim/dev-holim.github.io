---
title: "PostgreSQL 18 - 권한 관리와 보안"
date: 2025-01-18 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, Security, 권한, 보안, 사용자관리]
---

# 권한 관리와 보안

## 사용자 생성과 관리
```sql
-- 사용자 생성
CREATE USER app_user WITH PASSWORD 'secure_password';
CREATE USER readonly_user WITH PASSWORD 'read_password';

-- 역할 생성
CREATE ROLE app_role;
CREATE ROLE read_role;

-- 사용자에게 역할 부여
GRANT app_role TO app_user;
GRANT read_role TO readonly_user;
```

## 데이터베이스 권한
```sql
-- 데이터베이스 접근 권한
GRANT CONNECT ON DATABASE myapp TO app_user;
GRANT CONNECT ON DATABASE myapp TO readonly_user;

-- 스키마 사용 권한
GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
```

## 테이블 권한
```sql
-- 모든 권한 부여
GRANT ALL PRIVILEGES ON TABLE users TO app_user;

-- 선택적 권한 부여
GRANT SELECT ON TABLE users TO readonly_user;
GRANT SELECT, INSERT, UPDATE ON TABLE posts TO app_user;

-- 미래에 생성될 테이블에 대한 기본 권한
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO readonly_user;

-- 시퀀스 권한
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

## 컬럼 수준 권한
```sql
-- 특정 컬럼만 접근 허용
GRANT SELECT (username, email) ON TABLE users TO limited_user;
GRANT UPDATE (email) ON TABLE users TO limited_user;
```

## 권한 취소
```sql
-- 권한 제거
REVOKE INSERT ON TABLE users FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE users FROM readonly_user;

-- 연쇄 권한 취소
REVOKE ALL PRIVILEGES ON TABLE users FROM app_user CASCADE;
```

## Row Level Security (RLS)
```sql
-- RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (사용자는 자신의 포스트만 볼 수 있음)
CREATE POLICY user_posts_policy ON posts
    FOR ALL TO app_users
    USING (user_id = current_setting('app.current_user_id')::integer);

-- 정책 적용
ALTER TABLE posts FORCE ROW LEVEL SECURITY;
```

## 암호화
```sql
-- pgcrypto 확장 설치
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 패스워드 해싱
INSERT INTO users (username, password_hash) 
VALUES ('user1', crypt('my_password', gen_salt('bf')));

-- 패스워드 검증
SELECT username FROM users 
WHERE username = 'user1' 
  AND password_hash = crypt('my_password', password_hash);
```

## 연결 보안
```sql
-- SSL 연결 강제
ALTER USER app_user SET ssl = on;

-- 특정 IP에서만 접근 허용 (pg_hba.conf)
-- host myapp app_user 192.168.1.0/24 md5
```

## 감사 로깅
```sql
-- 로그 설정 (postgresql.conf)
-- log_statement = 'all'
-- log_connections = on
-- log_disconnections = on

-- 권한 확인 쿼리
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE grantee = 'app_user';
```

다음 포스트에서는 백업과 복원에 대해 알아보겠습니다. 