---
title: "PostgreSQL 25 - 고가용성(HA) 구성"
date: 2025-01-25 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, HA, 고가용성, Failover]
---

# 고가용성(HA) 구성

## Patroni를 이용한 HA 클러스터
```yaml
# patroni.yml 설정 예시
scope: postgres-cluster
namespace: /db/
name: postgresql1

restapi:
  listen: 0.0.0.0:8008
  connect_address: 192.168.1.10:8008

etcd:
  host: 192.168.1.10:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 30
    maximum_lag_on_failover: 1048576
    postgresql:
      use_pg_rewind: true

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 192.168.1.10:5432
  data_dir: /var/lib/postgresql/data
  pgpass: /tmp/pgpass
  authentication:
    replication:
      username: replicator
      password: replica_password
    superuser:
      username: postgres
      password: postgres_password
```

## pgpool-II를 이용한 연결 풀링과 로드밸런싱
```bash
# pgpool.conf 주요 설정
listen_addresses = '*'
port = 9999
backend_hostname0 = '192.168.1.10'
backend_port0 = 5432
backend_weight0 = 1
backend_hostname1 = '192.168.1.11'
backend_port1 = 5432
backend_weight1 = 1

enable_pool_hba = on
pool_passwd = 'pool_passwd'
load_balance_mode = on
master_slave_mode = on
```

## HAProxy를 이용한 로드밸런싱
```
# haproxy.cfg
global
    maxconn 100

defaults
    mode tcp
    timeout connect 4000ms
    timeout client 60000ms
    timeout server 60000ms

listen postgres
    bind *:5000
    option httpchk
    http-check expect status 200
    default-server inter 3s fall 3 rise 2
    server postgresql-1 192.168.1.10:5432 maxconn 100 check port 8008
    server postgresql-2 192.168.1.11:5432 maxconn 100 check port 8008 backup
```

## 자동 Failover 스크립트
```bash
#!/bin/bash
# failover_check.sh

MASTER_HOST="192.168.1.10"
SLAVE_HOST="192.168.1.11"
CHECK_INTERVAL=30

check_master() {
    pg_isready -h $MASTER_HOST -p 5432 -q
    return $?
}

promote_slave() {
    echo "Promoting slave to master..."
    ssh $SLAVE_HOST "pg_ctl promote -D /var/lib/postgresql/data"
    
    # 애플리케이션 설정 업데이트
    update_app_config $SLAVE_HOST
}

while true; do
    if ! check_master; then
        echo "Master is down, initiating failover..."
        promote_slave
        break
    fi
    sleep $CHECK_INTERVAL
done
```

## 데이터 동기화 확인
```sql
-- 복제 지연 모니터링
SELECT 
    client_addr,
    state,
    pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn) AS pending_bytes,
    pg_wal_lsn_diff(sent_lsn, flush_lsn) AS wal_delay_bytes,
    pg_wal_lsn_diff(flush_lsn, replay_lsn) AS replay_delay_bytes
FROM pg_stat_replication;

-- 슬레이브에서 지연 시간 확인
SELECT 
    CASE 
        WHEN pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() 
        THEN 0 
        ELSE EXTRACT(EPOCH FROM now() - pg_last_xact_replay_timestamp())
    END AS lag_seconds;
```

## 백업과 복구 전략
```bash
# 연속 아카이빙 설정
# postgresql.conf
archive_mode = on
archive_command = 'rsync %p backup-server:/backup/wal/%f'

# PITR 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_basebackup -D /backup/base_$DATE -Ft -z -P
echo "Backup completed: base_$DATE"
```

## 모니터링과 알림
```sql
-- 클러스터 상태 모니터링 뷰
CREATE VIEW cluster_status AS
SELECT 
    'master' as role,
    pg_is_in_recovery() as in_recovery,
    pg_current_wal_lsn() as current_lsn,
    (SELECT count(*) FROM pg_stat_replication) as replica_count
UNION ALL
SELECT 
    'replica' as role,
    pg_is_in_recovery() as in_recovery,
    pg_last_wal_replay_lsn() as current_lsn,
    0 as replica_count;
```

## Split-Brain 방지
```bash
# Patroni의 DCS(Distributed Configuration Store) 활용
# etcd, Consul, Zookeeper 등을 통한 리더 선출

# Fencing 스크립트 예시
#!/bin/bash
if [ "$1" = "fence" ]; then
    # 문제가 있는 노드의 네트워크 차단
    iptables -A INPUT -s $2 -j DROP
    iptables -A OUTPUT -d $2 -j DROP
fi
```

다음 포스트에서는 연결 풀링과 pgBouncer에 대해 알아보겠습니다. 