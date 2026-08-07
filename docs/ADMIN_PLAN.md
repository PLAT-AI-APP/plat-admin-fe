# plat-admin-fe — 관리자 프론트엔드 설계서

> `docs/PLAN.md`(백엔드/기능 계획서)를 프론트엔드 관점으로 확장한 문서다.
> 메뉴 분류 기준, 라우트 구조, 화면별 책임, Mock 전략을 정의한다.

---

## 1. 기술 스택

`plat-fe`와 **동일한 스택**을 사용한다. 나중에 사람이 개발할 때 두 프로젝트를 오가며
작업하기 때문에, 라이브러리 선택과 코드 스타일을 의도적으로 일치시킨다.

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 16 (App Router) | `plat-fe`와 동일 |
| 런타임 | React 19.2.3 | |
| 스타일 | Tailwind CSS v4 (`@theme inline`) | 설정 파일 없이 CSS 변수로 토큰 정의 |
| 서버 상태 | TanStack Query v5 | |
| 클라이언트 상태 | zustand | `useXxxStore` 네이밍 |
| HTTP | axios (인터셉터 포함 인스턴스) | `NEXT_PUBLIC_BASE_URI` |
| 폼 | react-hook-form + zod + `@hookform/resolvers` | |
| 토스트 | sonner | |
| 애니메이션 | CSS 키프레임 (`globals.css`) | plat-fe는 framer-motion을 쓰지만, admin은 모션이 최소라 의존성을 두지 않았다 |
| 날짜 | dayjs | |
| 마크다운 | react-markdown + remark-gfm + remark-breaks | 법적 고지·프롬프트 미리보기 |
| 드래그 정렬 | @hello-pangea/dnd | 배너·PICK 순서 변경 |
| 차트 | recharts | 대시보드 전용 (admin에서 추가) |
| 목업 | MSW v2 | 서버 미연동 구간 전체를 목업으로 구동 |
| 폰트 | pretendard | |

`plat-fe`에 있으나 admin에서 제외한 것: `next-intl`(관리자는 한국어 단일),
`embla-carousel`, `react-easy-crop`, `next-navigation-guard`.

---

## 2. 메뉴 분류 기준

좌측 메뉴는 화면 개수만큼 늘리지 않는다. 아래 기준을 고정한다.

1. **1뎁스 = 운영 대상 도메인.** 운영자가 "무엇을 다루는가"로 묶는다. 화면 단위나
   API 단위가 아니라, 데이터를 소유한 도메인 단위다.
2. **2뎁스 = 도메인 내부의 업무 단위.** `목록/관리`, `정책`, `이력` 세 성격 중 하나에
   대응시킨다.
3. **하위가 1개뿐인 도메인은 2뎁스를 만들지 않고 1뎁스 단독 메뉴로 둔다.**
   (대시보드, 법적 고지)
4. **MVP 제외 기능도 메뉴에 노출하되 `MVP 제외` 배지를 단다.** 구현은 하지만
   운영 정책상 아직 쓰지 않는다는 것을 UI에서 명확히 한다.
5. **권한이 다른 기능은 같은 도메인이어도 2뎁스로 분리한다.**
   (결제/크레딧, 관리자 관리)

---

## 3. 메뉴 트리 & 라우트

