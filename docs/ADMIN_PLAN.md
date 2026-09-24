# plat-admin-fe — 관리자 프론트엔드 설계서

> 메뉴 분류 기준, 라우트 구조, 화면별 책임, 실서버 · 목업 경계를 정의한다.
> 출발점은 `docs/PLAN.md`(최초 기능 계획서)였지만, 그 문서는 이제 **보관 문서**라 이후 결정이
> 반영되어 있지 않다. 현재 계약은 이 문서와 `README.md`(실서버 연동 현황), 서버 계약은 plat-be `docs/`를 본다.
> 코드 작성 규칙은 `docs/DEVELOPMENT_GUIDE.md`에 있고, 여기서는 되풀이하지 않는다.

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
| 환경 | 프로파일 `local` · `develop` · `main` | `src/config/appEnv.ts` · `next.config.ts`. **브랜치 이름이 곧 프로파일**이고, 실서버 주소 · 이미지 주소 · 목업 여부를 한 번에 정한다 |
| HTTP | axios 인스턴스 둘 (`src/api/index.ts`) | `liveAxios` = 실서버(plat-be), `adminAxios` = MSW 목업 구간. 인터셉터(토큰 · 재발급 · 오류 정규화)는 같다 |
| 폼 | react-hook-form + zod + `@hookform/resolvers` | |
| 토스트 | sonner | |
| 애니메이션 | CSS 키프레임 (`globals.css`) | plat-fe는 framer-motion을 쓰지만, admin은 모션이 최소라 의존성을 두지 않았다 |
| 날짜 | dayjs | |
| 마크다운 | react-markdown + remark-gfm + remark-breaks | 법적 고지·공지·프롬프트 미리보기 |
| 드래그 정렬 | @hello-pangea/dnd | 배너·홈 편성 순서 변경 |
| 차트 | recharts | 대시보드 · 서버 상태 (admin에서 추가) |
| 목업 | MSW v2 | **서버에 엔드포인트가 없는 도메인만** 목업으로 구동. 운영(`main`)에서는 꺼진다 |
| 폰트 | pretendard | |

`plat-fe`에 있으나 admin에서 제외한 것: `next-intl`(관리자는 한국어 단일),
`embla-carousel`, `react-easy-crop`, `next-navigation-guard`.

프로파일별 주소와 덮어쓰기 규칙은 `README.md`의 "환경 구성"이 원본이다.

---

## 2. 메뉴 분류 기준

좌측 메뉴는 화면 개수만큼 늘리지 않는다. 아래 기준을 고정한다.

1. **1뎁스 = 운영 대상 도메인.** 운영자가 "무엇을 다루는가"로 묶는다. 화면 단위나
   API 단위가 아니라, 데이터를 소유한 도메인 단위다.
2. **2뎁스 = 도메인 내부의 업무 단위.** `목록/관리`, `정책`, `이력` 세 성격 중 하나에
   대응시킨다.
3. **하위가 1개뿐인 도메인은 2뎁스를 만들지 않고 1뎁스 단독 메뉴로 둔다.**
   (대시보드, 법적 고지)
4. **아직 실서버에 붙지 않은 기능도 메뉴에 노출하되 `MOCK` 배지를 단다.** 화면은
   목업으로 동작하지만 여기서 한 일이 앱에 반영되지 않는다는 것을 UI에서 명확히 한다.
   메뉴에서 지우면 나중에 왜 없는지 아무도 모르고, 배지 없이 두면 저장한 값이 실제로
   반영되는 줄 안다.
5. **권한이 다른 기능은 같은 도메인이어도 2뎁스로 분리한다.**
   (결제/크레딧, 관리자 관리)

---

## 3. 메뉴 트리 & 라우트

기준 목록은 `src/constants/menu.tsx`의 `ADMIN_MENU`다. 이 표와 어긋나면 코드가 맞다.

| # | 1뎁스 | 2뎁스 | 라우트 | 비고 |
|---|---|---|---|---|
| 1 | 대시보드 | — | `/` | 단독 메뉴 · **MOCK** |
| 2 | 메인 노출 관리 | 배너 관리 | `/main-exposure/banners` | 언어별 캐러셀 |
| | | 오늘의 PICK | `/main-exposure/today-pick` | 언어별 최대 10개 |
| | | 공식 캐릭터 맛보기 | `/main-exposure/official-pick` | **감춤**(`hidden`) · 언어별 최대 3개 |
| | | 에셋 추천 | `/main-exposure/asset-pick` | **감춤**(`hidden`) · 언어별 최대 3개 |
| 3 | 세계관 | 세계관 | `/universes` | 상세 `/universes/[universeId]` |
| | | 캐릭터 | `/universes/characters` | **MOCK** · 상세 `/universes/characters/[characterId]` |
| | | 해시태그 관리 | `/universes/hashtags` | 사용자는 여기 등록된 태그만 사용 · 유저 제안 처리 |
| | | 금지어 관리 | `/universes/banned-words` | |
| | | 채팅 내보내기 | `/universes/chat-exports` | **MOCK** |
| 4 | 커뮤니티 | 댓글 관리 | `/community/comments` | 전 영역 댓글 통합 |
| | | 신고 관리 | `/community/reports` | 대상별 케이스 · 상세 `/community/reports/[caseId]` |
| 5 | 유저/크리에이터 | 유저 관리 | `/users` | 상세 `/users/[userId]` |
| | | 공식 계정 | `/users/official` | 공식으로 취급할 **유저 ID** 등록 |
| 6 | AI 운영 | 모델 카탈로그 | `/ai/catalog` | |
| | | AI 모델 관리 | `/ai/models` | |
| | | 시스템 프롬프트 | `/ai/prompts` | |
| 7 | 결제/크레딧 | 상품/결제금액 관리 | `/billing/products` | |
| | | 크레딧 정책 관리 | `/billing/credit-policies` | **MOCK** |
| | | 크레딧 수동 조정 | `/billing/credit-adjustments` | |
| | | 결제 장부 | `/billing/ledger` | |
| | | 결제 보존 원장 | `/billing/retention` | **MOCK** · 탈퇴/파기 후에도 법정 5년 보존 · PG 거래번호로 조회 |
| 7-1 | 제작자 수익 | 제작자 수익 | `/earnings/creators` | 상세 `/earnings/creators/[accountId]` · 동결 · 차감 |
| | | 교환 요청 | `/earnings/redemptions` | 상품권 수동 발송 · 반려 · 처리 대기 뱃지 |
| | | 수익 정책 · 교환 상품 | `/earnings/policy` | 정책은 이력으로 쌓인다 · 상품 이미지 업로드 |
| | | 대사 결과 | `/earnings/reconciliation` | 매일 00:40 대사 · 불일치는 Slack |
| 8 | 커뮤니케이션 | 공지사항 관리 | `/communication/notices` | 마크다운 |
| | | Q&A 관리 | `/communication/qna` | **MOCK** |
| | | 알림 관리 | `/communication/notifications` | **MOCK** |
| | | 선제 메시지 | `/communication/proactive-messages` | **MOCK** |
| | | 푸시 발송 | `/communication/push` | **MOCK** |
| 9 | 법적 고지 | — | `/legal` | 단독 메뉴 · **MOCK**(현재 Notion 관리) |
| 10 | 운영 | 직책 · 권한 | `/ops/roles` | 권한은 직책이 갖는다 |
| | | 관리자 관리 | `/ops/managers` | 계정에 직책만 배정 |
| | | 앱 버전 관리 | `/ops/app-versions` | **MOCK** |
| | | 서버 상태 | `/ops/server` | |
| | | 배치 관리 | `/ops/batch` | 잡 정의 + 실행 이력 · 수동 재실행 |
| | | 로그 | `/ops/logs` | 탭 2개 — 관리자 활동 · 시스템 이벤트 |

메뉴 밖의 화면: `/login`(로그인), `/ops/my-account`(헤더 프로필 → 내 계정).

**감춤(`hidden`)은 MOCK과 다르다.** 두 편성 화면은 실서버에 붙어 있고 저장도 되지만,
MVP에서 앱이 그 섹션을 읽지 않아 **담아도 어디에도 나가지 않는다**(plat-be
`docs/decisions/004-mvp-home-section-scope.md`). 열어 두면 운영자가 담아 놓고 왜 안 보이는지
찾게 되므로 사이드바와 ⌘K에서만 뺀다. 섹션이 돌아오면 `hidden` 한 줄만 지우면 된다.
주소로 직접 들어가면 권한 검사를 거쳐 화면은 그대로 열린다.

