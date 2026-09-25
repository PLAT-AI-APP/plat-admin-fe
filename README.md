# plat-admin-fe

PLAT 서비스 운영 관리자 프론트엔드.

`plat-fe`와 **동일한 스택과 코드 스타일**을 의도적으로 유지한다.
두 프로젝트를 오가며 개발하기 때문에, 새 코드를 쓰기 전에 아래 문서를 먼저 읽는다.

| 문서 | 내용 |
|---|---|
| [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) | **필독.** 파일 규칙, 컴포넌트 작성법, API + react-query 패턴, MSW 목업 규칙 |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | 색상 토큰, 타이포, 간격, hover/애니메이션, 컴포넌트 규격 |
| [docs/ADMIN_PLAN.md](docs/ADMIN_PLAN.md) | 메뉴 분류 기준, 라우트 구조, 메인 노출 관리 설계 |
| [docs/CODE_STYLE_REFERENCE.md](docs/CODE_STYLE_REFERENCE.md) | `plat-fe` 코드 스타일 분석 결과 |
| [docs/ATTACHMENT_PLAN.md](docs/ATTACHMENT_PLAN.md) | 첨부 파일 제안서 (**미착수**) |
| [docs/PLAN.md](docs/PLAN.md) | 최초 기능 계획서 (**보관 문서** — 현재 계약은 이 README와 ADMIN_PLAN) |

서버 계약의 출처는 `plat-be` 문서다. 응답 모양은 `docs/10-Response-Guide.md`
(봉투 없음 · `PageWith` · 201/204), 오류 코드는 `docs/11-Error-Code-Reference.md`,
이미지는 `docs/decisions/003-file-image-lifecycle.md`, 홈 편성 범위는
`docs/decisions/004-mvp-home-section-scope.md`를 본다.

## 실행

```bash
npm install
```

```bash
npm run dev
```

`.env.local`은 **없어도 된다.** 어느 서버를 볼지는 `.env`가 아니라
**환경(프로파일)**이 정한다. 예외를 두고 싶을 때만 `cp .env.example .env.local`.

## 환경 구성

`spring.profiles.active`와 같은 자리다. 프로파일 하나가 실서버 주소 · 이미지
주소 · 목업 여부를 함께 정한다. 값의 출처는 `src/config/appEnv.ts` 하나다.

| 프로파일 | 실서버(관리자 API) | 이미지 | MSW 목업 |
|---|---|---|---|
| `local` | `http://localhost:8081` (로컬 `plat-be` admin 앱) | `http://localhost:8080` | 켬 |
| `develop` | `https://admin-api-dev.plat.so` | `https://api-dev.plat.so` | 켬 |
| `main` | `https://admin-api.plat.so` | `https://api.plat.so` | **끔** |

`plat-be` 는 앱이 나뉘어 있어 관리자 API는 admin 앱, 이미지(`/images/**`)는 api 앱이 받는다.

**브랜치 이름이 곧 프로파일 이름이다.** `main` · `develop` · `local` 브랜치를
체크아웃하고 `npm run dev`만 치면 그 환경으로 뜬다. `feat/**` 같은 작업
브랜치는 개발 서버를 본다. 지금 무엇으로 떴는지는 시작 로그에 찍힌다.

```
▲ 환경 develop(개발) · 브랜치 develop
  실서버 https://admin-api-dev.plat.so · 이미지 https://api-dev.plat.so · 목업 켬
```

브랜치와 다른 환경을 보려면 스크립트로 고른다.

```bash
npm run dev:local
```

| 스크립트 | 하는 일 |
|---|---|
| `npm run dev` | 지금 브랜치에 맞는 환경 |
| `npm run dev:local` · `dev:develop` · `dev:main` | 환경을 지정해서 띄운다 |
| `npm run build:local` · `build:develop` · `build:main` | 환경을 지정해서 빌드한다 |

프로파일은 이 순서로 정해진다. 앞의 것이 이긴다.

1. `APP_ENV` 환경 변수 — 배포 · 도커는 이것만 넘긴다 (`APP_ENV=main npm run build`)
2. CI가 알려 주는 브랜치 (`GITHUB_REF_NAME` · `VERCEL_GIT_COMMIT_REF`) — CI 체크아웃은
   detached라 git으로 브랜치를 읽지 못한다
3. 체크아웃된 git 브랜치
4. 기본값 `develop` — 실수로 운영을 보는 일이 없도록

> 스크립트가 `APP_ENV=...` 앞머리를 쓰므로 Windows(cmd)에서는 그대로 돌지 않는다.
> `set APP_ENV=local && npx next dev`로 띄우거나 `.env.local`에 `APP_ENV=local`을 적는다.

### 항목별 덮어쓰기

프로파일 기본값은 `.env.local`의 `NEXT_PUBLIC_*`로 **항목만** 덮을 수 있다
(개발 서버를 보면서 이미지만 로컬에서 받는 식의 예외를 위한 문이다).

