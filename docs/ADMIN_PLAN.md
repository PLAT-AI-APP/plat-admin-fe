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
| | | 공식 계정 | `/characters/official` | 공식으로 취급할 **유저 ID** 등록 |
| | | 세계관 | `/characters/universes` | 세계관 = 캐릭터 1명 + 시나리오 N편 |
| | | 해시태그 관리 | `/characters/hashtags` | 신규 · 사용자는 여기 등록된 태그만 사용 |
| | | 금지어 관리 | `/universes/banned-words` | |
| | | 채팅 내보내기 | `/characters/chat-exports` | |
| 3.5 | 커뮤니티 | 댓글 관리 | `/community/comments` | 신규 · 전 영역 댓글 통합 |
| | | 신고 관리 | `/community/reports` | 캐릭터에서 이동 · 대상 다형화 · MVP 제외 |
| 4 | 유저/크리에이터 | 유저 관리 | `/users` | |
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
| 8 | 법적 고지 | — | `/legal` | 단독 메뉴 · **MOCK**(현재 Notion 관리, MVP 제외) |
| 9 | 운영 | 직책 · 권한 | `/ops/roles` | 신규 · 권한은 직책이 갖는다 |
| | | 관리자 관리 | `/ops/managers` | 계정에 직책만 배정 |
| | | 앱 버전 관리 | `/ops/app-versions` | |
| | | 서버 상태 | `/ops/server` | |
| | | 배치 관리 | `/ops/batch` | 신규 · 잡 정의 + 실행 이력 · 수동 재실행 |
| | | 로그 | `/ops/logs` | 탭 2개 — 관리자 활동 · 시스템 이벤트 |

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

### 2.2 로그를 셋으로 나눈 이유

운영 로그 하나에 **관리자 활동 · 배치 실행 · 시스템 오류**가 함께 쌓이고 있었다.
셋은 답해야 하는 질문이 다르고, 그래서 필요한 컬럼 · 필터 · 보존 기간 · 권한이
모두 다르다. 한 표에 담으면 세 가지 모두 최소공배수만 보여 주게 된다.

| | 주체 | 답해야 할 질문 | 핵심 컬럼 |
|---|---|---|---|
| 관리자 활동 | 사람 | 누가 무엇을 어떤 값으로 바꿨나 | 결과 · 대상 · 변경 값 · 직책 · IP |
| 배치 실행 | 잡 | 제대로 돌았나 · 다시 돌려야 하나 | 상태 · 소요 · 처리/실패 건수 · 트리거 |
| 시스템 이벤트 | 서버 | 지금 무엇이 터지고 있나 | 레벨 · 발생원 · 발생 횟수 · traceId |

기존 목업이 이미 그 증거였다. 사람을 담는 `actor` 자리에 `system` ·
`batch-scheduler`를 밀어넣고 있었고, 그 행들은 계정 ID가 없어 **실행자 필터가
영영 잡지 못하는 행**이었다.

**배치는 로그가 아니라 관리 화면으로 뗐다.** 이력만 보는 것이 아니라 *수동 재실행*
이라는 행위가 붙기 때문이다. 조회만 있는 `log` 권한에 묶으면 되돌릴 수 없는 처리를
`read` 권한으로 실행할 수 있게 된다. 관리자 활동과 시스템 이벤트는 둘 다 조회
전용이라 한 화면의 탭으로 둔다.

**시스템 이벤트는 원본 로그가 아니다.** 애플리케이션 로그 전체를 어드민으로
끌어오면 볼륨 · 검색 성능 · 보존 비용이 곧바로 어드민의 문제가 되고, 정작 봐야 할
것이 묻힌다. 여기에는 **조치가 필요한 경고 · 오류만** 묶인 요약으로 오고
(`occurrenceCount` · `firstOccurredAt` · `lastOccurredAt`), 원본 추적은 `traceId`로
관제 도구(CloudWatch · Datadog)에 넘긴다.

관리자 활동 로그에는 `level`이 없다. 사람이 한 변경에 심각도를 매기는 것은 의미가
없고, 감사에서 갈라 봐야 하는 것은 심각도가 아니라 **결과**다 —
`SUCCESS` · `DENIED`(권한 없어 거부) · `FAILED`(오류). 성공만 남기면 감사가 되지
않는다. 권한이 없어 막힌 시도가 오히려 먼저 봐야 할 기록이다.

