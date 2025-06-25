---
title: "PostgreSQL 26: 커넥션 풀링과 연결 관리 최적화"
date: 2025-01-26 00:00:00 +0900
categories: [Database, PostgreSQL]
tags: [postgresql, connection-pooling, pgbouncer, performance, scalability]
---

## 커넥션 풀링의 필요성

PostgreSQL에서 각 클라이언트 연결은 별도의 프로세스를 생성합니다. 많은 수의 동시 연결은 메모리 사용량 증가와 성능 저하를 야기할 수 있어, 커넥션 풀링이 필요합니다.

### 연결 제한 확인

```sql
-- 최대 연결 수 확인
SHOW max_connections;

-- 현재 활성 연결 수 확인
SELECT count(*) FROM pg_stat_activity;

-- 연결별 상태 확인
SELECT 
    state,
    count(*) as connection_count
FROM pg_stat_activity
GROUP BY state;
```

## PgBouncer 설정과 관리

### PgBouncer 설치 (Ubuntu/Debian)

```bash
sudo apt-get install pgbouncer
```

### PgBouncer 설정 파일 (/etc/pgbouncer/pgbouncer.ini)

```ini
[databases]
mydb = host=localhost port=5432 dbname=mydb user=myuser

[pgbouncer]
listen_port = 6432
listen_addr = localhost
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
logfile = /var/log/pgbouncer/pgbouncer.log
pidfile = /var/run/pgbouncer/pgbouncer.pid
admin_users = admin
stats_users = stats_user

# 풀링 모드 설정
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
max_db_connections = 50

# 타임아웃 설정
server_round_robin = 1
ignore_startup_parameters = extra_float_digits
server_reset_query = DISCARD ALL
server_check_query = select 1
server_check_delay = 30
max_packet_size = 2147483647
```

### 사용자 인증 파일 (/etc/pgbouncer/userlist.txt)

```text
"myuser" "md5passwordhash"
"admin" "md5passwordhash"
```

### PgBouncer 풀링 모드

#### 1. Session Pooling
```ini
pool_mode = session
```
- 클라이언트가 연결을 닫을 때까지 서버 연결 유지
- 가장 안전하지만 풀링 효과 제한적

#### 2. Transaction Pooling (권장)
```ini
pool_mode = transaction
```
- 트랜잭션이 끝나면 서버 연결 반환
- 좋은 성능과 안전성의 균형

#### 3. Statement Pooling
```ini
pool_mode = statement
```
- 각 SQL 문 실행 후 연결 반환
- 가장 높은 성능이지만 제약사항 많음

## 애플리케이션에서 커넥션 풀 사용

### Python (psycopg2 with connection pooling)

```python
import psycopg2
from psycopg2 import pool

# 커넥션 풀 생성
connection_pool = psycopg2.pool.ThreadedConnectionPool(
    minconn=5,
    maxconn=20,
    host="localhost",
    port=6432,  # PgBouncer 포트
    database="mydb",
    user="myuser",
    password="mypassword"
)

def execute_query(query, params=None):
    connection = None
    try:
        # 풀에서 연결 가져오기
        connection = connection_pool.getconn()
        cursor = connection.cursor()
        cursor.execute(query, params)
        
        if query.strip().upper().startswith('SELECT'):
            result = cursor.fetchall()
            return result
        else:
            connection.commit()
            
    except Exception as e:
        if connection:
            connection.rollback()
        raise e
    finally:
        if connection:
            # 풀에 연결 반환
            connection_pool.putconn(connection)

# 사용 예제
result = execute_query("SELECT * FROM users WHERE id = %s", (1,))
```

### Node.js (pg-pool)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 6432, // PgBouncer 포트
  database: 'mydb',
  user: 'myuser',
  password: 'mypassword',
  min: 5,     // 최소 연결 수
  max: 20,    // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function executeQuery(query, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// 사용 예제