과거에 "MVP 제외"와 "MOCK" 두 배지를 쓰던 것을 **MOCK 하나로 합쳤다** — 운영자에게는 같은
말이었다. 여기서 한 일이 앱에 반영되지 않는다.

그래서 배지가 붙는 기준은 "MVP 범위인가"가 아니라 **"지금 실서버에 붙어 있는가"**다.
MVP 범위여도 아직 목업이면 배지가 붙고, 실연동되면 뗀다. 현재 배지가 붙은 화면은
아래 11개이며, 기준 목록은 `src/constants/menu.tsx`의 `isMock`이다.

| 배지가 붙은 이유 | 화면 |
|---|---|
| 아직 실서버에 연결되지 않음 | 대시보드 · 캐릭터 · 채팅 내보내기 · 크레딧 정책 관리 · 결제 보존 원장 · Q&A 관리 |
| 현재 다른 도구(Discord)로 운영 | 알림 관리 · 선제 메시지 · 푸시 발송 |
| 현재 다른 도구(Notion)로 운영 | 법적 고지 |
| 앱이 아직 이 정책을 읽어 가지 않음 | 앱 버전 관리 |

### 3.1 커뮤니티 도메인을 따로 둔 이유

댓글과 신고는 모두 **유저가 만든 것을 검수·차단하는(UGC 모더레이션)** 업무다.

- `세계관 > 댓글`에 넣으면 다른 영역에 댓글이 생기는 순간 위치가 틀어진다.
- `커뮤니케이션`은 **운영자 → 유저** 방향(알림·푸시·공지·Q&A)이고,
  댓글·신고는 **유저 ↔ 유저** UGC라 성격이 다르다.
- 분류 기준(1뎁스 = 운영 대상 도메인)에 따르면 UGC 모더레이션은 독립 도메인이다.

같은 이유로 기존 `캐릭터 > 캐릭터 신고 관리`를 **`커뮤니티 > 신고 관리`로 옮기고
신고 대상을 다형화**했다. 캐릭터만 신고 대상이던 구조로는 다른 대상의 신고를 받을 수 없고,
신고가 대상별로 흩어지면 운영자가 여러 화면을 오가야 한다.
향후 게시글 등 UGC가 늘어도 `targetType`에 값만 추가하면 같은 화면에서 처리한다.

### 3.2 로그를 셋으로 나눈 이유

운영 로그 하나에 **관리자 활동 · 배치 실행 · 시스템 오류**가 함께 쌓이고 있었다.
셋은 답해야 하는 질문이 다르고, 그래서 필요한 컬럼 · 필터 · 보존 기간 · 권한이
모두 다르다. 한 표에 담으면 세 가지 모두 최소공배수만 보여 주게 된다.

| | 주체 | 답해야 할 질문 | 핵심 컬럼 |
|---|---|---|---|
| 관리자 활동 | 사람 | 누가 무엇을 어떤 값으로 바꿨나 | 결과 · 대상 · 변경 값 · 직책 · IP |
| 배치 실행 | 잡 | 제대로 돌았나 · 다시 돌려야 하나 | 상태 · 소요 · 처리/실패 건수 · 트리거 |
| 시스템 이벤트 | 서버 | 지금 무엇이 터지고 있나 | 레벨 · 발생원 · 발생 횟수 · traceId |

나누기 전의 목업이 이미 그 증거였다. 사람을 담는 `actor` 자리에 `system` ·
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

### 3.3 결제 보존 원장을 장부와 나눈 이유

`결제 장부`와 `결제 보존 원장`은 같은 결제를 다루지만 **답해야 하는 질문이 다르다.**

| | 대상 | 답해야 할 질문 | 조회 키 |
|---|---|---|---|
| 결제 장부 | 지금 이용 중인 회원 | 이 유저의 돈과 크레딧이 어떻게 흘렀나 | 유저(닉네임 · ID) |
| 결제 보존 원장 | 탈퇴 · 파기된 회원 포함 전체 | 이 거래가 무엇을 얼마에 팔았고 어떻게 끝났나 | **PG 거래번호** |

**탈퇴하면 개인정보는 파기하지만 결제 기록은 지울 수 없다.** 전자상거래법 제6조와
같은 법 시행령 제6조가 *대금결제 및 재화 등의 공급에 관한 기록*을 5년간 보존하도록
하고, 개인정보보호법 제21조 단서가 "다른 법령에 따라 보존하는 경우"를 파기 의무의
예외로 둔다. 그래서 남길 수 있는 것은 **두 요구가 겹치는 범위뿐이다.**

- 남긴다 — 결제사 거래번호(`pgTid`) · 가맹점 주문번호 · 카드 승인번호, 상품과 지급
  크레딧, 금액 · 부가세, 승인 · 취소 · 부분환불 · 환불과 그 시각, 보존 만료일.
- 남기지 않는다 — 이름 · 연락처 · 이메일 · 카드번호. 파기 시점에 함께 지운다.

그래서 **이 화면은 유저로 조회할 수 없다.** 파기가 끝난 건에는 닉네임도 유저 ID도
없고, 남는 것은 결제사가 발급한 거래번호와 되돌릴 수 없는 회원 해시(`userKey`)뿐이다.
장부에 이 기록을 섞으면 유저 컬럼이 대부분 비어 있는 표가 되고, 반대로 원장을 두지
않으면 분쟁이 들어왔을 때 근거를 꺼낼 곳이 없다.

**취소(`CANCELED`)와 환불(`REFUNDED`)을 나눈다.** 장부에서는 둘 다 돈이 되돌아간
'환불'이지만, 취소는 매입 전에 승인을 무른 것이라 유저의 카드 명세서에 아무것도
남지 않고 환불은 결제와 환불이 각각 찍힌다. 문의가 들어왔을 때 유저가 보고 있는
화면이 다르므로 원장에서는 구분해 둔다. 부분환불(`PARTIAL_REFUNDED`)도 별도 상태다.

**결제사는 아직 확정되지 않았다.** `PgProvider`에 국내에서 흔히 붙이는 곳
(카카오페이 · 토스페이먼츠 · 네이버페이 · 페이코 · 나이스페이 · KG이니시스)과
스토어 인앱 결제(App Store · Google Play)를 미리 열거하고, **거래번호 형식도 결제사마다
다르게** 목업했다. 형식을 하나로 통일해 두면 화면이 그 생김새를 전제로 만들어지고,
실제 결제사를 붙이는 날 `GPA.####-####-####-#####` 같은 값이 깨져 보인다.
확정되면 쓰지 않는 값을 지우면 된다.

**권한은 장부와 같은 `ledger:read`를 쓴다.** 장부를 보는 사람 전부가 파기된 회원의
거래 기록까지 열 이유는 없어 원래는 따로 떼려 했다. 그러나 서버 권한 자원(`AdminResource`)에
보존 원장이 없고, 서버에 없는 키를 직책에 저장하면 400(`ADMIN_PERMISSION_INVALID`)으로
거부된다(→ 7장). 열람을 따로 떼려면 서버에 자원이 먼저 생겨야 한다.

**유저 상세(`결제 · 크레딧` 탭)에도 이 유저의 원장을 카드로 붙였다.** 문의 한 건을
처리하려고 유저 화면과 원장 화면을 오갈 이유가 없다 — 결제사에 물어볼 거래번호 ·
승인번호는 장부에 없고 원장에만 있다. 조회는 유저 ID가 아니라 **회원 해시로** 걸어
파기가 끝난 건도 함께 나오게 하고, 카드는 `ledger:read`가 없으면 감춘다.
빈 표를 남기면 "이 유저는 결제한 적이 없다"로 읽혀 바로 위 장부와 어긋나 보인다.

---

## 4. 메인 노출 관리

**앱 메인 화면에 무엇을 노출할지 운영자가 직접 고르는 곳**이다. 두 갈래로 나뉜다.

| 갈래 | 화면 | 서버 자료 | 앱에서 읽는 곳 |
|---|---|---|---|
| 배너 | 배너 관리 | `/admin/main-banners` | `GET /home/banners` |
| 홈 편성 | 오늘의 PICK | `/admin/home-sections` (`TODAY_PICK`) | `GET /home/today-pick` |
| | 공식 캐릭터 맛보기 (감춤) | `/admin/home-sections` (`OFFICIAL_PREVIEW`) | 없음 |
| | 에셋 추천 (감춤) | `/admin/home-sections` (`ASSET_PREVIEW`) | 없음 |

**모든 목록은 언어별로 따로다.** 앱이 언어를 붙여 가져가는 목록이 곧 한 칸이라,
배너도 편성도 언어 탭(한국어 · 영어 · 일본어 · 중국어 · 태국어 · 베트남어)마다 따로
등록하고 순서를 매긴다. 탭에는 언어별 등록 건수를 붙여 비어 있는 언어를 먼저 보여 준다.