---

## 4. 메인 노출 관리 (신규 요구사항)

PLAN.md에 없는 영역이다. **앱 메인 화면에 무엇을 노출할지 운영자가 직접 고르는 곳**이다.

### 4.0 공통 전제 — 큐레이션 대상은 "세계관"

배너·오늘의 PICK·공식 캐릭터 맛보기·에셋 추천 **4개 영역 모두 세계관(universe)을
선택 대상으로 삼는다.** 세계관은 캐릭터 한 명과 시나리오 여러 편을 품은 콘텐츠 단위이며,
큐레이션 화면에서는 세계관 ID로 조회해 **썸네일 / 제목 / 설명 / 태그**를 가져와
그대로 미리보기에 사용한다.

> 요구사항 원문에서 "공식 캐릭터 맛보기 = 공식 캐릭터 선택"으로 표현했으나,
> 이어지는 지시("3·4·5는 메인페이지에서 노출될 세계관을 고르는 것")를 우선해
> **세계관 선택기로 통일**했다. 단 이 영역은 `공식 세계관`만 후보로 필터링한다.

공통 UI는 `UniversePicker`(검색·세계관ID 직접 입력 → 후보 목록 → 선택) 하나로 재사용하고,
슬롯 제한(`maxCount`)과 후보 필터(`officialOnly` 등)만 다르게 준다.

### 4.1 배너 관리 `/main-exposure/banners`

메인 최상단 캐러셀. 첨부 이미지 기준으로 **배경 이미지 + 좌측 텍스트 블록(순번, 제목,
설명 2줄, 태그 칩)** 구성이다.

- 배너 1건 = `이미지` + `세계관 ID`
- 세계관 ID를 입력하면 제목/설명/태그를 자동으로 채워 미리보기에 반영한다.
- 제목·설명은 **언어별로 덮어쓴다.** 해시태그와 같은 6개 언어를 지원하며, 비운 언어는
  한국어로, 한국어까지 비우면 세계관 원본으로 떨어진다. 폼은 언어 탭으로 나누고
  미리보기가 선택한 언어를 그대로 따른다.
- 태그는 **등록된 해시태그에서 고른다**(`hashtagIds`). 문자열 자유 입력을 두면 앱에 없는
  태그가 배너에만 뜨고, 태그 이름을 바꿔도 배너는 옛 이름을 들고 있게 된다.
- 추가 / 삭제 / 드래그 순서 변경 / 노출 여부 토글 / 노출 기간 설정
- 실제 앱과 동일한 비율(약 1720×310, 5.5:1)의 라이브 프리뷰를 제공한다.

### 4.2 오늘의 PICK `/main-exposure/today-pick`

- 세계관 **최대 10개** 슬롯
- 추가 / 삭제 / 순서 변경
- 슬롯이 다 차면 추가 버튼 비활성 + 사유 툴팁

### 4.3 공식 캐릭터 맛보기 `/main-exposure/official-pick`

- **공식** 세계관 **최대 3개** 슬롯
- 후보 목록은 `isOfficial = true`인 세계관만.
  이 값은 세계관에 저장된 값이 아니라 **소유 크리에이터가 공식 계정으로
  지정되어 있는지**로 계산된다(→ 5.1.4). 후보가 비면 세계관을 찾을 것이 아니라
  `캐릭터 > 공식 계정`에 계정이 등록되어 있는지 먼저 본다.

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
| GET | `/admin/universes` | 세계관 목록/검색 |
| GET | `/admin/universes/{universeId}` | 세계관 단건 조회 (시나리오 포함) |

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
| GET | `/hashtag/list?lang=KO` | 앱에서 사용할 활성 태그 목록 (public) |

분류 9종: `GENRE`(장르) · `SPECIES`(종족) · `CHARACTER`(캐릭터) ·
`APPEARANCE`(외형) · `PERSONALITY`(성격) · `RELATION`(관계) ·
`NARRATIVE`(서사) · `OCCUPATION`(직업) · `SPECIAL`(특수설정)