| # | 1뎁스 | 2뎁스 | 라우트 | 비고 |
|---|---|---|---|---|
| 1 | 대시보드 | — | `/` | 단독 메뉴 |
| 2 | 메인 노출 관리 | 배너 관리 | `/main-exposure/banners` | 신규 |
| | | 오늘의 PICK | `/main-exposure/today-pick` | 신규 · 최대 10개 |
| | | 공식 캐릭터 맛보기 | `/main-exposure/official-pick` | 신규 · 최대 3개 |
| | | 에셋 추천 | `/main-exposure/asset-pick` | 신규 · 최대 3개 |
| 3 | 캐릭터 | 전체 캐릭터 | `/characters` | |
| | | 공식 캐릭터 | `/characters/official` | |
| | | 세계관 | `/characters/scenarios` | 신규 · 큐레이션 조회용 |
| | | 해시태그 관리 | `/characters/hashtags` | 신규 · 사용자는 여기 등록된 태그만 사용 |
| | | NSFW 키워드 | `/characters/nsfw-keywords` | |
| | | 채팅 내보내기 | `/characters/chat-exports` | |
| 3.5 | 커뮤니티 | 댓글 관리 | `/community/comments` | 신규 · 전 영역 댓글 통합 |
| | | 신고 관리 | `/community/reports` | 캐릭터에서 이동 · 대상 다형화 · MVP 제외 |
| 4 | 유저/크리에이터 | 유저 관리 | `/users` | |
| | | 더미 크리에이터 | `/users/dummy-creators` | |
| 5 | AI 운영 | 모델 카탈로그 | `/ai/catalog` | |
| | | AI 모델 관리 | `/ai/models` | |
| | | 시스템 프롬프트 | `/ai/prompts` | |
| 6 | 결제/크레딧 | 상품/결제금액 관리 | `/billing/products` | |
| | | 크레딧 정책 관리 | `/billing/credit-policies` | |
| | | 크레딧 수동 조정 | `/billing/credit-adjustments` | |
| | | 결제 장부 | `/billing/ledger` | |
| 7 | 커뮤니케이션 | 공지사항 관리 | `/communication/notices` | 신규 · 마크다운 |
| | | Q&A 관리 | `/communication/qna` | |
| | | 알림 관리 | `/communication/notifications` | MVP 제외 |
| | | 선제 메시지 | `/communication/proactive-messages` | MVP 제외 |
| | | 푸시 발송 | `/communication/push` | MVP 제외 |
| 8 | 법적 고지 | — | `/legal` | 단독 메뉴 |
| 9 | 운영 | 관리자 관리 | `/ops/managers` | |
| | | 앱 버전 관리 | `/ops/app-versions` | |
| | | 서버 상태 | `/ops/server` | |
| | | 로그 | `/ops/logs` | |

`docs/PLAN.md`의 "MVP 제외" 기능은 전부 구현하되 배지로 구분한다.

**Q&A 관리는 MVP 범위로 편입되어 배지를 제거했다.**
현재 남은 MVP 제외 기능은 신고 관리 · 알림 관리 · 선제 메시지 · 푸시 발송 4종이다.

### 2.1 커뮤니티 도메인을 따로 둔 이유

댓글과 신고는 모두 **유저가 만든 것을 검수·차단하는(UGC 모더레이션)** 업무다.

- `캐릭터 > 댓글`에 넣으면 다른 영역에 댓글이 생기는 순간 위치가 틀어진다.
- `커뮤니케이션`은 **운영자 → 유저** 방향(알림·푸시·공지·Q&A)이고,
  댓글·신고는 **유저 ↔ 유저** UGC라 성격이 다르다.
- 분류 기준(1뎁스 = 운영 대상 도메인)에 따르면 UGC 모더레이션은 독립 도메인이다.

같은 이유로 기존 `캐릭터 > 캐릭터 신고 관리`를 **`커뮤니티 > 신고 관리`로 옮기고
신고 대상을 다형화**했다. 캐릭터만 신고 대상이던 구조로는 댓글·유저 신고를 받을 수 없고,
신고가 대상별로 흩어지면 운영자가 여러 화면을 오가야 한다.
향후 게시글 등 UGC가 늘어도 `targetType`에 값만 추가하면 같은 화면에서 처리한다.

---

## 4. 메인 노출 관리 (신규 요구사항)

PLAN.md에 없는 영역이다. **앱 메인 화면에 무엇을 노출할지 운영자가 직접 고르는 곳**이다.

### 4.0 공통 전제 — 큐레이션 대상은 "세계관"

배너·오늘의 PICK·공식 캐릭터 맛보기·에셋 추천 **4개 영역 모두 세계관(scenario)을
선택 대상으로 삼는다.** 세계관은 캐릭터에 속한 하위 엔티티이며(캐릭터당 최대 5개),
큐레이션 화면에서는 세계관 ID로 조회해 **썸네일 / 제목 / 설명 / 태그**를 가져와
그대로 미리보기에 사용한다.

