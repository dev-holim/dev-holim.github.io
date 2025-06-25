---
title: "PostgreSQL 02 - 기본 명령어와 psql 사용법"
date: 2025-01-02 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, psql, 명령어, 기초]
---

# 기본 명령어와 psql 사용법

## psql이란?

psql은 PostgreSQL의 대화형 터미널 프로그램으로, SQL 쿼리를 실행하고 데이터베이스를 관리할 수 있는 명령줄 인터페이스입니다.

## psql 접속

```bash
# 로컬 데이터베이스에 접속
psql -U username -d database_name

# 호스트 지정하여 접속
psql -h hostname -U username -d database_name -p 5432

# 환경변수 사용
export PGUSER=username
export PGDATABASE=database_name
psql
```

## 기본 메타 명령어

psql에서 `\`로 시작하는 명령어들을 메타 명령어라고 합니다:

```sql
-- 도움말 보기
\?

-- SQL 도움말
\h SELECT

-- 데이터베이스 목록 보기
\l

-- 테이블 목록 보기
\dt

-- 테이블 구조 보기
\d table_name

-- 사용자 목록 보기
\du

-- 현재 연결 정보 보기
\conninfo

-- 다른 데이터베이스로 연결
\c database_name

-- psql 종료
\q
```

## 유용한 설정

```sql
-- 쿼리 실행 시간 표시
\timing on

-- 확장된 출력 모드 (세로 형태)
\x

-- 페이지 단위로 출력
\pset pager on

-- NULL 값 표시 설정
\pset null '[NULL]'

-- 자동 커밋 끄기
\set AUTOCOMMIT off
```

## 파일 작업

```sql
-- SQL 파일 실행
\i /path/to/file.sql

-- 쿼리 결과를 파일로 저장
\o output.txt
SELECT * FROM users;
\o

-- 테이블을 CSV로 내보내기
\copy users TO 'users.csv' CSV HEADER;

-- CSV 파일에서 데이터 가져오기
\copy users FROM 'users.csv' CSV HEADER;
```

## 편집기 사용

```sql
-- 외부 편집기로 쿼리 편집
\e

-- 마지막 쿼리를 편집기로 열기
\e

-- 함수나 뷰 편집
\ef function_name
```

## 변수 사용

```sql
-- 변수 설정
\set myvar 'value'

-- 변수 사용
SELECT * FROM users WHERE name = :'myvar';

-- 쿼리 결과를 변수에 저장
\set user_count `SELECT COUNT(*) FROM users;`
```

## 기본 SQL 명령어

```sql
-- 현재 날짜와 시간
SELECT NOW();

-- 현재 사용자
SELECT CURRENT_USER;

-- 현재 데이터베이스
SELECT CURRENT_DATABASE();

-- PostgreSQL 버전
SELECT VERSION();

-- 활성 연결 확인
SELECT * FROM pg_stat_activity;
```

## psql 설정 파일

홈 디렉토리에 `.psqlrc` 파일을 만들어 자동으로 설정을 적용할 수 있습니다:

```sql
-- ~/.psqlrc
\set QUIET 1
\pset null '[NULL]'
\set PROMPT1 '%[%033[1m%]%M %n@%/%R%[%033[0m%]%# '
\set PROMPT2 '[more] %R > '
\timing on
\set VERBOSITY verbose
\set HISTFILE ~/.psql_history- :DBNAME
\set HISTCONTROL ignoredups
\set COMP_KEYWORD_CASE upper
\unset QUIET
```

다음 포스트에서는 데이터베이스와 테이블 생성에 대해 알아보겠습니다. 