- 라벨은 **언어별로 관리**한다. `plat-fe`가 `/hashtag/list?lang=KO`로 조회하기 때문이다.
  한국어는 필수이고, 번역이 없는 언어는 한국어로 대체된다.
- `isAdult` 태그는 성인 인증 유저에게만 노출한다. 목록에서 **성인 태그만** 골라 볼 수 있다.
- **노출 순서 개념은 없다.** 서버에서 `order`를 제거했다. 정렬은 등록일 · 사용 수 · 이름으로 한다.
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

### 5.1.4 공식 계정 API

**공식 여부는 콘텐츠가 아니라 계정에 붙는다.** 서버(`plat-be`)는 세계관마다
공식 값을 저장하지 않고, 설정에 적힌 유저 ID를 크리에이터 ID로 바꿔
**조회할 때마다 다시 판정**한다.
(`universe.official-user-ids` → `OfficialCreators` → `UniverseCardQueryUseCase.isOfficial`)

그래서 관리자가 등록하는 것은 캐릭터가 아니라 **유저 ID**다.
캐릭터를 하나씩 공식으로 만드는 화면(구 `공식 캐릭터` CRUD)은 서버에 대응하는
개념이 없어 폐기했다.

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/official-accounts` | 공식 계정 목록 |
| POST | `/admin/official-accounts` | 공식 계정 등록 (`{ userId }`) |
| DELETE | `/admin/official-accounts/{userId}` | 공식 지정 해제 |

- 등록·해제는 그 계정이 가진 **세계관·캐릭터 전부의 공식 표시를 한 번에** 바꾼다.
  따라서 mutation 성공 시 세계관·캐릭터·큐레이션 쿼리를 함께 무효화한다.
- **크리에이터 전환을 하지 않은 계정은 등록돼도 공식으로 노출되지 않는다.**
  서버는 이 경우 경고 로그만 남기고 건너뛰므로(`공식 계정으로 지정된 유저에게
  크리에이터가 없다`), 화면에서 `크리에이터 없음` 뱃지와 상단 경고로 먼저 보여 준다.
- 탈퇴 계정은 등록 단계에서 막는다(409).
- **유저 ID는 문자열로 다룬다.** 서버 ID는 Snowflake라 19자리이고, `number`로
  받으면 2^53을 넘는 값의 뒷자리가 조용히 깎여 아무 계정도 가리키지 않는 값이
  저장된다. (admin 나머지 화면은 아직 `number`를 쓴다 → 5.4)

### 5.2 공통 기능 API

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/search` | 전역 검색(⌘K) — 유저·캐릭터·세계관·해시태그 통합 조회 |
| POST | `/admin/files/upload/{fileType}` | 이미지 업로드 (multipart, `file` 필드) |

### 5.2.1 세계관 · 캐릭터 · 시나리오

**세계관(Universe)이 콘텐츠의 단위다.** 그 안에 캐릭터가 등장하고, 시나리오가 여러 편 실린다.
유저는 세계관에 들어와 시나리오를 하나 골라 대화를 시작한다(`plat-fe`의 상세 > 시나리오 선택).

| 개념 | 무엇인가 | 서버 |
|---|---|---|
| 세계관 | 대표 이미지 · 제목 · 소개 · 상세 설정 · 해시태그 · 에셋을 가진 콘텐츠 단위 | `Universe` |
| 캐릭터 | 세계관에 등장하는 인물 | `Character` + `universe_character_mappings` |
| 시나리오 | 그 세계관에서 시작하는 한 편의 이야기(상황 + 첫 대사) | `Scenario` + `ScenarioTranslation` |

**세계관 ↔ 캐릭터는 N:M이다.** 세계관 하나에 캐릭터가 여럿 등장할 수 있고,
같은 캐릭터가 다른 세계관에도 나온다. 그래서 관계를 매핑으로 두고 양쪽에서 센다.
세계관 목록은 대표 캐릭터(`characters[0]`)만, 캐릭터 목록은 **등장 세계관 수**를 보여 준다.