> 요구사항 원문에서 "공식 캐릭터 맛보기 = 공식 캐릭터 선택"으로 표현했으나,
> 이어지는 지시("3·4·5는 메인페이지에서 노출될 세계관을 고르는 것")를 우선해
> **세계관 선택기로 통일**했다. 단 이 영역은 `공식 세계관`만 후보로 필터링한다.

공통 UI는 `ScenarioPicker`(검색·세계관ID 직접 입력 → 후보 목록 → 선택) 하나로 재사용하고,
슬롯 제한(`maxCount`)과 후보 필터(`officialOnly` 등)만 다르게 준다.

### 4.1 배너 관리 `/main-exposure/banners`

메인 최상단 캐러셀. 첨부 이미지 기준으로 **배경 이미지 + 좌측 텍스트 블록(순번, 제목,
설명 2줄, 태그 칩)** 구성이다.

- 배너 1건 = `이미지` + `세계관 ID`
- 세계관 ID를 입력하면 제목/설명/태그를 자동으로 채워 미리보기에 반영한다.
- 제목·설명·태그는 **세계관 원본값을 그대로 쓰되, 배너에서만 덮어쓰는 오버라이드**를
  허용한다(운영 문구 조정 목적).
- 추가 / 삭제 / 드래그 순서 변경 / 노출 여부 토글 / 노출 기간 설정
- 실제 앱과 동일한 비율(약 1720×310, 5.5:1)의 라이브 프리뷰를 제공한다.

### 4.2 오늘의 PICK `/main-exposure/today-pick`

- 세계관 **최대 10개** 슬롯
- 추가 / 삭제 / 순서 변경
- 슬롯이 다 차면 추가 버튼 비활성 + 사유 툴팁

### 4.3 공식 캐릭터 맛보기 `/main-exposure/official-pick`

- **공식** 세계관 **최대 3개** 슬롯
- 후보 목록은 `isOfficial = true`인 세계관만

### 4.4 에셋 추천 `/main-exposure/asset-pick`

- 세계관 **최대 3개** 슬롯
- 후보 목록을 `assetCount` 내림차순으로 정렬해 "에셋이 많은" 세계관을 고르기 쉽게 한다.

---

## 5. 프론트엔드 API 매핑

`docs/PLAN.md` 5장의 API 초안을 그대로 따른다. 메인 노출 관리만 신규로 정의한다.

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/main/banners` | 배너 목록 |
| POST | `/admin/main/banners` | 배너 추가 |
| PUT | `/admin/main/banners/{bannerId}` | 배너 수정 |
| DELETE | `/admin/main/banners/{bannerId}` | 배너 삭제 |
| PUT | `/admin/main/banners/order` | 배너 순서 일괄 변경 |
| GET | `/admin/main/curations/{slotKey}` | 큐레이션 슬롯 조회 |
| PUT | `/admin/main/curations/{slotKey}` | 큐레이션 슬롯 일괄 저장 |
| GET | `/admin/scenarios` | 세계관 목록/검색 |
| GET | `/admin/scenarios/{scenarioId}` | 세계관 단건 조회 |

`slotKey`: `TODAY_PICK` | `OFFICIAL_TASTE` | `ASSET_RICH`

### 5.1 해시태그 API

해시태그는 **관리자가 등록해 둔 목록에서 사용자가 골라 쓰는** 값이다.
자유 입력이 아니므로 여기서 만들지 않은 태그는 앱에 존재하지 않는다.

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/hashtags` | 해시태그 목록/검색 |
| POST | `/admin/hashtags` | 해시태그 추가 |
| PUT | `/admin/hashtags/{hashtagId}` | 해시태그 수정 |
| PATCH | `/admin/hashtags/{hashtagId}/status` | 노출 여부 변경 |
| DELETE | `/admin/hashtags/{hashtagId}` | 해시태그 삭제 (사용 중이면 409) |
| PUT | `/admin/hashtags/order` | 노출 순서 일괄 변경 |
| GET | `/hashtag/list?lang=KO` | 앱에서 사용할 활성 태그 목록 (public) |