| 이름 | 설명 |
|---|---|
| `APP_ENV` | 프로파일 고정 (`local` · `develop` · `main`) |
| `NEXT_PUBLIC_LIVE_BASE_URI` | 실서버(`plat-be`) 베이스 URI |
| `NEXT_PUBLIC_IMAGE_BASE_URI` | 이미지 서빙 베이스 URI (`GET /images/{type}/{fileId}/{variant}`) |
| `NEXT_PUBLIC_BASE_URI` | 목업 구간의 관리자 API 베이스 URI. **아무것도 뜨지 않는 포트**를 둔다 |
| `NEXT_PUBLIC_API_MOCKING` | `enabled`일 때만 MSW 목업 워커가 뜬다 |

이 값들은 `next.config.ts`가 프로파일에서 계산해 번들에 심는다. 화면 코드는
지금까지처럼 `process.env.NEXT_PUBLIC_*`만 읽는다.

**운영(`main`)은 목업을 끈다.** 아직 실서버가 열어 주지 않은 도메인은 목업이
아니라 404로 끝나는 것이 맞다 — 운영에서 가짜 데이터가 그려지면 어느 화면이
진짜로 붙었는지 아무도 구분하지 못한다. 목업을 끄면 죽은 오리진(`:9090`)을
둘 이유도 없어서 `adminAxios`도 실서버를 본다.

관리자 API는 **`plat-be`의 admin 앱이 따로 서빙한다**(`admin-api-dev.plat.so` · 로컬 `:8081`).
어느 앱인지는 도메인이 가르므로 경로에 `/admin` prefix가 없다(`/auth/login`, `/users` …).
admin 앱의 `adminFilterChain`이 들어오는 모든 요청을 관리자 토큰으로만 통과시킨다.

**목업과 실서버가 함께 돈다.** 연동이 끝난 도메인은 `src/api/index.ts`의
`liveAxios`로 실서버에 붙고, 서버에 아직 엔드포인트가 없는 도메인만 `adminAxios` +
MSW 목업을 쓴다. 목업 핸들러는 전부 `NEXT_PUBLIC_BASE_URI`(아무것도 뜨지 않는
오리진)에 등록하므로 실서버 요청을 가로채지 않는다. 목업 구간에서 `liveAxios`는
같은 오리진 프록시(`/live-api`)를 거쳐 실서버로 나간다.

### 실서버 연동 현황

**실서버(`liveAxios`)** — 로그인 · 내 계정(`/auth/**`), 관리자 계정
(`/managers`), 직책(`/roles`), 유저(`/users`), 세계관
(`/universes`), 공식 계정(`/official-accounts`), 해시태그 · 제안
(`/hashtags/**`), 금지어(`/banned-words`), 댓글(`/comments`),
메인 배너(`/main-banners`), 홈 편성(`/home-sections`), 공지사항
(`/notices`), AI 모델 · 카탈로그(`/ai/models/**`), 시스템 프롬프트
(`/ai/prompts`), 상품(`/billing/products`), 크레딧 수동 조정
(`/credits/adjustments` · `/credits/users`), 장부(`/ledgers/**`), 운영 · 시스템 로그(`/logs/**`), 배치(`/batch/**`),
서버 상태(`/server/**`), 신고(`/reports/**`), 제작자 수익 · 교환 요청 · 수익 정책
(`/earnings/**`), 교환 상품(`/reward-products/**`).

**목업(`adminAxios` + MSW)** — 메뉴에 MOCK 배지가 붙고 화면 위에 안내가 뜬다
(`src/constants/menu.tsx`의 `isMock`). 대시보드, 캐릭터, 채팅 내보내기, 크레딧
정책, 결제 보존 원장, Q&A, 알림 템플릿, 선제 메시지, 푸시, 약관, 앱 버전.
메뉴가 아닌 **처리 대기 뱃지(`/ops/pending-counts`)와 ⌘K 엔티티 검색
(`/search`)도 목업**이라, 목업이 꺼진 운영(`main`)에서는 부르지 않는다.
단, 처리 대기 뱃지 중 교환 요청 건수(`/earnings/redemptions/pending-count`)는 실서버에서 받는다.

**세션은 실서버가 준다.** 목업 화면이어도 401은 진짜 세션 만료다(`liveAxios`가
로그인 화면으로 보낸다).

### 권한 키

권한 모델의 출처는 서버의 `AdminResource` · `AdminAction` enum 하나다
(`GET /permissions`가 그대로 내려 준다). 어드민은 같은 목록을
`src/type/permission.ts`에 **라벨 · 설명 · 갈래와 함께** 들고 있다 — 서버에는
없는 정보라 화면이 직접 가진다. **서버에 자원이 늘면 이 파일도 함께 고친다.**
빠뜨리면 그 권한은 직책 편집 화면에 나타나지 않아 아무도 켤 수 없다.