> 서버는 현재 세계관당 캐릭터 1명으로 쓰고 있지만(`findByUniverse_Id`가 `Optional`),
> 매핑 테이블에 `role_type(MAIN/SUB/NPC) · sort_order` 확장 TODO가 달려 있다.
> 어드민은 처음부터 다중으로 표현해 두어, 서버가 열릴 때 화면을 다시 만들지 않는다.

**메뉴 1뎁스는 캐릭터가 아니라 세계관이다.** 캐릭터를 위에 두면 실제 구조와 반대라,
운영자가 캐릭터에서 세계관을 찾으려 하게 된다.

- 시나리오 종류: `START`(첫 진입) · `NORMAL` · `EVENT` · `ENDING`
- 시나리오 상태: `ACTIVE` · `HIDDEN` · `DEPRECATED`(구버전 — 이미 그 시나리오로 시작한
  방이 남아 있어 지우지 못한다)
- **시작 시나리오가 없으면 유저가 그 세계관에서 대화를 시작할 수 없다.** 세계관은
  멀쩡해 보이는데 대화만 안 되는 상태라, 세계관 상세에서 경고로 짚는다.
- 세계관 목록의 "시나리오 N편"은 구버전을 뺀 수다.

### 5.3 세계관(Universe) 계약

`plat-be`의 세계관은 admin이 처음 잡았던 "제목 · 설명 · 썸네일"보다 넓다.
`Scenario` 타입은 서버 `Universe` / `UniverseDetailResponse`에 맞춘다.

| admin 필드 | 서버 | 비고 |
|---|---|---|
| `thumbnailUrl` | `profileImageUrl` | 세계관 대표 이미지 |
| `characterThumbnailUrl` | `characterProfileUrl` | **대표 이미지와 분리해 따로 올린다** |
| `visibility` | `UniverseVisibility` | `PUBLIC` · `PRIVATE` · `UNLISTED`(일부공개) |
| `status` | `UniverseStatus` | `ACTIVE` · `INACTIVE` · `DELETED`(삭제 대기) · `PURGED`(콘텐츠 파기) |
| `reviewStatus` | `ReviewStatus` | `PENDING` · `APPROVED` · `REJECTED` (+ 반려 사유) |
| `category` | `UniverseCategory` | 장르 8종 |
| `tendency` | `UniverseTendency` | `ALL` · `MALE_ORIENTED` · `FEMALE_ORIENTED` |
| `commentEnabled` | `commentEnabled` | 크리에이터가 세계관마다 정한다 |
| `deletedAt` · `purgeAt` · `purgedAt` | 동일 | 삭제 수명주기 |

**삭제는 두 단계다.** `DELETED`는 유저가 지운 뒤 파기를 기다리는 상태이고,
`PURGED`는 정리 스케줄이 이미지·에셋을 실제로 파기한 상태다. 유예 기간은 서버
파일 설정(`file.temp.release-expiration`, 현재 `P1D`)을 따른다.
파기 전에는 복구 문의를 받을 수 있으므로 두 상태를 같은 색으로 두지 않고,
목록에 **파기 예정일**을 함께 적는다.

세계관 목록은 상태를 고르지 않으면 `DELETED` · `PURGED`를 제외한다.
이미 앱에서 사라진 세계관이 큐레이션 후보에 섞이면 안 된다.

### 5.4 어드민이 먼저 만들고, 메인 서버가 가져다 쓴다

**운영 데이터의 원본은 어드민이다.** 배너 이미지도, 메인에 무엇을 걸지도 여기서
등록해야 메인 서버(`plat-be`)가 가져가 앱에 뿌린다. 그러니 메인 서버에 아직
읽는 경로가 없는 것은 **순서상 당연한 상태**이지 어긋난 상태가 아니다.
어드민 화면은 메인 서버 구현을 기다리지 않고 먼저 완성한다.

| 어드민이 정하는 것 | 앱에서 나가는 자리 |
|---|---|
| 배너 관리 | 메인 최상단 캐러셀 |
| 오늘의 PICK | `GET /home/today-pick` |
| 공식 캐릭터 맛보기 | `GET /home/official-preview` |
| 에셋 추천 | `GET /home/asset-preview` |
| 공식 계정 지정 | 위 세 섹션과 카드의 `isOfficial` 판정 전체 |

