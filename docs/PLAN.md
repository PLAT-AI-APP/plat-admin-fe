# PLAN — 관리자(Admin) MVP 계획서

> 목적: 스크린샷에 보이는 관리자 메뉴를 바탕으로, PLAT MVP에서 어떤 관리자 기능이 필요한지 정리한다.  
> 이 문서는 구현 설계서가 아니라 개발 방향을 정하는 계획서다. 세부 구현 방식, 테이블 구조, 클래스 설계는 별도 설계 문서에서 다룬다.

## 1. 방향성

- 관리자 기능은 별도 `plat-admin` 모듈로 분리한다.
- MVP에서는 운영자가 반드시 봐야 하는 정보와 반드시 조작해야 하는 기능만 만든다.
- Q&A, 캐릭터 신고처럼 사람이 직접 판단해야 하는 운영 업무는 MVP에서 Discord를 활용한다.
- 메뉴는 기능 하나당 하나씩 늘리지 않고, 상위 메뉴와 하위 메뉴로 묶어 관리한다.
- 모든 금액은 최소 통화 단위 기준으로 다루고, 크레딧은 정수 단위로 관리한다.
- API는 화면 단위가 아니라 업무 도메인 단위로 묶는다.

## 2. MVP 메뉴 구성

| 상위 메뉴 | 하위 메뉴 | 목적 |
|---|---|---|
| 대시보드 | 운영 요약 | 서비스 상태, 유저, 캐릭터, 결제, 크레딧 현황을 한 화면에서 확인 |
| 캐릭터 | 전체 캐릭터 | 일반 캐릭터 검색, 상세 확인, 노출 상태 관리 |
| 캐릭터 | 공식 캐릭터 | PLAT이 직접 운영하는 공식 캐릭터 관리 |
| 캐릭터 | NSFW 키워드 | 캐릭터/채팅 안전성 관리를 위한 키워드 관리 |
| 캐릭터 | 채팅 내보내기 | 운영 확인이 필요한 대화 기록 추출 |
| 유저/크리에이터 | 유저 관리 | 유저 검색, 상세 확인, 상태 관리 |
| 유저/크리에이터 | 더미 크리에이터 | 초기 콘텐츠 운영을 위한 더미 크리에이터 관리 |
| AI 운영 | 모델 카탈로그 | 사용 가능한 AI 모델 확인 및 테스트 |
| AI 운영 | AI 모델 관리 | 모델 사용 여부, 기본 모델, 운영 메타 관리 |
| AI 운영 | 시스템 프롬프트 | 시스템 프롬프트 버전 관리 |
| 결제/크레딧 | 상품/결제금액 관리 | 크레딧 상품과 결제 금액 관리 |
| 결제/크레딧 | 크레딧 정책 관리 | 크레딧 지급/차감 정책 관리 |
| 결제/크레딧 | 크레딧 수동 조정 | 운영자 수동 지급/차감 처리 |
| 결제/크레딧 | 결제 장부 | 결제, 충전, 사용, 환불 흐름 조회 |
| 법무 | 법적 고지 | 이용약관, 개인정보처리방침 버전 관리 |
| 운영 | 관리자 관리 | 최고관리자가 관리자 계정과 권한을 관리 |
| 운영 | 앱 버전 관리 | 앱 최소/권장 버전과 강제 업데이트 정책 관리 |
| 운영 | 서버 상태 | 서버와 외부 의존성 상태 확인 |
| 운영 | 로그 | 운영 로그 조회 |

## 3. MVP 제외 범위

| 기능 | MVP 처리 |
|---|---|
| Q&A 관리 | Discord로 문의 접수 및 답변 |
| 캐릭터 신고 관리 | Discord로 신고 접수 및 처리 |
| 알림 관리 | MVP 제외 |
| 선제 메시지 | MVP 제외 |
| 푸시 발송 | MVP 제외 |

## 4. 기능 방향

### 4.1 대시보드

운영자가 서비스 상태를 빠르게 판단할 수 있는 첫 화면이다.  
유저 증가, 캐릭터 현황, 결제 금액, 크레딧 흐름, 서버 상태를 요약해서 보여준다.

### 4.2 캐릭터

캐릭터 운영의 핵심은 검색, 상세 확인, 노출 상태 관리다.  
MVP에서는 공식 캐릭터를 별도 하위 메뉴로 두어 PLAT이 직접 운영하는 캐릭터를 명확히 관리한다.  
NSFW 키워드와 채팅 내보내기는 캐릭터 품질 관리와 운영 대응을 위한 보조 기능으로 둔다.

### 4.3 유저/크리에이터

유저 관리에서는 계정 상태와 기본 활동 정보를 확인할 수 있어야 한다.  
더미 크리에이터는 초기 콘텐츠 확보와 운영 테스트를 위한 도구로 둔다.