### 4.1 배너 관리 `/main-exposure/banners`

메인 최상단 캐러셀이다. **배너는 이미지 한 장이 전부다.** 예전에는 세계관을 물고
제목 · 설명 · 태그를 앱이 템플릿에 합성했지만, 배너에는 이벤트 · 공지처럼 세계관이 없는
것도 들어온다. 템플릿을 걷어내고 완성된 이미지를 그대로 내보낸다 — 무엇을 그릴지는
이미지가 정하고, 어드민은 어디로 보낼지만 정한다. (`src/type/mainExposure.ts`의 `Banner`)

- 배너 1건 = `언어` + `이름` + `이미지(imageFileId)` + `링크(linkUrl)` + `노출 여부` + `노출 기간`
- **배너 한 건은 언어 하나에만 속한다.** 이미지에 글자가 박혀 있어서다. 다른 언어에도 같은
  자리를 채우려면 복제해서 그 언어 이미지로 바꾼다.
- `이름`은 어드민 목록에서 배너를 가리키는 말이다. **앱에는 나가지 않는다.**
- `링크`는 웹 주소든 앱 딥링크(`plat://`)든 `스킴://` 형식이면 받는다. 비우면 눌러도 이동하지 않는다.
- 노출 기간은 시각이 아니라 **날짜(`YYYY-MM-DD`)**다. 경계는 서비스 시간대(KST) 기준이다.
- 이미지는 먼저 올려 `fileId`를 받고, 저장할 때 `imageFileId`로 넘긴다(→ 5.2).
- 추가 / 수정 / 복제 / 삭제 / 드래그 순서 변경(`순서 저장`으로 언어 전체를 한 번에 보낸다)
- 실제 앱과 같은 비율(1720×310, `BANNER_ASPECT_RATIO`)의 미리보기를 제공한다. 앱이 이미지를
  그대로 까므로 미리보기도 아무것도 얹지 않는다.

폼 규칙은 `src/schema/banner.schema.ts`, API는 `src/api/main-exposure/getBannerList.ts` ·
`mutateBanner.ts`에 있다.

### 4.2 홈 편성 — 공통 전제

오늘의 PICK · 공식 캐릭터 맛보기 · 에셋 추천은 **같은 "세계관 편성" 화면**이다.
`src/components/universe/HomeSectionBoard.tsx` 하나를 공유하고, 섹션별로 다른 값
(최대 개수 · 후보 필터 · 기본 정렬 · 앱에서 나가는 자리)은 `src/constants/mainExposure.ts`의
`HOME_SECTION_CONFIG`에 둔다. 키는 서버 `HomeSection` enum 값을 그대로 쓴다.

| 섹션 키 | 최대 개수(언어당) | 후보 필터 | 기본 정렬 |
|---|---|---|---|
| `TODAY_PICK` | 10 | — | `CREATED_DESC` |
| `OFFICIAL_PREVIEW` | 3 | 공식 계정의 세계관만(`officialOnly`) | `CHAT_DESC` |
| `ASSET_PREVIEW` | 3 | — | `LIKE_DESC` |

- **누르는 즉시 저장된다.** 서버가 등록(POST) · 해제(DELETE)는 한 건씩, 순서(PATCH `/order`)만
  섹션 · 언어 전체로 받는다. 화면에서 "저장" 하나로 묶으면 중간에 실패했을 때 서버와 화면이
  어긋나므로, 화면도 서버와 같은 단위로 나눠 부른다.
- **열쇠는 세계관 ID가 아니라 편성 행 ID(`homeSectionId`)다.** 같은 세계관이라도 언어가 다르면
  다른 행이다.
- 슬롯이 다 차면 추가 버튼을 막는다.
- 세계관 선택은 `src/components/universe/UniversePickerModal.tsx`를 쓴다.

### 4.3 공식 캐릭터 맛보기 `/main-exposure/official-pick` (감춤)

- **공식** 세계관 언어당 **최대 3개**.
- 후보는 `officialOnly`로 좁힌다. 공식 여부는 세계관에 저장된 값이 아니라 **소유
  크리에이터가 공식 계정으로 지정되어 있는지**로 계산된다(→ 5.5). 후보가 비면 세계관을 찾을
  것이 아니라 `유저/크리에이터 > 공식 계정`(`/users/official`)에 계정이 등록되어 있는지 먼저 본다.
- 이 섹션만 **맛보기 회차(`scenarioId`)를 지목한다**(`PATCH /admin/home-sections/{id}/scenario`,
  `src/components/universe/ScenarioPickerModal.tsx`). 세계관만 고르면 앱이 어느 회차를 실어야
  할지 알 수 없어서다.

### 4.4 에셋 추천 `/main-exposure/asset-pick` (감춤)

- 세계관 언어당 **최대 3개**. 에셋을 크게 보여 주는 섹션이라 대표 이미지와 에셋이 잘 갖춰진
  세계관을 고른다.
- MVP의 앱 `GET /home/asset-preview`는 편성 행이 아니라 실시간 대화량 순위로 3편을 고른다.
  그래서 여기서 담은 목록은 지금 어디에도 나가지 않는다.

### 4.5 어드민이 먼저 만들고, 메인 서버가 가져다 쓴다

**운영 데이터의 원본은 어드민이다.** 배너 이미지도, 메인에 무엇을 걸지도 여기서
등록해야 메인 서버(`plat-be`)가 가져가 앱에 뿌린다. 섹션이 앱에서 잠시 내려가 읽는 경로가
없는 것은 편성 데이터를 버릴 이유가 아니다 — 그래서 화면을 지우지 않고 메뉴에서만 감춘다.

각 편성 화면 상단에는 `HOME_SECTION_CONFIG.serverSection`으로 "이걸 저장하면 앱 어디가 바뀌나"를
보여 준다. 운영자가 화면에서 알 수 있어야 한다.

`/home/popular-tag` · `/home/new-work` · `/home/all` 섹션은 성격상 어드민이 고르는 자리가 아니다
(인기 태그 · 신작 · 전체 모음). 편성 화면을 만들지 않는다.

**어드민이 책임지는 것 — 못 나갈 것을 미리 막는다.**
메인 서버는 받은 목록을 그대로 뿌리므로, 앱에 나갈 수 없는 세계관을 골라 두면
그 자리가 조용히 빈다.

- 세계관 선택 모달은 **노출 가능한 세계관만** 후보로 보여 준다(`ACTIVE` · `PUBLIC` · `APPROVED`).
  판정은 `src/type/character.ts`의 `isExposableUniverse` · `universeBlockReason`이다.
- 이미 고른 세계관이 나중에 내려가면 서버가 편성 행에 `exposed: false`와 `hiddenReason`을
  실어 준다. 서버는 행을 지우지 않는다 — 되돌아올 수 있는 상태라서다. 화면은 그 사유로 경고한다.

---

## 5. 프론트엔드 API 매핑

### 5.0 연동 방식

- **실서버(`liveAxios`)** — 서버에 엔드포인트가 있는 도메인. 새 화면의 기본값이다.
- **목업(`adminAxios` + MSW)** — 서버에 아직 엔드포인트가 없는 도메인만. 메뉴에 MOCK 배지가 붙는다.
- 목록은 서버 `PageWith`(페이지 0부터)로 오고, 경계에서 `toPageRequest` · `toPageResponse`
  (`src/type/api/index.ts`)로 화면의 1부터 세는 `PageResponse`로 바꾼다.
- **Snowflake ID는 문자열이다.** `Number()`로 바꾸면 끝자리가 뭉개져 다른 대상을 가리킨다.
  자동 증가 ID(공지 · 해시태그 · 금지어 · 직책 · 관리자 등)만 `number`로 쓴다.
- 서버 DTO와 화면 타입이 다르면 API 파일 안에서만 변환한다.

규칙의 원본은 `docs/DEVELOPMENT_GUIDE.md` 3장이다. 도메인별 연동 여부는 `README.md`의
"실서버 연동 현황"과 같아야 한다.