대응 관계는 `CURATION_SLOT_CONFIG.serverSection`에 두고 각 큐레이션 화면 상단에
그대로 보여 준다. 운영자가 "이걸 저장하면 앱 어디가 바뀌나"를 화면에서 알 수 있어야 한다.

`/home/popular-tag` · `/home/new-work` · `/home/user-recommend` 세 섹션은
성격상 어드민이 고르는 자리가 아니다(인기 태그 · 최근 30일 신작 · 개인 선호 기반).
큐레이션 화면을 만들지 않는다.

**어드민이 책임지는 것 — 못 나갈 것을 미리 막는다.**
메인 서버는 받은 목록을 그대로 뿌리므로, 앱에 나갈 수 없는 세계관을 골라 두면
그 자리가 조용히 빈다. 그래서 노출 가능 판정(`isExposableScenario`:
활성 · 공개 · 심사 승인)을 어드민이 갖고,

- 세계관 선택 모달은 **노출 가능한 세계관만** 후보로 보여 준다(`exposableOnly`).
- 이미 고른 세계관이 나중에 내려가면 큐레이션 · 배너 화면에서
  사유(`scenarioBlockReason`)와 함께 경고한다.

**남은 정리 — ID 타입.** 서버는 Snowflake ID를 API 경계에서 문자열로 다루는데
admin은 `number`를 쓴다. 공식 계정만 문자열로 맞춰 두었고(운영자가 직접 입력하는
값이라 정밀도 손실이 바로 사고가 된다), 나머지는 연동 시 함께 옮긴다.

### 5.5 로그 · 배치 API

