2025 소프트웨어공학개론 5조 팀 프로젝트입니다.

UI Design
https://www.figma.com/design/ryAW4lxOg6w8ExbZHMgPBB/SWE-Group-5?node-id=0-1&p=f&t=ns6OOZkb05B5ZWo5-0

Frontend
1. frontend 경로 접속
2. npm install package.json
3. npm run dev


# Backend

# Prerequirements
node.js: v23.10.0


# Get Started
## 0. Installation

```bash
git clone https://github.com/hsh200315/SWE_Team5.git
cd backend

npm install

```

## 2. setup .env.development and production
개발 모드와 production 모드 실행을 위한 env 파일 설정입니다.

.env.development, .env.production, .env.test 파일에 다음과 같은 요소가 저장되어야 합니다. 

```bash
DB_PATH= # db가 저장될 경로와 파일이름을 지정합니다. src/database/dev.sqlite로 저장하고 싶으면 /database/dev.sqlite로 저장하면 됩니다. .env.test에서는 :memory: 로 저장하면 됩니다.
API_VERSION= # API version을 의미합니다. ex) v1
SECRET_KEY= # message 암호화를 위한 32bytes 대칭키입니다.
OPENAI_API_KEY= #LLM API 호출을 위한 key입니다.
```

## 3. start
```bash

# for Development
npm run migrate:dev 
npm run dev

# for production
npm run migrate:prod
npm run start

```

# file structure

app.js: Express 앱의 핵심 초기화 파일
server.js: 실제로 서버를 실행하는 진입 파일

AI_model:

AI_test:

config: database 연결 등 환경 설정을 담당하는 구성 파일들

controllers: 각 API 요청에 대한 로직 처리부

database: 실제 데이터들이 저장되는 파일 저장 공간

middlewares: 요청 처리 전에 실행되는 미들웨어 함수들

migrations: DB 스키마 버전 관리 파일들. 테이블 생성 및 수정 이력 관리

models: database model들에 대한 ORM

routes: API 엔드포인트 정의

sockets: Websocket 이벤트 핸들링 로직 정의

test: 백엔드 테스트 코드

utils: util 함수 모음