분류 9종: `GENRE`(장르) · `SPECIES`(종족) · `CHARACTER`(캐릭터) ·
`APPEARANCE`(외형) · `PERSONALITY`(성격) · `RELATION`(관계) ·
`NARRATIVE`(서사) · `OCCUPATION`(직업) · `SPECIAL`(특수설정)

- 라벨은 **언어별로 관리**한다. `plat-fe`가 `/hashtag/list?lang=KO`로 조회하기 때문이다.
  한국어는 필수이고, 번역이 없는 언어는 한국어로 대체된다.
- `isAdult` 태그는 성인 인증 유저에게만 노출한다.
- **사용 중인 태그는 삭제할 수 없다.** 이미 붙어 있는 캐릭터의 태그가 깨지므로
  노출 여부(`isActive`)를 끄는 방식으로 관리한다.

### 5.1.1 공지사항 API

법적 고지와 같은 마크다운 본문이지만, **여러 건이 동시에 게시**되고
상단 고정·노출 기간으로 정렬된다는 점이 다르다.

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/notices` | 공지 목록/검색 |
| GET | `/admin/notices/{noticeId}` | 공지 상세 |
| POST | `/admin/notices` | 공지 등록 |
| PUT | `/admin/notices/{noticeId}` | 공지 수정 |
| PATCH | `/admin/notices/{noticeId}/status` | 게시 상태 변경 |
| DELETE | `/admin/notices/{noticeId}` | 공지 삭제 |

상태 3종: `DRAFT`(임시 저장) · `PUBLISHED`(게시 중) · `HIDDEN`(숨김)

### 5.1.2 신고 API

`docs/PLAN.md`에는 캐릭터 신고만 있었지만, 댓글·유저 신고도 같은 흐름으로 처리되므로
댓글과 동일한 다형 구조로 통합했다. (기존 `/admin/character-reports`는 폐기)

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/reports` | 신고 목록/검색 (대상·상태·사유 필터) |
| PATCH | `/admin/reports/{reportId}/status` | 처리 상태·메모 변경 |

- `targetType`: `CHARACTER` | `COMMENT` | `USER`
- 상태: `PENDING`(접수) | `REVIEWING`(검토 중) | `RESOLVED`(처리 완료) | `REJECTED`(반려)
- `targetReportCount`로 **같은 대상에 누적된 신고 수**를 함께 내려준다.
  반복 신고 대상을 먼저 처리할 수 있도록 정렬 기준으로도 쓴다.

### 5.1.3 댓글 API

댓글은 **특정 도메인에 종속시키지 않는다.** 지금은 세계관에만 달리지만
캐릭터·공지사항에도 붙을 예정이라, `targetType` + `targetId`로 대상을 가리키는
다형(polymorphic) 구조로 관리한다. 새 영역이 생기면 `targetType`에 값만 추가한다.

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/comments` | 댓글 목록/검색 (대상·상태·신고 여부 필터) |
| PATCH | `/admin/comments/{commentId}/status` | 노출 상태 변경 (숨김 시 사유 필수) |
| PATCH | `/admin/comments/bulk-status` | 선택한 댓글 일괄 처리 |

- `targetType`: `SCENARIO` | `CHARACTER` | `NOTICE`
- 상태: `VISIBLE` | `HIDDEN` | `DELETED`
- **물리 삭제하지 않는다.** 이력이 남아야 하므로 상태로만 관리한다.
- 숨김 처리에는 사유를 남기고, 운영 로그에 기록된다.

### 5.2 공통 기능 API

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/search` | 전역 검색(⌘K) — 유저·캐릭터·세계관·해시태그 통합 조회 |
| POST | `/admin/files/upload/{fileType}` | 이미지 업로드 (multipart, `file` 필드) |

---

## 6. Mock 전략