기존 `GET /admin/logs/recent` 하나를 아래로 대체한다.

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/logs/admin` | 관리자 활동 로그. `keyword` · `domain` · `result` · `actorId` |
| GET | `/admin/logs/system` | 시스템 이벤트. `keyword` · `level` · `source` |
| GET | `/admin/batch/jobs` | 배치 잡 정의 + 최근 실행 결과 · 다음 예정 (페이지네이션 없음) |
| GET | `/admin/batch/runs` | 배치 실행 이력. `jobKey` · `status` · `trigger` |
| POST | `/admin/batch/jobs/{jobKey}/run` | 수동 실행. 새 `BatchJobRun`을 반환한다 |
| PATCH | `/admin/batch/jobs/{jobKey}/enabled` | 스케줄 on/off. 잡 정의는 지우지 않는다 |

- **잡 목록은 페이지네이션하지 않는다.** 잡은 코드에 있는 만큼만 존재해 수십 건을
  넘지 않고, 이 화면에서 먼저 봐야 하는 것은 "전부 정상인가"라 한눈에 들어와야 한다.
- **`lastRunStatus`는 이력에서 파생된다.** 잡 목록과 이력을 따로 들고 있으면 둘이
  어긋난다 — 이력이 원본이고 목록은 계산해서 붙인다.
- **어드민은 잡을 만들거나 지우지 않는다.** 원본은 코드의 스케줄러이고, 여기서는
  켜고 끄는 것과 다시 돌리는 것만 한다. 어드민에서 잡을 만들 수 있게 하면 코드에
  없는 배치가 생겨 어디를 봐야 하는지 알 수 없게 된다.
- **수동 실행은 두 곳에 남는다.** 실행 이력에 `trigger: MANUAL`로, 그리고 변경
  요청이므로 감사 핸들러가 관리자 활동 로그에도 남긴다.
- **`result`는 서버가 처리 후에 정한다.** 목업은 요청을 가로채는 시점에 적재해
  항상 `SUCCESS`다. 실서버는 `DENIED` · `FAILED`를 구분해 남겨야 이 컬럼이 값을 한다.

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

## 6.5 관리자 권한

**권한은 사람이 아니라 직책(`AdminRole`)이 갖는다.** 관리자는 직책에 들어갈 뿐이다.

사람마다 권한을 주면 관리자가 열 명일 때 설정도 열 번, 점검도 열 번이다.
규칙이 바뀌면 열 곳을 고쳐야 하고 한 곳만 빠뜨리면 그 사람만 조용히 다른 권한을 갖는다.
"크레딧을 지급할 수 있는 사람이 누구인가"를 물었을 때 직책이면 하나만 열어 보면 된다.

### 권한 키

`리소스:행위` 형태다. (`creditAdjustment:adjust`)
**화면(메뉴)이 아니라 자료와 행위 기준으로 나눈다.** 화면은 합쳐지고 쪼개지지만
자료는 그대로다.

| 행위 | 뜻 |
|---|---|
| `read` | 목록과 상세를 본다 |
| `write` | 새로 만들고 고친다 |
| `delete` | 지운다. 되돌릴 수 없다 |
| `publish` | 앱에 공개한다 (공지 게시, 법적 고지 활성) |
| `adjust` | 유저 크레딧을 실제로 지급·차감한다 |
| `send` | 외부(이용자)에게 내보낸다 (푸시, Q&A 답변) |

`read`/`write`/`delete`는 어디에나 있고, 나머지는 **되돌릴 수 없는 행위만** 따로 뗐다.
행위를 잘게 쪼갤수록 좋은 것이 아니라, 실수했을 때 되돌리기 어려운 것부터 떼는 것이 맞다.

### 갈래

설정 화면은 자료를 **행위 구성이 같은 것끼리** 묶는다. 업무 영역이 아니다.
서른 개 자료를 한 표에 넣으면 `지급 · 차감` 열이 스물일곱 칸 비게 된다.
갈래로 나누면 갈래마다 열 이름이 달라지고 빈칸이 사라진다.

`만들고 고치고 지우는 자료` · `지우지 않는 자료` · `앱에 공개하는 자료` ·
`밖으로 나가는 자료` · `돈이 오가는 자료` · `보기만 하는 자료`

### 규칙

- **`write`는 `read`를 품는다.** 저장할 때 `normalizePermissions`로 한 번 정규화하고,
  판정하는 쪽은 단순 포함 검사만 한다.
- **최고관리자 직책은 잠겨 있다.** 권한을 뺄 수 있으면 실수 한 번으로
  "권한을 되돌릴 사람이 아무도 없는" 상태가 만들어진다.
- **속한 관리자가 있는 직책은 지울 수 없다.** 지우면 그 사람의 권한이 사라진다.
- 갈래에 넣지 않은 자료가 있으면 **컴파일 때 타입 오류가 난다.**
  빠뜨리면 그 자료는 설정 화면에 아예 나타나지 않아 한참 뒤에야 발견된다.
- **관리자 활동 로그(`log:read`)는 민감 자료다.** 변경된 값이 `payload`에 그대로
  남으므로, 이 권한은 "다른 관리자가 무엇을 어떤 값으로 바꿨는지"를 전부 열어 주는
  것과 같다. 시스템 이벤트(`systemLog:read`)와 한 권한으로 묶으면 장애를 보려는
  사람에게 감사 기록까지 함께 열린다.
- **배치는 `read`와 `write`를 나눈다.** 수동 실행은 스케줄과 같은 처리를 그대로
  다시 돌리는 것이라 되돌릴 수 없는 일(크레딧 소멸 · 파일 파기)이 섞여 있다.

### 쓰는 법

| 상황 | 사용 |
|---|---|
| 화면에서 권한 확인 | `useHasPermission("user:write")` |
| 화면 전체 차단 | `<PermissionGate required="role:read">` 또는 `<PermissionDenied />` |
| 조회 자체를 막기 | `usePermittedQuery("role:read", { ... })` |
| 훅을 못 쓰는 자리 | `checkPermission(...)` / `can("user", "write")` |

메뉴는 `constants/menu.tsx`의 `permission`으로 걸고, 사이드바와 전역 검색(⌘K)이
**권한 없는 메뉴를 아예 그리지 않는다.** 회색으로 두면 운영자는 자기가 못 하는 일의
목록을 매일 보게 된다.

**메뉴 항목은 권한 키를 하나만 건다.** 화면 안에서 권한이 갈리는 경우
(`/ops/logs`는 관리자 활동 `log:read` · 시스템 이벤트 `systemLog:read`)
메뉴에는 **넓은 쪽**을 걸고 좁은 쪽은 화면 안에서 막는다. 좁은 쪽을 걸면 장애를
보려는 사람이 메뉴 자체를 못 본다. 이 한계를 없애려면 `permission`을 배열로 넓히고
`Sidebar` · `CommandPalette` · `RoutePermissionGate` 세 곳을 함께 고쳐야 한다.

화면을 감추는 것은 **실수를 줄이는 장치일 뿐** 막는 수단이 아니다.
실제로 막는 것은 서버다. 서버만 있으면 운영자가 끝까지 입력한 뒤에야 거부당하고,
화면만 있으면 주소를 직접 치는 순간 통과한다.

### API

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/roles` | 직책 목록 |
| POST | `/admin/roles` | 직책 추가 |
| PUT | `/admin/roles/{roleId}` | 직책 이름 · 설명 · 권한 저장 |
| DELETE | `/admin/roles/{roleId}` | 직책 삭제 (속한 관리자가 있으면 409) |