### 4.4 AI 운영

AI 운영 메뉴는 모델을 직접 개발하는 곳이 아니라, 운영자가 현재 어떤 모델이 쓰이고 있는지 확인하고 제어하는 곳이다.  
모델 카탈로그는 테스트와 상태 확인 중심, AI 모델 관리는 운영 설정 중심, 시스템 프롬프트는 버전 관리 중심으로 나눈다.

### 4.5 결제/크레딧

MVP에서도 결제 금액과 크레딧은 반드시 관리 가능해야 한다.  
상품/결제금액 관리, 크레딧 정책 관리, 수동 조정, 장부 조회를 분리해 돈과 크레딧 흐름을 추적 가능하게 만든다.  
수동 조정은 운영 리스크가 크므로 사유와 이력을 남기는 방향으로 계획한다.

### 4.6 법무

법적 고지는 MVP 범위에 포함한다.  
이용약관과 개인정보처리방침은 버전 이력과 활성 문서 지정이 가능해야 한다.

### 4.7 운영

운영 메뉴에는 서비스 운영 상태뿐 아니라 관리자 권한 관리도 포함한다.  
최고관리자는 관리자 추가, 권한 변경, 비활성화, 삭제를 할 수 있어야 한다.  
앱 버전 관리는 앱 업데이트 대응을 위해 필요하다.  
서버 상태와 로그는 장애 대응과 운영 확인을 위한 기본 기능으로 둔다.

## 5. API 명세 초안

아래 명세는 MVP 개발 방향을 맞추기 위한 1차 API 초안이다.  
세부 요청/응답 형식, 검증 규칙, 에러 코드는 별도 API 설계서에서 확정한다.

### 5.1 Dashboard API

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/dashboard/summary` | 전체 운영 요약 |
| GET | `/admin/dashboard/users` | 유저 지표 조회 |
| GET | `/admin/dashboard/characters` | 캐릭터 지표 조회 |
| GET | `/admin/dashboard/billing` | 결제/크레딧 지표 조회 |
| GET | `/admin/dashboard/system` | 시스템 상태 요약 |

### 5.2 Character API

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/characters` | 전체 캐릭터 목록/검색 |
| GET | `/admin/characters/{characterId}` | 캐릭터 상세 조회 |
| PATCH | `/admin/characters/{characterId}/visibility` | 캐릭터 노출 상태 변경 |
| DELETE | `/admin/characters/{characterId}` | 캐릭터 삭제 또는 비활성 처리 |
| GET | `/admin/characters/official` | 공식 캐릭터 목록 |
| POST | `/admin/characters/official` | 공식 캐릭터 생성 |
| PUT | `/admin/characters/official/{characterId}` | 공식 캐릭터 수정 |
| GET | `/admin/nsfw-keywords` | NSFW 키워드 목록 |
| POST | `/admin/nsfw-keywords` | NSFW 키워드 추가 |
| DELETE | `/admin/nsfw-keywords/{keywordId}` | NSFW 키워드 삭제 |
| POST | `/admin/chat-exports` | 채팅 내보내기 작업 생성 |
| GET | `/admin/chat-exports/{jobId}` | 채팅 내보내기 상태 조회 |
| GET | `/admin/chat-exports/{jobId}/download` | 채팅 내보내기 다운로드 |

### 5.3 User API

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/users` | 유저 목록/검색 |
| GET | `/admin/users/{userId}` | 유저 상세 조회 |
| PATCH | `/admin/users/{userId}/status` | 유저 상태 변경 |
| PATCH | `/admin/users/{userId}/role` | 유저 역할 변경 |
| GET | `/admin/dummy-creators` | 더미 크리에이터 목록 |
| POST | `/admin/dummy-creators` | 더미 크리에이터 생성 |
| PUT | `/admin/dummy-creators/{creatorId}` | 더미 크리에이터 수정 |

### 5.4 AI Admin API

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/ai/models/catalog` | 사용 가능한 모델 확인 |
| POST | `/admin/ai/models/{model}/ping` | 모델 테스트 호출 |
| GET | `/admin/ai/models` | 운영 모델 목록 |
| PUT | `/admin/ai/models/{modelId}` | 모델 운영 설정 변경 |
| GET | `/admin/ai/prompts` | 시스템 프롬프트 목록 |
| GET | `/admin/ai/prompts/{promptKey}` | 시스템 프롬프트 상세 |
| PUT | `/admin/ai/prompts/{promptKey}` | 시스템 프롬프트 새 버전 저장 |
| POST | `/admin/ai/prompts/{promptKey}/activate` | 시스템 프롬프트 활성화 |