| 도메인 | 연동 | 경로 | 소스 |
|---|---|---|---|
| 인증 · 내 계정 | 실서버 | `/admin/auth/**` | `src/api/auth/` |
| 관리자 계정 · 직책 | 실서버 | `/admin/managers` · `/admin/roles` | `src/api/ops/` |
| 유저 | 실서버 | `/admin/users` | `src/api/user/` |
| 세계관 | 실서버 | `/admin/universes` | `src/api/universe/` |
| 공식 계정 | 실서버 | `/admin/official-accounts` | `src/api/official/` |
| 해시태그 · 제안 | 실서버 | `/admin/hashtags/**` | `src/api/hashtag/` |
| 금지어 | 실서버 | `/admin/banned-words` | `src/api/word/` |
| 댓글 | 실서버 | `/admin/comments` | `src/api/comment/` |
| 메인 배너 · 이미지 업로드 | 실서버 | `/admin/main-banners/**` | `src/api/main-exposure/` · `src/api/file/` |
| 홈 편성 | 실서버 | `/admin/home-sections` | `src/api/main-exposure/` |
| 공지사항 | 실서버 | `/admin/notices` | `src/api/notice/` |
| AI 모델 · 카탈로그 · 시스템 프롬프트 | 실서버 | `/admin/ai/models/**` · `/admin/ai/prompts` | `src/api/ai/` |
| 상품 | 실서버 | `/admin/billing/products` | `src/api/billing/` |
| 크레딧 수동 조정 | 실서버 | `/admin/credits/adjustments` · `/admin/credits/users` | `src/api/billing/` |
| 결제 장부 | 실서버 | `/admin/ledgers/**` | `src/api/billing/` |
| 제작자 수익 · 교환 상품 | 실서버 | `/admin/earnings/**` · `/admin/reward-products/**` | `src/api/earning/` |
| 관리자 활동 · 시스템 로그 | 실서버 | `/admin/logs/**` | `src/api/ops/` |
| 배치 | 실서버 | `/admin/batch/**` | `src/api/ops/` |
| 서버 상태 | 실서버 | `/admin/server/**` | `src/api/ops/` |
| 신고 | 실서버 | `/admin/reports/**` | `src/api/report/` |
| 대시보드 | 목업 | `/admin/dashboard/summary` | `src/api/dashboard/` |
| 캐릭터 · 채팅 내보내기 | 목업 | `/admin/characters` · `/admin/chat-exports` | `src/api/character/` |
| 크레딧 정책 | 목업 | `/admin/credits/policies` | `src/api/billing/` |
| 결제 보존 원장 | 목업 | `/admin/payment-records/**` | `src/api/billing/` |
| Q&A · 알림 템플릿 · 선제 메시지 · 푸시 | 목업 | `/admin/qna` · `/admin/notifications/templates` · `/admin/proactive-messages` · `/admin/push/campaigns` | `src/api/communication/` |
| 법적 고지 | 목업 | `/admin/legal` | `src/api/legal/` |
| 앱 버전 | 목업 | `/admin/app-versions` | `src/api/ops/` |
| 처리 대기 건수 | 목업 | `/admin/ops/pending-counts` | `src/api/ops/getPendingCounts.ts` |
| 교환 요청 대기 건수 | 실서버 | `/admin/earnings/redemptions/pending-count` | `src/api/earning/getRedemptionList.ts` |
| 전역 검색(⌘K 엔티티) | 목업 | `/admin/search` | `src/api/search/` |

아래는 경로만으로는 알 수 없는 **계약의 이유**가 있는 도메인만 적는다.

### 5.1 메인 노출

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/main-banners?language=` | 언어별 배너 목록 |
| GET | `/admin/main-banners/languages` | 언어별 배너 건수 |
| POST | `/admin/main-banners` | 배너 추가 |
| PUT | `/admin/main-banners/{bannerId}` | 배너 수정 |
| DELETE | `/admin/main-banners/{bannerId}` | 배너 삭제 |
| PATCH | `/admin/main-banners/order` | 배너 순서 저장 (`language` + 그 언어 전체 `orderedIds`) |
| GET | `/admin/home-sections?section=&language=` | 편성 목록 |
| POST | `/admin/home-sections` | 편성 등록 (한 건씩, 맨 뒤에 붙는다) |
| DELETE | `/admin/home-sections/{homeSectionId}` | 편성 해제 |
| PATCH | `/admin/home-sections/{homeSectionId}/scenario` | 맛보기 회차 지정 · 해제 (`OFFICIAL_PREVIEW`만) |
| PATCH | `/admin/home-sections/order` | 편성 순서 저장 (섹션 · 언어 전체) |

- 배너 순서는 **그 언어의 배너 전체를 보내야 한다.** 개수가 어긋나면 서버가 400으로 거절한다.
- 홈 편성에는 언어별 건수 엔드포인트가 없어, 언어마다 목록을 받아 센다. 목록 조회와 같은
  캐시 키를 써서 편집 뒤 숫자도 함께 다시 센다.

### 5.2 이미지

**관리자 업로드는 자료 경로 아래에 있다.** 자료마다 권한이 달라 공용 업로드 엔드포인트가 없다.
지금 서버가 여는 것은 배너 하나다.

| Method | Path | 목적 |
|---|---|---|
| POST | `/admin/main-banners/image` | 배너 이미지 업로드 (multipart, `file` 필드) → `201 { fileId }` |
| GET | `/images/{type}/{fileId}/{variant}` | 공개 이미지 조회 (인증 없음) |

- 업로드는 URL이 아니라 `fileId`만 준다. 폼은 `fileId`만 들고 있다가 생성 · 수정 API에 넘긴다.
  화면에서는 `src/components/ui/ImageUploadField.tsx` 하나만 쓴다.
- 조회 URL은 `src/lib/imageUrl.ts`가 조립한다(`NEXT_PUBLIC_IMAGE_BASE_URI` 기준). 서버가 완성된
  URL(`imageUrl` · `thumbnailUrl`)을 주는 응답은 그 값을 우선 쓴다(`resolveImageUrl`).
- `variant`는 서버 `FileTypePolicy`가 그 타입에 만들어 두는 것만 쓸 수 있다. 없는 값을 보내면
  400이라, 타입별 허용 목록(`IMAGE_VARIANTS`)을 이 파일 한 곳에서만 고른다.

### 5.3 해시태그

해시태그는 **관리자가 등록해 둔 목록에서 사용자가 골라 쓰는** 값이다.
자유 입력이 아니므로 여기서 만들지 않은 태그는 앱에 존재하지 않는다.

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/hashtags` | 해시태그 목록/검색 |
| GET | `/admin/hashtags/{hashtagId}` | 해시태그 상세 (언어별 라벨) |
| POST | `/admin/hashtags` | 해시태그 추가 |
| PATCH | `/admin/hashtags/{hashtagId}` | 해시태그 수정 · 노출 여부 변경 (부분 갱신) |
| DELETE | `/admin/hashtags/{hashtagId}` | 해시태그 삭제 (사용 중이면 409 `HASHTAG_IN_USE`) |
| GET | `/admin/hashtags/suggestions` · `/admin/hashtags/suggestions/items` | 유저 태그 제안 묶음 · 개별 제안 |
| DELETE | `/admin/hashtags/suggestions` · `/admin/hashtags/suggestions/items/{suggestId}` | 제안 정리 |
| GET | `/hashtag/list?lang=KO` | 앱에서 사용할 활성 태그 목록 (public) |

분류 11종(서버 `HashtagCategory`와 이름 · 순서가 같다): `GENRE`(장르) · `BACKGROUND`(배경) ·
`RACE`(종족) · `CHARACTER`(캐릭터) · `APPEARANCE`(외형) · `PERSONALITY`(성격) ·
`RELATIONSHIP`(관계) · `NARRATIVE`(서사) · `OCCUPATION`(직업) · `MOOD`(분위기) · `SPECIAL`(특수설정)

- 라벨은 **언어별로 관리**한다. 앱이 `/hashtag/list?lang=KO`로 조회하기 때문이다.
  한국어는 필수이고, 번역이 없는 언어는 한국어로 대체된다. 목록에는 한국어 라벨과 번역 개수만
  오므로 번역 내용은 상세에서 본다.
- `isAdult` 태그는 성인 인증 유저에게만 노출한다. 목록에서 **성인 태그만** 골라 볼 수 있다.
- **노출 순서 개념은 없다.** 정렬은 등록일 · 사용 수 · 이름으로 한다.
- **사용 중인 태그는 삭제할 수 없다.** 이미 붙어 있는 세계관의 태그가 깨지므로
  노출 여부(`isActive`)를 끄는 방식으로 관리한다.
- 서버 목록이 페이지를 받지 않아 페이징은 `src/api/hashtag/getHashtagList.ts`에서 한다.

### 5.4 공지사항

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

### 5.5 공식 계정

**공식 여부는 콘텐츠가 아니라 계정에 붙는다.** 서버(`plat-be`)는 세계관마다
공식 값을 저장하지 않고, `official_accounts` 표에 담긴 유저 ID를 크리에이터 ID로 바꿔
**조회할 때마다 다시 판정**한다(`OfficialCreators.isOfficial`).