## 7. 인증 · 계정 수명주기

서버 인증 API가 붙기 전이라도 **콘솔은 로그인해야 들어올 수 있어야 한다.**
계정을 만들어도 들어올 방법이 없으면 관리자 관리는 이름만 있는 화면이다.
그래서 전 과정을 MSW로 구동하고, 서버가 준비되면 **API 함수만 갈아 끼우도록** 격리했다.

| Method | Path | 목적 |
|---|---|---|
| POST | `/admin/auth/login` | `{ email, password }` → `{ accessToken, admin, mustChangePassword }` |
| POST | `/admin/auth/logout` | 세션 종료 |
| GET | `/admin/auth/me` | 세션 복구 |
| PATCH | `/admin/auth/password` | 비밀번호 변경 |

### 세션

- `useAdminStore`가 토큰 · 관리자 · 강제 변경 여부를 `localStorage`에 둔다.
  복구 완료 플래그(`isHydrated`)를 함께 두어 **새로고침마다 로그인 화면이 번쩍이지 않게** 한다.
- `axios` 요청 인터셉터가 토큰을 싣고, 401이면 세션을 지우고
  `/login?redirect=…&reason=expired`로 보낸다. **로그인 요청 자체의 401은 화면이 처리한다.**
- `AuthGuard`(세션) · `RoutePermissionGate`(권한)를 `(admin)/layout.tsx` **한 곳**에서만 건다.
  화면마다 검사를 넣으면 한 화면만 빠뜨려도 그 주소는 계속 열린다.
  권한이 없으면 사이드바 · 헤더는 남기고 **본문만** 안내로 바꾼다 — 통째로 가리면
  다른 화면으로 이동할 방법이 사라진다.

### 계정 상태

`INVITED`(초대됨) · `ACTIVE`(활성) · `INACTIVE`(비활성) · `LOCKED`(잠김).
활성/비활성 두 값으로는 **"초대해 두고 아직 안 들어온 계정"과 "실패가 쌓여 잠긴 계정"**을
구분할 수 없다. 둘은 운영자가 해야 할 일이 다르다.

- **초대 = 계정 생성 + 임시 비밀번호 1회 발급.** 응답에서 한 번만 내려오고 다시 볼 수 없다.
  저장해 두고 재조회를 열면 평문 비밀번호를 언제든 꺼낼 수 있다는 뜻이라, 초기화 기능이
  있는 의미가 없어진다.
- 임시 비밀번호로 들어오면 `mustChangePassword`가 서고, **닫을 수 없는 변경 모달**이 뜬다.
- 로그인 5회 실패 시 자동 잠금. 잠금 해제는 다른 관리자만 할 수 있다.
- **안전장치는 목업 핸들러가 실제로 409를 낸다.** 화면에서 버튼을 감추는 것만으로는
  주소를 직접 부르면 통과한다.
  1. 자기 계정: 비활성 · 직책 변경 · 삭제 불가
  2. 마지막 활성 최고관리자: 비활성 · 직책 변경 · 삭제 불가
  3. `LOCKED`는 직접 지정 불가(로그인 실패로만 걸린다)

### 목업 계정

로그인 화면 하단에 시드 계정을 안내한다. **`NEXT_PUBLIC_API_MOCKING=enabled`일 때만**
그린다 — 실서버 모드에서 이 카드가 남으면 그대로 사고다.

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