반대로 **서버에 없는 키를 만들지 않는다.** 직책 저장이 `ADMIN_PERMISSION_INVALID`(400)로
거부된다. 목업 화면도 서버에 있는 자원 키를 빌려 쓴다 — 결제 보존 원장은 서버에 전용
자원이 없어 장부 권한(`ledger:read`)을 쓴다.

### 서버가 열어 주지 않는 것

- **관리자 목록의 검색 · 필터 · 페이지.** 서버가 전체를 한 번에 준다.
  `src/api/ops/getManagerList.ts`에서 걸러 쓴다.
- **이메일 변경.** 로그인 계정이라 초대할 때만 정할 수 있다.

## 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
TanStack Query v5 · zustand · axios · react-hook-form + zod ·
sonner · recharts · MSW v2

## 운영 편의 기능

| 기능 | 위치 |
|---|---|
| 로그인 · 세션 | `/login` · 새로고침 유지 · 401 시 자동 로그아웃 · 권한 없는 주소는 본문만 차단 |
| 내 계정 | 헤더 프로필 → 비밀번호 변경 · 내 직책이 가진 권한 확인 |
| 처리 대기 알림 | 사이드바 메뉴 뱃지 + 헤더 종 (Q&A · 신고된 댓글, 60초 갱신 · **목업 전용**) |
| 전역 검색 (`⌘K` / `Ctrl+K`) | 메뉴 검색 + 유저·캐릭터·세계관·해시태그 통합 검색(**목업 전용**) 후 이동 |
| 목록 조건 URL 동기화 | 검색·필터·페이지가 주소에 남아 새로고침·공유·뒤로가기에도 유지 |
| CSV 내보내기 | 유저 관리 · 결제 장부 · 크레딧 수동 조정 · 운영 로그 · 해시태그 |
| 감사 로그 | 모든 변경 요청이 **대상 · 요청 본문(비밀 필드 마스킹)**과 함께 적재 · 관리자별 활동 조회 |
| 기간 프리셋 | 오늘 / 7일 / 30일 / 90일 · 결제 장부 |
| 다크 모드 | 헤더 토글 |
| 다국어 운영 | 해시태그 라벨 번역 · 언어별 배너 · 홈 편성 (한국어 · 영어 · 일본어 · 중국어 · 태국어 · 베트남어) |

## 로그인

실서버 계정으로 들어간다. 최초 최고관리자는
`plat-be/plat-db/src/main/resources/db/manual/admin_bootstrap.sql`로 직접 만든다(비밀번호 해시는
`BCryptPasswordEncoder(12)`로 생성해 넣는다).

`password_updated_at`이 `NULL`인 계정은 **임시 비밀번호 상태**다. 서버가
`PASSWORD_CHANGE_REQUIRED` 권한 하나만 주므로 `/auth/**` 밖이 전부
막히고, 콘솔은 비밀번호 변경 모달을 강제로 띄운다. 바꾸면 같은 토큰이 곧바로
직책의 전체 권한을 받는다(권한은 토큰이 아니라 요청마다 직책에서 읽는다).

로그인 실패가 5회 쌓이면 계정이 잠긴다. 잠금 해제는 다른 관리자가
**운영 &gt; 관리자 계정**에서 한다.

## 확인

```bash
npx tsc --noEmit && npx eslint src
```

## 아직 없는 것

- **해시태그 목록의 페이징은 화면에서 처리한다.** 서버 목록 API가 검색어 · 조건 필터 ·
  정렬은 받지만 페이지를 받지 않아, 받아 온 목록을 `src/api/hashtag/getHashtagList.ts`에서
  나눈다. 서버가 지원하게 되면 이 파일만 고치면 된다.
- **해시태그 목록의 언어별 라벨.** 목록 응답에는 한국어 라벨과 번역 개수만
  온다. 번역 내용이 필요한 상세 · 수정 모달은 상세 API를 따로 부른다.

## 이미지

**업로드는 자료 경로 아래에 있다.** 관리자 업로드는 자료마다 권한이 달라 공용 업로드
엔드포인트가 없다. 지금 서버가 여는 것은 배너 하나다 —
`POST /main-banners/image` (multipart, `file` 필드) → `201 { fileId }`.
화면에서는 `ImageUploadField` 하나만 쓰면 되고(`src/components/ui/ImageUploadField.tsx`),
폼은 `fileId`만 들고 있다가 생성 · 수정 API에 `imageFileId`로 넘긴다.

**조회 URL은 화면이 조립한다.** 공개 경로 `GET /images/{type}/{fileId}/{variant}`를
`src/lib/imageUrl.ts`가 만든다(`NEXT_PUBLIC_IMAGE_BASE_URI` 기준). 서버가 완성된
URL(`imageUrl` · `thumbnailUrl`)을 함께 주는 응답은 그 값을 그대로 쓴다.
변형본(`variant`)은 서버 `FileTypePolicy`가 그 타입에 만들어 두는 것만 쓸 수 있다.
