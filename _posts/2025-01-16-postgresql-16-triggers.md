---
title: "PostgreSQL 16 - 트리거(Trigger) 작성"
date: 2025-01-16 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, Trigger, 트리거, 자동화]
---

# 트리거(Trigger) 작성

## 기본 트리거
```sql
-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER users_update_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_time();
```

## AFTER 트리거
```sql
-- 로그 테이블 생성
CREATE TABLE user_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(10),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB
);

-- 감사 로그 함수
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO user_audit_log (user_id, action, old_values)
        VALUES (OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO user_audit_log (user_id, action, old_values, new_values)
        VALUES (NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO user_audit_log (user_id, action, new_values)
        VALUES (NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER user_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_changes();
```

## 조건부 트리거
```sql
-- 특정 조건에서만 실행되는 트리거
CREATE TRIGGER users_important_update
    AFTER UPDATE OF email, username ON users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.username IS DISTINCT FROM NEW.username)
    EXECUTE FUNCTION log_user_changes();
```

## INSTEAD OF 트리거 (뷰용)
```sql
-- 뷰 생성
CREATE VIEW user_profile AS
SELECT id, username, email, 
       CASE WHEN age < 30 THEN 'young' ELSE 'adult' END as age_group
FROM users;

-- INSTEAD OF 트리거 함수
CREATE OR REPLACE FUNCTION update_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET 
        username = NEW.username,
        email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- INSTEAD OF 트리거
CREATE TRIGGER user_profile_update
    INSTEAD OF UPDATE ON user_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profile();
```

## 트리거 관리
```sql
-- 트리거 목록 조회
SELECT trigger_name, table_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE table_schema = 'public';

-- 트리거 비활성화/활성화
ALTER TABLE users DISABLE TRIGGER user_audit_trigger;
ALTER TABLE users ENABLE TRIGGER user_audit_trigger;

-- 트리거 삭제
DROP TRIGGER user_audit_trigger ON users;
```

다음 포스트에서는 트랜잭션과 ACID 속성에 대해 알아보겠습니다. 