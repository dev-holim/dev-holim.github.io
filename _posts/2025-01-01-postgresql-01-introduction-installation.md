---
title: "PostgreSQL 01 - PostgreSQL 소개 및 설치"
date: 2025-01-01 10:00:00 +0900
categories: [Database, PostgreSQL]
tags: [PostgreSQL, Database, 설치, 기초]
---

# PostgreSQL 소개 및 설치

## PostgreSQL이란?

PostgreSQL은 확장 가능하고 표준을 준수하는 오픈 소스 객체-관계형 데이터베이스 시스템입니다. 30년 이상의 활발한 개발을 통해 안정성, 기능 견고성, 성능 면에서 강력한 평판을 얻었습니다.

## 주요 특징

- **ACID 준수**: 트랜잭션의 원자성, 일관성, 격리성, 지속성 보장
- **다양한 데이터 타입**: JSON, XML, 배열, 사용자 정의 타입 지원
- **확장성**: 사용자 정의 함수, 연산자, 인덱스 타입 생성 가능
- **표준 준수**: SQL 표준을 광범위하게 지원
- **오픈 소스**: 무료로 사용 가능하며 활발한 커뮤니티 지원

## 설치 방법

### Windows
1. PostgreSQL 공식 웹사이트에서 설치 파일 다운로드
2. 설치 마법사를 따라 설치 진행
3. 포트 번호(기본값: 5432)와 슈퍼유저 비밀번호 설정

### macOS
```bash
# Homebrew 사용
brew install postgresql

# 서비스 시작
brew services start postgresql
```

### Ubuntu/Debian
```bash
# 패키지 업데이트
sudo apt update

# PostgreSQL 설치
sudo apt install postgresql postgresql-contrib

# 서비스 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 설치 확인

```bash
# PostgreSQL 버전 확인
psql --version

# PostgreSQL 서비스 상태 확인 (Linux/macOS)
sudo systemctl status postgresql
```

## 초기 설정

설치 후 PostgreSQL에 처음 접속하려면:

```bash
# postgres 사용자로 접속
sudo -u postgres psql

# 새 사용자 생성
CREATE USER myuser WITH PASSWORD 'mypassword';

# 새 데이터베이스 생성
CREATE DATABASE mydatabase OWNER myuser;
```

다음 포스트에서는 기본 명령어와 psql 사용법에 대해 알아보겠습니다. 