그래서 관리자가 등록하는 것은 캐릭터가 아니라 **유저 ID**다.
캐릭터를 하나씩 공식으로 만드는 화면(구 `공식 캐릭터` CRUD)은 서버에 대응하는
개념이 없어 폐기했다.

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/official-accounts` | 공식 계정 목록 |
| POST | `/admin/official-accounts` | 공식 계정 등록 (`{ userId }`) |
| DELETE | `/admin/official-accounts/{userId}` | 공식 지정 해제 |

- 등록·해제는 그 계정이 가진 **세계관·캐릭터 전부의 공식 표시를 한 번에** 바꾼다.
  따라서 mutation 성공 시 세계관 · 캐릭터 · 홈 편성 쿼리를 함께 무효화한다.
- **크리에이터 전환을 하지 않은 계정은 등록돼도 공식으로 노출되지 않는다.**
  서버는 이 경우 경고 로그만 남기고 건너뛰므로, 화면에서 크리에이터 칸과 상단 경고로 먼저 보여 준다.
- 탈퇴 계정은 등록 단계에서 막는다(409 `OFFICIAL_ACCOUNT_WITHDRAWN`).
- **유저 ID는 문자열로 다룬다.** Snowflake라 19자리이고, 운영자가 직접 입력하는 값이라
  정밀도 손실이 곧바로 "아무 계정도 가리키지 않는 등록"이 된다.

### 5.6 세계관 · 캐릭터 · 시나리오

**세계관(Universe)이 콘텐츠의 단위다.** 그 안에 캐릭터가 등장하고, 시나리오가 여러 편 실린다.
유저는 세계관에 들어와 시나리오를 하나 골라 대화를 시작한다(`plat-fe`의 상세 > 시나리오 선택).

| 개념 | 무엇인가 | 서버 |
|---|---|---|
| 세계관 | 대표 이미지 · 제목 · 소개 · 상세 설정 · 해시태그 · 에셋을 가진 콘텐츠 단위 | `Universe` |
| 캐릭터 | 세계관에 등장하는 인물. 세계관이 소유한다 | `UniverseCharacter` |
| 시나리오 | 그 세계관에서 시작하는 한 편의 이야기(상황 + 첫 대사) | `Scenario` + `ScenarioTranslation` |

**캐릭터는 세계관이 소유한다.** 서버는 연결용 매핑 표를 쓰지 않고, 세계관 하나가 여러
`UniverseCharacter`를 가질 수 있게 두었다. MVP 생성 API는 한 명만 만들고, 어드민 세계관
상세도 대표 캐릭터 한 명(`character`)을 받는다(plat-be `docs/decisions/002-universe-character-ownership.md`).
캐릭터 메뉴는 아직 MOCK이라 목업이 다중 등장을 가정한 모양을 쓴다 — 연동할 때 서버 계약으로 맞춘다.

**메뉴 1뎁스는 캐릭터가 아니라 세계관이다.** 캐릭터를 위에 두면 실제 구조와 반대라,
운영자가 캐릭터에서 세계관을 찾으려 하게 된다.

| 필드 | 값 | 비고 |
|---|---|---|
| `profileImageFileId` · `profileImageUrl` | | 세계관 대표 이미지 |
| `visibility` | `PUBLIC` · `PRIVATE` · `UNLISTED`(일부공개) | |
| `status` | `ACTIVE` · `INACTIVE` | 운영 조치(`PATCH /admin/universes/{id}`) |
| `reviewStatus` | `PENDING` · `APPROVED` · `REJECTED` (+ 반려 사유) | 심사(`PATCH /admin/universes/{id}/review`) |
| `category` | 장르 (`UniverseCategory`) | |
| `tendency` | `ALL` · `MALE_ORIENTED` · `FEMALE_ORIENTED` | |
| `commentEnabled` | boolean | 크리에이터가 세계관마다 정한다 |
| `creatorId` · `userId` | 문자열 | **서로 다른 ID다.** 유저로 좁힐 때는 `userId`를 쓴다 |

- **어드민이 다루는 세계관 상태는 `ACTIVE` · `INACTIVE` 둘뿐이다.** 세계관 삭제는 하드 딜리트로
  정했고(2026-09-01) 화면 타입에 `DELETED` · `PURGED`를 두지 않는다. 다만 **plat-be는 아직 옛 수명주기를
  그대로 갖고 있다** — `UniverseStatus`에 두 값이 남아 있고, `UniverseEntity`가 삭제 시 `DELETED`로
  바꾸며 `UniversePurgePersistenceAdapter`가 `PURGED`로 정리한다(plat-be
  `docs/decisions/001-universe-deletion-purge.md`). 서버가 두 값을 실제로 내려 주면 화면 라벨이 비므로,
  BE 정리가 끝나기 전까지는 서버 쪽 결정과 맞춰 봐야 한다.
- 시나리오 종류: `START`(첫 진입) · `NORMAL` · `EVENT` · `ENDING`
- 시나리오 상태: `ACTIVE` · `HIDDEN` · `DEPRECATED`(구버전 — 이미 그 시나리오로 시작한
  방이 남아 있어 지우지 못한다)
- **시작 시나리오가 없으면 유저가 그 세계관에서 대화를 시작할 수 없다.** 세계관은
  멀쩡해 보이는데 대화만 안 되는 상태라, 세계관 상세에서 경고로 짚는다.
- 운영 조치는 서버에 즉시 반영되지만 앱 홈 카드는 캐시 때문에 늦게 바뀔 수 있어, 화면에서 함께 안내한다.

### 5.7 댓글 · 신고

댓글은 **특정 도메인에 종속시키지 않는다.** `targetType` + `targetId`로 대상을 가리키는
다형(polymorphic) 구조로 관리한다. 새 영역이 생기면 `targetType`에 값만 추가한다.

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/comments` | 댓글 목록/검색 (대상 · 상태 · 신고 여부 필터) |
| GET | `/admin/comments/{commentId}` | 댓글 상세 |
| POST | `/admin/comments/{commentId}/hide` | 숨김 (사유 필수) |
| POST | `/admin/comments/{commentId}/restore` | 재노출 |
| POST | `/admin/comments/bulk-hide` | 선택한 댓글 일괄 숨김 |

- `targetType`: `UNIVERSE` | `CHARACTER` | `POST` | `CREATOR` (`POST` · `CREATOR`는 서버 enum에만
  있고 아직 댓글이 달리지 않는다). 공지사항에는 댓글이 없다.
- 상태: `VISIBLE` | `HIDDEN` | `DELETED`. **물리 삭제하지 않는다.** 이력이 남아야 하므로 상태로 관리한다.
- 운영은 내리고 다시 올릴 수 있다. 루트를 내리면 답글이 함께 내려가고(`cascaded`), 올리면 함께
  올라온다. 작성자가 지운 댓글(`DELETED`)은 운영이 되살리지 않는다.
- 일괄 숨김 응답의 건수는 보낸 건수와 다를 수 있다. 이미 내려갔거나 지워진 댓글은 서버가 건너뛴다.

신고는 **대상 단위의 케이스**로 묶어 처리한다. 계약의 원본은 plat-be `docs/19-Report-Guide.md`다.
같은 대상(`targetType` + `targetId`)의 신고가 열린 케이스 하나에 모이고, 판정 · 조치 · 처리자는 케이스에 붙는다.

| Method | Path | 권한 | 목적 |
|---|---|---|---|
| GET | `/admin/reports` | `report:read` | 케이스 목록 (상태 · 대상 · 사유 · 검색 · 피신고자 필터, 누적 신고순 / 최근 신고순) |
| GET | `/admin/reports/{caseId}` | `report:read` | 케이스 상세 (최신 스냅샷 · 대상 현재 상태 · 사유별 건수 · 처리 결과 · 지난 케이스) |
| GET | `/admin/reports/{caseId}/reports` | `report:read` | 케이스에 묶인 개별 신고 (신고 시점 스냅샷 포함) |
| GET | `/admin/reports/items?reporterUserId=` | `report:read` | 유저 상세의 "넣은 신고" |
| POST | `/admin/reports/{caseId}/resolve` | `report:write` + 조치별 권한 | 판정 · 조치 · 제재 · 메모로 케이스를 닫는다 (204) |

- `targetType`: `COMMENT` | `UNIVERSE`. 새 대상은 docs/19의 체크리스트대로 `src/type/report.ts`와
  상세의 스냅샷 렌더러 레지스트리(`community/reports/[caseId]/_components/snapshot/index.ts`)에 더한다.
