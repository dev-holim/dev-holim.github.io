---
title: "PostgreSQL 23 - 파티셔닝 전략"
date: 2025-01-23 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, Partitioning, 파티셔닝, 성능]
---

# 파티셔닝 전략

## 범위 파티셔닝 (Range Partitioning)
```sql
-- 부모 테이블 생성
CREATE TABLE sales (
    id SERIAL,
    sale_date DATE NOT NULL,
    amount DECIMAL(10,2),
    customer_id INTEGER
) PARTITION BY RANGE (sale_date);

-- 월별 파티션 생성
CREATE TABLE sales_2024_01 PARTITION OF sales
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE sales_2024_02 PARTITION OF sales
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- 기본 파티션 (기타 데이터용)
CREATE TABLE sales_default PARTITION OF sales DEFAULT;
```

## 리스트 파티셔닝 (List Partitioning)
```sql
-- 지역별 파티셔닝
CREATE TABLE orders (
    id SERIAL,
    region VARCHAR(10) NOT NULL,
    amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY LIST (region);

-- 지역별 파티션
CREATE TABLE orders_asia PARTITION OF orders
FOR VALUES IN ('KR', 'JP', 'CN');

CREATE TABLE orders_europe PARTITION OF orders
FOR VALUES IN ('UK', 'DE', 'FR');

CREATE TABLE orders_america PARTITION OF orders
FOR VALUES IN ('US', 'CA', 'MX');
```

## 해시 파티셔닝 (Hash Partitioning)
```sql
-- 사용자 ID 기반 해시 파티셔닝
CREATE TABLE user_activities (
    id BIGSERIAL,
    user_id INTEGER NOT NULL,
    activity_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY HASH (user_id);

-- 4개의 해시 파티션
CREATE TABLE user_activities_0 PARTITION OF user_activities
FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE user_activities_1 PARTITION OF user_activities
FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE user_activities_2 PARTITION OF user_activities
FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE user_activities_3 PARTITION OF user_activities
FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

## 서브파티셔닝
```sql
-- 날짜로 먼저 파티셔닝, 그 다음 해시로 서브파티셔닝
CREATE TABLE logs (
    id BIGSERIAL,
    log_date DATE NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT
) PARTITION BY RANGE (log_date);

-- 월별 파티션
CREATE TABLE logs_2024_01 PARTITION OF logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01')
PARTITION BY HASH (user_id);

-- 서브파티션
CREATE TABLE logs_2024_01_0 PARTITION OF logs_2024_01
FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE logs_2024_01_1 PARTITION OF logs_2024_01
FOR VALUES WITH (MODULUS 4, REMAINDER 1);
```

## 파티션 관리
```sql
-- 새 파티션 추가
CREATE TABLE sales_2024_03 PARTITION OF sales
FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- 파티션 삭제 (데이터도 함께 삭제됨)
DROP TABLE sales_2024_01;

-- 파티션 분리 (데이터는 유지)
ALTER TABLE sales DETACH PARTITION sales_2024_01;

-- 파티션 연결
ALTER TABLE sales ATTACH PARTITION sales_2024_01
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## 파티션 쿼리 최적화
```sql
-- 파티션 제거 (Partition Pruning) 확인
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM sales 
WHERE sale_date BETWEEN '2024-01-15' AND '2024-01-31';

-- 파티션 키를 WHERE 절에 포함
SELECT * FROM sales 
WHERE sale_date >= '2024-01-01' 
  AND sale_date < '2024-02-01'
  AND amount > 1000;
```

## 파티션 인덱스
```sql
-- 각 파티션별 인덱스
CREATE INDEX ON sales_2024_01 (customer_id);
CREATE INDEX ON sales_2024_02 (customer_id);

-- 부모 테이블에 인덱스 생성 (모든 파티션에 적용)
CREATE INDEX ON sales (customer_id);
```

## 파티션 유지보수
```sql
-- 파티션별 통계 정보 업데이트
ANALYZE sales_2024_01;

-- 오래된 파티션 자동 삭제 (스크립트 예시)
-- DROP TABLE IF EXISTS sales_$(date -d "6 months ago" +%Y_%m);
```

다음 포스트에서는 복제(Replication) 설정에 대해 알아보겠습니다. 