### 5.5 Billing/Credit API

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/billing/products` | 크레딧 상품 목록 |
| GET | `/admin/billing/products/{productId}` | 크레딧 상품 상세 |
| POST | `/admin/billing/products` | 크레딧 상품 생성 |
| PUT | `/admin/billing/products/{productId}` | 결제금액/크레딧 구성 수정 |
| PATCH | `/admin/billing/products/{productId}/status` | 상품 노출 상태 변경 |
| GET | `/admin/credits/policies` | 크레딧 정책 목록 |
| PUT | `/admin/credits/policies/{policyKey}` | 크레딧 정책 수정 |
| POST | `/admin/credits/adjustments` | 크레딧 수동 지급/차감 |
| GET | `/admin/credits/adjustments` | 크레딧 수동 조정 이력 |
| GET | `/admin/ledger` | 결제/크레딧 장부 목록 |
| GET | `/admin/ledger/{ledgerId}` | 장부 상세 조회 |
| GET | `/admin/ledger/summary` | 장부 요약 조회 |

### 5.6 Legal API

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/legal` | 법적 문서 버전 목록 |
| GET | `/admin/legal/{documentId}` | 법적 문서 상세 |
| POST | `/admin/legal` | 법적 문서 새 버전 등록 |
| PATCH | `/admin/legal/{documentId}/activate` | 활성 문서 지정 |
| GET | `/legal/active` | 앱에서 사용할 활성 법적 문서 조회 |

### 5.7 Ops API

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/managers` | 관리자 목록 조회 |
| POST | `/admin/managers` | 관리자 추가 |
| PUT | `/admin/managers/{managerId}` | 관리자 정보/권한 수정 |
| PATCH | `/admin/managers/{managerId}/status` | 관리자 활성/비활성 변경 |
| DELETE | `/admin/managers/{managerId}` | 관리자 삭제 |
| GET | `/admin/app-versions` | 앱 버전 정책 목록 |
| POST | `/admin/app-versions` | 앱 버전 정책 등록 |
| PUT | `/admin/app-versions/{versionId}` | 앱 버전 정책 수정 |
| GET | `/app/version-check` | 앱 버전 체크 |
| GET | `/admin/server/health` | 서버 상태 조회 |
| GET | `/admin/server/metrics` | 서버 메트릭 조회 |
| GET | `/admin/logs/recent` | 최근 운영 로그 조회 |
| GET | `/admin/logs/history` | 운영 로그 이력 조회 |
| GET | `/admin/logs/stream` | 운영 로그 실시간 스트림 |

공통 API 원칙:

- 목록 API는 검색, 필터, 페이지네이션을 기본 전제로 한다.
- 변경 API는 변경 사유와 감사 로그를 남길 수 있어야 한다.
- 관리자 관리 API는 최고관리자 권한에서만 접근 가능해야 한다.
- 결제/크레딧 관련 API는 운영자 권한을 더 강하게 분리한다.
- 공개 앱에서도 필요한 정보는 admin API와 분리해 public API로 제공한다.

## 6. 라이브러리 선택 방향

| 필요 상황 | 검토 라이브러리 |
|---|---|
| 서버 상태와 메트릭이 필요할 때 | Spring Boot Actuator, Micrometer |
| CSV 형태의 채팅 내보내기가 필요할 때 | Jackson CSV 또는 OpenCSV |
| Excel 내보내기가 실제 운영 요구가 될 때 | Apache POI |
| Markdown 본문 검증이나 미리보기가 필요할 때 | CommonMark |
| NSFW 키워드 캐싱이 필요할 때 | 기존 Redis 모듈 |
| Discord 운영 자동화가 필요할 때 | Discord Webhook 호출. 별도 SDK는 MVP 이후 검토 |

MVP에서 제외한 푸시 발송 때문에 Firebase Admin SDK는 넣지 않는다.  
정교한 예약 발송도 MVP 범위가 아니므로 Quartz는 넣지 않는다.

## 7. 우선순위

1. `plat-admin` 모듈 분리와 관리자 공통 기반
2. 대시보드, 관리자 관리, 로그, 서버 상태
3. 캐릭터 관리, 공식 캐릭터, 유저 관리
4. 결제/크레딧 관리
5. 법적 고지, 앱 버전 관리
6. AI 운영
7. NSFW 키워드, 채팅 내보내기, 더미 크리에이터

## 8. 확인 필요

- 공식 캐릭터를 별도 소유자 개념으로 둘지, 단순 공식 표시로 둘지
- 결제 상품과 크레딧 정책을 MVP부터 admin에서 수정 가능하게 할지, 초기에는 조회 중심으로 둘지
- Discord 운영 채널 구조와 담당자 흐름
- 대시보드에서 반드시 보여야 하는 핵심 지표
- 최고관리자와 일반 관리자의 권한 범위
- 운영자 권한을 MVP에서 단일 관리자 권한으로 둘지, 결제/크레딧만 별도 권한으로 나눌지