- 상태: `PENDING`(처리 대기) | `ACTIONED`(조치 완료) | `DISMISSED`(위반 없음). 닫힌 케이스는 다시 열리지 않고,
  같은 대상이 다시 신고되면 새 케이스가 된다.
- 조치: 댓글 `HIDE_COMMENT`(`comment:write`), 세계관 `UNIVERSE_PRIVATE` · `UNIVERSE_INACTIVE`(`universe:write`),
  피신고자 제재 기간 정지 · 영구 정지(`user:write`). 권한이 없는 항목은 처리 모달에서 잠그고 이유를 적는다.
- 조치함은 조치 또는 제재가 1개 이상, 위반 없음은 0개여야 한다. 메모는 필수(1000자)이며 신고자에게 보이지 않는다.
- 다른 관리자가 먼저 닫으면 409 `REPORT_CASE_ALREADY_HANDLED` — 안내 후 상세를 다시 읽는다.
- 상태 탭 건수는 전용 API가 없어 상태별 목록(`size=1`)의 총 개수로 센다.

### 5.8 로그 · 배치

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/logs/admin` | 관리자 활동 로그. `keyword` · `domain` · `result` · `actorId` |
| GET | `/admin/logs/system` | 시스템 이벤트. `keyword` · `level` · `source` |
| GET | `/admin/batch/jobs` | 배치 잡 정의 + 최근 실행 결과 · 다음 예정 (페이지네이션 없음) |
| GET | `/admin/batch/runs` | 배치 실행 이력. `jobKey` · `status` · `trigger` |
| POST | `/admin/batch/jobs/{jobKey}/run` | 수동 실행. 새 실행 이력을 반환한다 |
| PATCH | `/admin/batch/jobs/{jobKey}/enabled` | 스케줄 on/off. 잡 정의는 지우지 않는다 |

- **잡 목록은 페이지네이션하지 않는다.** 잡은 코드에 있는 만큼만 존재해 수십 건을
  넘지 않고, 이 화면에서 먼저 봐야 하는 것은 "전부 정상인가"라 한눈에 들어와야 한다.
- **`lastRunStatus`는 이력에서 파생된다.** 잡 목록과 이력을 따로 들고 있으면 둘이
  어긋난다 — 이력이 원본이고 목록은 계산해서 붙인다.
- **어드민은 잡을 만들거나 지우지 않는다.** 원본은 코드의 스케줄러이고, 여기서는
  켜고 끄는 것과 다시 돌리는 것만 한다. 어드민에서 잡을 만들 수 있게 하면 코드에
  없는 배치가 생겨 어디를 봐야 하는지 알 수 없게 된다.
- **수동 실행은 두 곳에 남는다.** 실행 이력에 `trigger: MANUAL`로, 그리고 변경
  요청이므로 관리자 활동 로그에도 남는다.
- **실행 로그(`log`)는 평문 문자열이다.** 배치마다 남기는 것이 달라
  구조를 잡으면 대부분의 잡에서 빈 필드가 되고, 새 잡이 생길 때마다 타입을 고쳐야
  한다. 운영자가 여기서 하는 일은 "왜 실패했는지 눈으로 읽는 것" 하나다.
  **서버는 전문이 아니라 끝부분만 남긴다** — 실패 사유는 마지막 줄에 있고, 수만 줄을 남기는
  잡이 있어 전문을 실으면 목록 응답이 통째로 무거워진다. 전문은 관제 도구에서 본다.
  화면에서는 행을 눌러 그 자리에서 펼치고(`Table`의 `renderExpanded`), 표 머리의
  `전체 열기 / 전체 접기`로 한 번에 여닫는다.
- **관리자 활동 로그는 서버가 요청 길목에서 남긴다.** 그래서 `result`가 `DENIED` · `FAILED`까지
  구분된다. 예전 목업은 요청을 가로채는 시점에 적재해 항상 `SUCCESS`였고, 실서버로 나간 요청은
  보지도 못해 핸들러째로 걷어냈다.

### 5.9 결제 보존 원장 (MOCK)

**서버에 아직 엔드포인트가 없다.** 아래는 목업(`src/mocks/handlers/paymentRecord.ts`)이 따르는
계약 초안이고, 서버가 붙을 때 서버 계약으로 맞춘다.

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/payment-records` | 보존 원장 목록. `keyword` · `provider` · `status` · `member` · `startDate` · `endDate` · `userId` |
| GET | `/admin/payment-records/summary` | 보존 건수 · 탈퇴 회원 건 · 만료 임박 · 순 승인금액 |

- **`keyword`는 PG 거래번호 · 주문번호 · 승인번호 · 회원 해시 · 상품 코드로만 건다.**
  파기된 건에는 검색할 개인정보가 없다. 닉네임은 아직 파기 전인 건에서만 잡힌다.
- **`member`는 `WITHDRAWN` · `ACTIVE`**. 이 화면을 여는 이유가 대개 탈퇴 회원 건이라
  필터의 첫 자리에 둔다.
- **`userId`로 좁힐 때 서버는 그 값을 회원 해시로 바꿔서 찾아야 한다.** 원장의 `userId` 컬럼은
  파기와 함께 지워지므로 그 컬럼으로 걸면 **정작 봐야 할 파기된 건이 빠진다.**
  해시는 파기 후에도 남으므로, 계정이 남아 있는 동안에는 유저에서 원장으로 건너갈 수 있다.
- **기간은 승인일 기준이다.** 취소 · 환불일로 걸면 같은 결제일의 건들이 흩어진다.
- **보존 만료일은 서버가 계산해서 내려준다** (`retentionUntil` = 결제일 + 5년).
  화면에서 계산하면 시간대와 윤년 처리가 브라우저마다 갈린다. 화면은 남은 일수만
  세어 90일 이내를 '만료 임박'으로 표시한다.
- **파기는 탈퇴 즉시가 아니라 파기 배치가 도는 날 일어난다.** 그 사이 구간
  (`isWithdrawn: true`, `purgedAt` 없음)을 화면에서 '파기 대기'로 드러내
  파기 누락을 알아챌 수 있게 한다.

---

## 6. Mock 전략

**목업과 실서버가 함께 돈다.** MSW v2 브라우저 워커는 **서버에 아직 엔드포인트가 없는 도메인만**
받는다. 서버가 붙은 도메인은 목업을 걷어내고 실서버로 그대로 나간다.

- 워커는 `NEXT_PUBLIC_API_MOCKING=enabled`일 때만 뜬다(`src/providers/MSWProvider.tsx`).
  이 값은 프로파일이 정한다 — `local` · `develop`은 켜고 **운영(`main`)은 끈다.** 운영에서 가짜
  데이터가 그려지면 어느 화면이 진짜로 붙었는지 아무도 구분하지 못한다. 목업이 꺼지면 목업
  도메인은 404로 끝나는 것이 맞다.
- **핸들러는 `NEXT_PUBLIC_BASE_URI`(아무것도 뜨지 않는 오리진)에만 등록한다.** 실서버 요청을
  가로채면 안 된다. 목업 구간에서 `liveAxios`는 같은 오리진 프록시(`/live-api`, `next.config.ts`의
  rewrite)를 거쳐 실서버로 나간다 — 워커가 교차 오리진 요청을 흘려보내지 못하기 때문이다
  (`src/config/appEnv.ts`의 `LIVE_PROXY_PATH` 주석).
- 핸들러는 `src/mocks/handlers/<domain>.ts`에 두고 `src/mocks/handlers/index.ts`에서 합친다.
  시드는 `src/mocks/db/<domain>.ts`에 **메모리 상태**로 두고, POST/PUT/DELETE가 실제로 그 상태를
  바꾼다. 새로고침 전까지 CRUD가 진짜처럼 동작해야 화면을 검증할 수 있다.
- 실서버로 옮긴 도메인이어도 시드가 남아 있을 수 있다. `src/mocks/db/user.ts` · `src/mocks/db/official.ts`는
  전역 검색 · 캐릭터 · 결제 목업이 유저와 공식 뱃지를 빌려 쓰기 때문에 남겼다.
- **메뉴 밖에서 도는 목업 조회는 목업이 꺼지면 부르지 않는다.** 처리 대기 뱃지
  (`/admin/ops/pending-counts`)와 ⌘K 엔티티 검색(`/admin/search`)은 `IS_MOCKING`
  (`src/api/baseUri.ts`)으로 막는다. ⌘K의 메뉴 검색은 그대로 된다.
- **세션은 실서버가 준다.** 목업 화면이어도 401은 진짜 세션 만료다.

세부 작성 규칙(유틸 · seed 난수 · import 금지)은 `docs/DEVELOPMENT_GUIDE.md` 4장, MOCK 화면 표시는 8장이다.