(async () => {
  try {
    const users = await executeQuery('SELECT * FROM users WHERE active = $1', [true]);
    console.log(users);
  } catch (err) {
    console.error('Error:', err);
  }
})();
```

## 커넥션 풀 모니터링

### PgBouncer 통계 확인

```sql
-- PgBouncer admin 콘솔 연결
psql -h localhost -p 6432 -U admin pgbouncer

-- 풀 상태 확인
SHOW POOLS;

-- 클라이언트 연결 상태
SHOW CLIENTS;

-- 서버 연결 상태
SHOW SERVERS;

-- 통계 정보
SHOW STATS;

-- 설정 확인
SHOW CONFIG;
```

### PostgreSQL 연결 모니터링

```sql
-- 활성 연결과 상태별 분류
SELECT 
    application_name,
    state,
    count(*) as connections,
    max(now() - query_start) as max_query_duration,
    max(now() - state_change) as max_state_duration
FROM pg_stat_activity 
WHERE pid <> pg_backend_pid()
GROUP BY application_name, state
ORDER BY connections DESC;

-- 대기 중인 연결 확인
SELECT 
    pid,
    wait_event_type,
    wait_event,
    query
FROM pg_stat_activity 
WHERE wait_event IS NOT NULL;
```

## 고급 커넥션 관리 전략

### 1. 적응형 풀 크기 조정

```python
import time
import threading
from psycopg2 import pool

class AdaptiveConnectionPool:
    def __init__(self, minconn, maxconn, **kwargs):
        self.pool = psycopg2.pool.ThreadedConnectionPool(
            minconn, maxconn, **kwargs
        )
        self.monitor_thread = threading.Thread(target=self._monitor_pool)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
    
    def _monitor_pool(self):
        while True:
            time.sleep(60)  # 1분마다 체크
            # 풀 사용률 확인 및 조정 로직
            # 실제 구현에서는 더 정교한 메트릭 사용
            pass
```

### 2. 읽기/쓰기 분리를 위한 다중 풀

```python
class ReadWriteConnectionManager:
    def __init__(self):
        # 읽기 전용 풀 (읽기 복제본)
        self.read_pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=10, maxconn=30,
            host="read-replica.example.com",
            **common_config
        )
        
        # 쓰기 풀 (마스터)
        self.write_pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=5, maxconn=15,
            host="master.example.com",
            **common_config
        )
    
    def execute_read_query(self, query, params=None):
        return self._execute_with_pool(self.read_pool, query, params)
    
    def execute_write_query(self, query, params=None):
        return self._execute_with_pool(self.write_pool, query, params)
```

## 최적화 팁

### 1. 커넥션 풀 크기 조정

```sql
-- 동시 활성 쿼리 수 모니터링
SELECT count(*) as active_queries
FROM pg_stat_activity 
WHERE state = 'active' AND pid <> pg_backend_pid();

-- CPU 코어 수를 고려한 풀 크기 설정
-- 일반적인 가이드라인: (CPU 코어 수 * 2) + effective_spindle_count
```

### 2. 연결 수명 관리

```ini
# PgBouncer 설정에서 연결 수명 관리
server_lifetime = 3600        # 1시간 후 서버 연결 재생성
server_idle_timeout = 600     # 10분 유휴 시 연결 종료
client_idle_timeout = 0       # 클라이언트 타임아웃 비활성화
```

### 3. 애플리케이션 레벨 최적화

```python
# 연결 검증 및 재시도 로직
def get_connection_with_retry(pool, max_retries=3):
    for attempt in range(max_retries):
        try:
            conn = pool.getconn()
            # 연결 상태 검증
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
            return conn
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            time.sleep(0.1 * (2 ** attempt))  # 지수 백오프
```

커넥션 풀링을 적절히 구성하면 애플리케이션의 확장성과 성능을 크게 개선할 수 있습니다. 다음 글에서는 PostgreSQL의 JSON과 NoSQL 기능에 대해 알아보겠습니다. 