서버가 없으므로 **MSW v2 브라우저 워커**로 전 API를 목업한다.

- `NEXT_PUBLIC_API_MOCKING=true`일 때만 워커를 기동한다(`MSWProvider`).
- 핸들러는 도메인별 파일로 분리하고 `src/mocks/handlers/index.ts`에서 합친다.
- 목업 데이터는 `src/mocks/db.ts`에 **메모리 상태**로 두고, POST/PUT/DELETE가
  실제로 그 상태를 변경하게 한다. 새로고침 전까지 CRUD가 실제처럼 동작해야
  화면 구현 검증이 가능하다.
- 서버 연동 시에는 `NEXT_PUBLIC_API_MOCKING=false`로 끄기만 하면 되도록,
  API 함수 시그니처는 실제 명세 기준으로 작성한다.

---

## 7. 인증

현재 서버가 없으므로 **로그인/권한 게이트는 구현하지 않는다.**
다만 나중에 붙일 자리를 남긴다.

- `src/store/useAdminStore.ts`에 현재 관리자 정보를 두되, 목업 고정값을 사용한다.
- 라우트 보호는 `src/app/(admin)/layout.tsx`에서 한 지점만 수정하면 되도록 격리한다.
- `axios` 인터셉터에 토큰 주입 자리를 주석으로 명시해 둔다.

---

## 8. 디렉토리 구조

`plat-fe`의 레이어 구조를 그대로 따른다.

```
src/
├─ api/                   # 도메인별 API 함수 + react-query 훅 (한 파일에 함께 둔다)
│  ├─ index.ts            # axios 인스턴스 + 인터셉터
│  ├─ dashboard/
│  ├─ main-exposure/
│  ├─ character/
│  ├─ user/
│  ├─ ai/
│  ├─ billing/
│  ├─ legal/
│  ├─ communication/
│  └─ ops/
├─ app/
│  ├─ (admin)/            # 사이드바 레이아웃 그룹
│  │  ├─ layout.tsx
│  │  ├─ page.tsx         # 대시보드
│  │  └─ <도메인>/<화면>/page.tsx
│  ├─ globals.css
│  └─ layout.tsx
├─ components/            # 도메인 무관 공용 컴포넌트
│  ├─ ui/                 # Button, Input, Table, Modal ...
│  ├─ layout/             # Sidebar, Header, PageHeader
│  └─ scenario/           # ScenarioPicker 등 큐레이션 공용
├─ constants/             # 메뉴 트리, 쿼리키, 옵션 상수
├─ hooks/                 # useXxx (react-query 래퍼 포함)
├─ icons/                 # 커스텀 SVG 아이콘 컴포넌트
├─ lib/                   # cn, dayjs, format, toast
├─ mocks/                 # MSW
├─ providers/             # QueryClient, MSW, Theme, Sonner
├─ schema/                # zod 스키마
├─ store/                 # zustand
└─ type/                  # 도메인 타입 / API 타입
```

화면 전용 컴포넌트는 `plat-fe`와 동일하게 해당 라우트 폴더의 `_components/`에 둔다.

`plat-fe`의 규칙을 그대로 따른 두 가지를 특히 유의한다.

1. **API 함수와 react-query 훅은 같은 파일에 둔다.** (`getBannerList.ts` 안에
   `getBannerList` + `useBannerListQuery`)
2. **쿼리키는 별도 상수 파일을 만들지 않고 `["동사-리소스", ...파라미터]` 인라인 배열**을 쓴다.

구체적인 작성 규칙은 `docs/DEVELOPMENT_GUIDE.md`에 정리했다.

---

## 9. 작업 순서

1. ~~프로젝트 스캐폴딩~~
2. ~~메뉴 분류 및 문서화~~
3. 디자인 토큰 / 테마 / 공통 유틸
4. 공통 UI 컴포넌트 세트
5. 레이아웃 베이스 템플릿 (사이드바 + 워크스페이스 + 전 라우트 스텁)
6. MSW + API 레이어
7. 화면별 내부 구현