---

## 7. 관리자 권한

**권한은 사람이 아니라 직책(`AdminRole`)이 갖는다.** 관리자는 직책에 들어갈 뿐이다.

사람마다 권한을 주면 관리자가 열 명일 때 설정도 열 번, 점검도 열 번이다.
규칙이 바뀌면 열 곳을 고쳐야 하고 한 곳만 빠뜨리면 그 사람만 조용히 다른 권한을 갖는다.
"크레딧을 지급할 수 있는 사람이 누구인가"를 물었을 때 직책이면 하나만 열어 보면 된다.

### 7.1 권한 키

`리소스:행위` 형태다. (`creditAdjustment:adjust`)
**화면(메뉴)이 아니라 자료와 행위 기준으로 나눈다.** 화면은 합쳐지고 쪼개지지만
자료는 그대로다.

**권한 목록의 출처는 서버 `AdminResource` · `AdminAction` enum 하나다**(plat-be
`plat-core/src/main/java/so/plat/core/type/admin/account/AdminResource.java`). 어드민은 같은 목록을
`src/type/permission.ts`에 라벨 · 설명 · 갈래와 함께 들고 있다.

- **서버에 자원이 늘면 이 파일도 함께 고친다.** 빠뜨리면 그 권한은 직책 편집 화면에 나타나지 않아
  아무도 켤 수 없다.
- **서버에 없는 키를 만들지 않는다.** 직책 저장이 400(`ADMIN_PERMISSION_INVALID`)으로 거부된다.
  목업 화면도 서버에 있는 자원 키를 빌려 쓴다 — 결제 보존 원장이 `ledger:read`를 쓰는 이유다.

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

### 7.2 갈래

설정 화면은 자료를 **행위 구성이 같은 것끼리** 묶는다. 업무 영역이 아니다.
스물아홉 개 자료를 한 표에 넣으면 `지급 · 차감` 열이 거의 전부 빈칸이 된다.
갈래로 나누면 갈래마다 열 이름이 달라지고 빈칸이 사라진다.

`만들고 고치고 지우는 자료` · `지우지 않는 자료` · `앱에 공개하는 자료` ·
`밖으로 나가는 자료` · `돈이 오가는 자료` · `보기만 하는 자료`

### 7.3 규칙

- **`write`는 `read`를 품는다.** 저장할 때 `normalizePermissions`로 한 번 정규화하고,
  판정하는 쪽은 단순 포함 검사만 한다.
- **최고관리자 직책은 잠겨 있다.** 권한을 뺄 수 있으면 실수 한 번으로
  "권한을 되돌릴 사람이 아무도 없는" 상태가 만들어진다. 판정도 목록을 보지 않고 전부 통과시킨다.
- **속한 관리자가 있는 직책은 지울 수 없다**(409 `ADMIN_ROLE_IN_USE`). 지우면 그 사람의 권한이 사라진다.
- 갈래에 넣지 않은 자료가 있으면 **컴파일 때 타입 오류가 난다.**
  빠뜨리면 그 자료는 설정 화면에 아예 나타나지 않아 한참 뒤에야 발견된다.
- **관리자 활동 로그(`log:read`)는 민감 자료다.** 변경된 값이 `payload`에 그대로
  남으므로, 이 권한은 "다른 관리자가 무엇을 어떤 값으로 바꿨는지"를 전부 열어 주는
  것과 같다. 시스템 이벤트(`systemLog:read`)와 한 권한으로 묶으면 장애를 보려는
  사람에게 감사 기록까지 함께 열린다.
- **배치는 `read`와 `write`를 나눈다.** 수동 실행은 스케줄과 같은 처리를 그대로
  다시 돌리는 것이라 되돌릴 수 없는 일(크레딧 소멸 · 파일 파기)이 섞여 있다.

### 7.4 쓰는 법

| 상황 | 사용 |
|---|---|
| 화면에서 권한 확인 | `useHasPermission("user:write")` (`src/store/useAdminStore.ts`) |
| 영역 차단 | `<PermissionGate required="role:read">` 또는 `<PermissionDenied />` (`src/components/domain/`) |
| 조회 자체를 막기 | `usePermittedQuery("role:read", { ... })` (`src/api/usePermittedQuery.ts`) |
| 훅을 못 쓰는 자리 | `hasPermission(granted, required, isSuperAdmin)` (`src/type/permission.ts`) |

메뉴는 `src/constants/menu.tsx`의 `permission`으로 걸고, 사이드바와 전역 검색(⌘K)이
**권한 없는 메뉴를 아예 그리지 않는다.** 회색으로 두면 운영자는 자기가 못 하는 일의
목록을 매일 보게 된다. 주소로 직접 들어오면 `RoutePermissionGate`가 같은 정의
(`findRoutePermission`)로 막는다.

**메뉴 항목은 권한 키를 하나만 건다.** 화면 안에서 권한이 갈리는 경우
(`/ops/logs`는 관리자 활동 `log:read` · 시스템 이벤트 `systemLog:read`)
메뉴에는 **넓은 쪽**을 걸고 좁은 쪽은 화면 안에서 막는다. 좁은 쪽을 걸면 장애를
보려는 사람이 메뉴 자체를 못 본다. 이 한계를 없애려면 `permission`을 배열로 넓히고
`Sidebar` · `CommandPalette` · `RoutePermissionGate` 세 곳을 함께 고쳐야 한다.

화면을 감추는 것은 **실수를 줄이는 장치일 뿐** 막는 수단이 아니다.
실제로 막는 것은 서버다. 서버만 있으면 운영자가 끝까지 입력한 뒤에야 거부당하고,
화면만 있으면 주소를 직접 치는 순간 통과한다.

### 7.5 API

| Method | Path | 목적 |
|---|---|---|
| GET | `/admin/roles` | 직책 목록 |
| POST | `/admin/roles` | 직책 추가 |
| PATCH | `/admin/roles/{roleId}` | 직책 이름 · 설명 · 권한 저장 |
| DELETE | `/admin/roles/{roleId}` | 직책 삭제 (속한 관리자가 있으면 409) |

---

## 8. 인증 · 계정 수명주기

로그인 · 세션 · 관리자 계정은 **실서버가 담당한다**(`liveAxios`). 콘솔은 로그인해야 들어올 수
있고, 최초 최고관리자를 만드는 방법은 `README.md`의 "로그인"에 있다.

| Method | Path | 목적 |
|---|---|---|
| POST | `/admin/auth/login` | `{ username(이메일), password }` → `{ accessToken, refreshToken, admin, mustChangePassword }` |
| POST | `/admin/auth/refresh` | `{ refreshToken }` → 새 토큰 한 쌍 (회전) |
| POST | `/admin/auth/logout` | 세션 종료 |
| GET | `/admin/auth/me` | 세션 복구 · 내 정보 |
| PATCH | `/admin/auth/me` | 내 이름 변경 |
| POST | `/admin/auth/password` | 비밀번호 변경 → 새 토큰 한 쌍 |
| GET | `/admin/managers` | 관리자 목록 (서버가 전체를 준다. 검색 · 필터 · 페이지는 화면에서) |
| POST | `/admin/managers` | 초대 → 임시 비밀번호 1회 발급 |
| PATCH | `/admin/managers/{managerId}` | 이름 · 직책 · 상태 저장 (세 값을 통째로 보낸다) |
| POST | `/admin/managers/{managerId}/unlock` | 잠금 해제 |
| POST | `/admin/managers/{managerId}/reset-password` | 임시 비밀번호 재발급 |
| DELETE | `/admin/managers/{managerId}` | 관리자 삭제 |

### 8.1 세션

- `useAdminStore`가 토큰 한 쌍 · 관리자 · 강제 변경 여부를 `localStorage`에 둔다.
  복구 완료 플래그(`isHydrated`)를 함께 두어 **새로고침마다 로그인 화면이 번쩍이지 않게** 한다.
- axios 요청 인터셉터가 토큰을 싣는다. accessToken이 이미 만료됐으면 보내기 전에 재발급하고,
  refreshToken까지 만료됐으면 요청을 만들지 않고 로그인 화면으로 보낸다.
- 401이 오면 **재발급을 한 번만** 시도하고 원 요청을 다시 보낸다. 동시에 여러 요청이 401을 받아도
  재발급은 하나만 돈다 — 서버가 토큰을 회전하므로 각자 부르면 첫 번째만 살아남는다.
  재발급도 실패하면 세션을 지우고 `/login?redirect=…&reason=expired`로 보낸다.
  **로그인 요청 자체의 401은 화면이 처리한다.**
- `AuthGuard`(세션) · `RoutePermissionGate`(권한)를 `src/app/(admin)/layout.tsx` **한 곳**에서만 건다.
  화면마다 검사를 넣으면 한 화면만 빠뜨려도 그 주소는 계속 열린다.
  권한이 없으면 사이드바 · 헤더는 남기고 **본문만** 안내로 바꾼다 — 통째로 가리면
  다른 화면으로 이동할 방법이 사라진다.

### 8.2 계정 상태

`INVITED`(초대됨) · `ACTIVE`(활성) · `INACTIVE`(비활성) · `LOCKED`(잠김). (`src/type/ops.ts`)
활성/비활성 두 값으로는 **"초대해 두고 아직 안 들어온 계정"과 "실패가 쌓여 잠긴 계정"**을
구분할 수 없다. 둘은 운영자가 해야 할 일이 다르다.

- **초대 = 계정 생성 + 임시 비밀번호 1회 발급.** 응답에서 한 번만 내려오고 다시 볼 수 없다.
  저장해 두고 재조회를 열면 평문 비밀번호를 언제든 꺼낼 수 있다는 뜻이라, 초기화 기능이
  있는 의미가 없어진다. 이메일은 로그인 계정이라 초대할 때만 정할 수 있다.
- 임시 비밀번호 상태(`passwordUpdatedAt`이 비어 있음)면 서버가 `/admin/auth/**` 밖을 전부 막고,
  콘솔은 `mustChangePassword`로 **닫을 수 없는 변경 모달**을 띄운다. 바꾸면 서버가 그 계정의 세션을
  모두 끊고 새 토큰을 주므로 화면은 그 토큰으로 갈아 끼운다.
- 로그인 5회 실패 시 자동 잠금. 잠금 해제는 다른 관리자가 전용 동작(`unlock`)으로 한다 —
  상태만 `ACTIVE`로 바꾸면 실패 누적이 남아 다음 오타 한 번에 다시 잠긴다.
- **삭제는 계정을 실제로 지운다.** 같은 이메일로 다시 초대할 수 있지만 새 id를 받으므로, 운영 로그가
  id로만 적은 이전 활동과는 이어지지 않는다.
- **안전장치는 서버가 막는다.** 화면에서 버튼을 감추는 것만으로는 주소를 직접 부르면 통과한다.
  1. 자기 계정: 직책 변경 · 삭제 불가 (409 `ADMIN_ACCOUNT_SELF_ROLE_DENIED` · `ADMIN_ACCOUNT_SELF_DELETE_DENIED`)
  2. 마지막 활성 최고관리자: 비활성 · 직책 변경 · 삭제 불가 (409 `ADMIN_ACCOUNT_LAST_SUPER`)
  3. 최고관리자를 만들거나 건드리는 일은 최고관리자만 (403 `ADMIN_ACCOUNT_SUPER_GRANT_DENIED`)
  4. `LOCKED`는 직접 지정할 수 없다(로그인 실패로만 걸린다)

  화면은 자기 계정 행의 상태 · 삭제 동작을 미리 비활성으로 둔다.

---

## 9. 디렉토리 구조

`plat-fe`의 레이어 구조를 따른다. 파일 · 이름 규칙의 원본은 `docs/DEVELOPMENT_GUIDE.md` 1장이다.

```
src/
├─ api/                   # 도메인별 API 함수 + react-query 훅 (한 파일에 함께 둔다)
│  ├─ index.ts            # liveAxios · adminAxios + 인터셉터(토큰 · 재발급 · 오류 정규화)
│  ├─ baseUri.ts          # IS_MOCKING · 실서버/목업 베이스 URI
│  ├─ usePermittedQuery.ts
│  └─ ai/ auth/ billing/ character/ comment/ communication/ dashboard/ file/
│     hashtag/ legal/ main-exposure/ notice/ official/ ops/ report/ search/
│     universe/ user/ word/
├─ app/
│  ├─ (admin)/            # 사이드바 레이아웃 그룹
│  │  ├─ layout.tsx       # AuthGuard + RoutePermissionGate (한 곳에서만)
│  │  ├─ page.tsx         # 대시보드 (_components/ · _lib/ 는 대시보드 전용)
│  │  └─ <도메인>/<화면>/page.tsx
│  ├─ login/
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ not-found.tsx
├─ components/            # 여러 화면이 함께 쓰는 컴포넌트
│  ├─ ui/                 # Button, Input, Table, Modal, ImageUploadField ...
│  ├─ layout/             # Sidebar, Header, PageHeader, CommandPalette, PendingBell
│  ├─ domain/             # AuthGuard, PermissionGate, RoutePermissionGate, LanguageScopeTabs ...
│  ├─ universe/           # HomeSectionBoard, UniversePickerModal, ScenarioPickerModal ...
│  ├─ billing/            # PaymentRecordDetailModal
│  ├─ comment/            # CommentHiddenReason
│  └─ chart/              # Sparkline
├─ config/                # appEnv.ts — 프로파일과 환경값의 출처
├─ constants/             # menu.tsx, mainExposure.ts, 여러 화면이 쓰는 xxxOptions.ts
├─ hooks/                 # 도메인 무관 훅 (useListParams, useDebounce ...)
├─ icons/                 # 커스텀 SVG 아이콘 컴포넌트
├─ lib/                   # utils(cn), dayjs, imageUrl, jwt, csv, listFilter, toast
├─ mocks/                 # MSW — browser.ts, handlers/<domain>.ts, db/<domain>.ts
├─ providers/             # ReactQuery, MSW, Theme, Sonner
├─ schema/                # zod 스키마 (xxx.schema.ts)
├─ store/                 # zustand (useAdminStore, useConfirmStore, useSidebarStore)
└─ type/                  # 도메인 타입 · api/index.ts(PageWith · toPageRequest · toPageResponse)
```

**화면 전용과 공용을 폴더로 가른다.**

| 대상 | 위치 |
|---|---|
| 화면 전용 컴포넌트 | 해당 라우트의 `_components/` |
| 화면 전용 라벨 · 옵션 | 해당 라우트의 `_constants/xxxOptions.ts` |
| 화면 전용 순수 함수 · 훅 | 해당 라우트의 `_lib/` · `_hooks/` |
| 여러 화면이 쓰는 컴포넌트 | `src/components/<domain>/` |
| 여러 화면이 쓰는 라벨 · 옵션 | `src/constants/*Options.ts` |

다른 라우트의 `_components` · `_constants` · `_lib`를 가져다 쓰지 않는다. 두 화면이 함께 쓰게 되면
위 공용 위치로 올린다 — 라우트 폴더를 옮기거나 지울 때 다른 화면이 조용히 깨지지 않게 하기 위해서다.

`plat-fe`의 규칙을 그대로 따른 두 가지를 특히 유의한다.

1. **API 함수와 react-query 훅은 같은 파일에 둔다.** 조회는 `src/api/<domain>/getXxx.ts`
   (`getBannerList` + `useBannerListQuery`), 변경은 `mutateXxx.ts`에 모은다.
2. **쿼리키는 별도 상수 파일을 만들지 않고 `["동사-리소스", ...파라미터]` 인라인 배열**을 쓴다.
   `constants/`에는 쿼리키가, `hooks/`에는 react-query 래퍼가 없다.

---

## 10. 새 도메인을 실서버에 붙일 때

목업으로 돌던 도메인에 서버 엔드포인트가 열리면 아래를 **한 번에** 한다. 하나라도 남기면
어느 화면이 진짜로 붙었는지 구분할 수 없게 된다.

1. `src/mocks/handlers/<domain>.ts`의 핸들러와 `handlers/index.ts` 등록을 지운다. 시드
   (`src/mocks/db/<domain>.ts`)는 다른 목업이 빌려 쓰지 않을 때만 지운다.
2. API 파일의 인스턴스를 `adminAxios`에서 `liveAxios`로 바꾼다.
3. 화면 타입을 서버 DTO에 맞춘다 — Snowflake ID는 `string`, `@Nullable`은 `T | null`,
   목록은 `PageWith` + `toPageRequest` · `toPageResponse`. 서버와 이름이 다르면 API 파일 안에서만 변환한다.
4. 권한 키가 서버 `AdminResource`에 있는지 확인한다(→ 7.1).
5. `src/constants/menu.tsx`의 `isMock`과 화면 상단 MOCK `Alert`를 함께 지운다.
6. `README.md`의 "실서버 연동 현황"과 이 문서(3장 배지 표 · 5.0 매핑 표)를 고친다.

각 단계의 규칙은 `docs/DEVELOPMENT_GUIDE.md` 3장(API) · 4장(목업) · 8장(MOCK 화면)에 있다.
