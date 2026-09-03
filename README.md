# plat-admin-fe

PLAT 서비스 운영 관리자 프론트엔드.

`plat-fe`와 **동일한 스택과 코드 스타일**을 의도적으로 유지한다.
두 프로젝트를 오가며 개발하기 때문에, 새 코드를 쓰기 전에 아래 문서를 먼저 읽는다.

| 문서 | 내용 |
|---|---|
| [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) | **필독.** 파일 규칙, 컴포넌트 작성법, API + react-query 패턴, MSW 목업 규칙 |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | 색상 토큰, 타이포, 간격, hover/애니메이션, 컴포넌트 규격 |
| [docs/ADMIN_PLAN.md](docs/ADMIN_PLAN.md) | 메뉴 분류 기준, 라우트 구조, 메인 노출 관리 설계 |
| [docs/PLAN.md](docs/PLAN.md) | 원본 기능 계획서 (백엔드 API 초안 포함) |
| [docs/CODE_STYLE_REFERENCE.md](docs/CODE_STYLE_REFERENCE.md) | `plat-fe` 코드 스타일 분석 결과 |

## 실행

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

## 환경 변수

| 이름 | 설명 |
|---|---|
| `NEXT_PUBLIC_BASE_URI` | 목업 구간의 관리자 API 베이스 URI. **아무것도 뜨지 않는 포트**를 둔다 |
| `NEXT_PUBLIC_API_MOCKING` | `enabled`일 때만 MSW 목업 워커가 뜬다 |
| `NEXT_PUBLIC_LIVE_BASE_URI` | 실서버(`plat-be`, 기본 `8080`) 베이스 URI |
| `NEXT_PUBLIC_IMAGE_BASE_URI` | 이미지 서빙 베이스 URI (`GET /images/{fileId}`) |

관리자 API(`/admin/**`)는 별도 서버가 아니라 **`plat-boot`이 서비스 API와 같은
포트에서 함께 서빙한다.** `SecurityConfig`의 `adminFilterChain`이
`/admin/**`을 먼저 잡아 관리자 토큰으로만 통과시킨다.

**목업과 실서버가 함께 돈다.** 연동이 끝난 도메인은 `src/api/index.ts`의
`liveAxios`로 `NEXT_PUBLIC_LIVE_BASE_URI`에 붙고, 나머지는 그대로
`adminAxios` + MSW 목업을 쓴다. 두 베이스 URI의 **오리진이 달라야** MSW가
실서버 요청을 가로채지 않는다.

### 실서버 연동 현황

| 도메인 | 호출 | 지금 응답하는 곳 |
|---|---|---|
| 로그인 · 내 계정 (`/admin/auth/**`) | `liveAxios` | **실서버** |
| 관리자 계정 (`/admin/managers`) | `liveAxios` | **실서버** |
| 직책 · 권한 (`/admin/roles`) | `liveAxios` | **실서버** |
| 해시태그 (`/admin/hashtags`) | `liveAxios` | 목업 `src/mocks/handlers/hashtag.ts` (실서버 DTO 모양) |
| 세계관 운영 (`/admin/universes`) | `liveAxios` | 목업 `src/mocks/handlers/universeAdmin.ts` (실서버 DTO 모양) |
| 서버 상태 (`/admin/server/**`) | `liveAxios` | **실서버** |
| 그 외 전체 | `adminAxios` | MSW 목업 |

**세션은 실서버가 준다.** 로그인 · 관리자 계정 · 직책이 실서버로 나가므로
목업 구간이어도 401은 진짜 세션 만료다(`liveAxios`가 로그인 화면으로 보낸다).

해시태그 · 세계관은 실서버에 엔드포인트가 있지만 **아직 목업이 가로챈다.**
`liveAxios`(실서버 베이스)로 나가는 요청을 같은 베이스에 등록한 목업이 받는
구조라, 붙일 때는 `src/mocks/handlers/index.ts`에서 두 핸들러의 등록만 지우면 된다.

### 권한 키

권한 모델의 출처는 서버의 `AdminResource` · `AdminAction` enum 하나다
(`GET /admin/permissions`가 그대로 내려 준다). 어드민은 같은 목록을
`src/type/permission.ts`에 **라벨 · 설명 · 갈래와 함께** 들고 있다 — 서버에는
없는 정보라 화면이 직접 가진다. **서버에 자원이 늘면 이 파일도 함께 고친다.**
빠뜨리면 그 권한은 직책 편집 화면에 나타나지 않아 아무도 켤 수 없다.

### 서버가 열어 주지 않는 것

- **관리자 삭제.** 계정은 지우지 않고 상태로만 내린다(`INACTIVE`). 운영 로그에
  남은 실행자를 나중에도 이름으로 되짚을 수 있어야 하기 때문이다. `manager:delete`
  권한 키는 있지만 이를 쓰는 엔드포인트가 없어 화면에도 삭제가 없다.
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
| 처리 대기 알림 | 사이드바 메뉴 뱃지 + 헤더 종 (신고 · Q&A · 신고된 댓글, 60초 갱신) |
| 전역 검색 (`⌘K` / `Ctrl+K`) | 메뉴 + 유저·캐릭터·세계관·해시태그 통합 검색 후 이동 |
| 목록 조건 URL 동기화 | 검색·필터·페이지가 주소에 남아 새로고침·공유·뒤로가기에도 유지 |
| CSV 내보내기 | 유저 관리 · 결제 장부 · 크레딧 수동 조정 · 운영 로그 · 해시태그 |
| 감사 로그 | 모든 변경 요청이 **대상 · 요청 본문(비밀 필드 마스킹)**과 함께 적재 · 관리자별 활동 조회 |
| 기간 프리셋 | 오늘 / 7일 / 30일 / 90일 · 결제 장부 |
| 다크 모드 | 헤더 토글 |
| 다국어 문구 | 해시태그 라벨 · 배너 제목/설명 (한국어 · 영어 · 일본어 · 중국어 · 태국어 · 베트남어) |

## 로그인

실서버 계정으로 들어간다. 최초 최고관리자는
`plat-be/db/manual/Admin_Bootstrap.sql`로 직접 만든다(비밀번호 해시는
`BCryptPasswordEncoder(12)`로 생성해 넣는다).

`password_updated_at`이 `NULL`인 계정은 **임시 비밀번호 상태**다. 서버가
`PASSWORD_CHANGE_REQUIRED` 권한 하나만 주므로 `/admin/auth/**` 밖이 전부
막히고, 콘솔은 비밀번호 변경 모달을 강제로 띄운다. 바꾸면 같은 토큰이 곧바로
직책의 전체 권한을 받는다(권한은 토큰이 아니라 요청마다 직책에서 읽는다).

로그인 실패가 5회 쌓이면 계정이 잠긴다. 잠금 해제는 다른 관리자가
**운영 &gt; 관리자 계정**에서 한다.

## 확인

```bash
npx tsc --noEmit && npx eslint src
```

## 아직 없는 것

- **해시태그 검색 · 페이징은 화면에서 처리한다.** 서버 목록 API가 조건 필터와
  정렬만 지원하고 검색어 · 페이지를 받지 않아, 받아 온 목록을
  `src/api/hashtag/getHashtagList.ts`에서 거르고 나눈다. 서버가 지원하게 되면
  이 파일만 고치면 된다.
- **해시태그 목록의 언어별 라벨.** 목록 응답에는 한국어 라벨과 번역 개수만
  온다. 번역 내용이 필요한 상세 · 수정 모달은 상세 API를 따로 부른다. 배너의
  태그 라벨도 그래서 한국어로만 보인다.

## 이미지 업로드

`plat-fe`와 동일하게 `POST /admin/files/upload/{fileType}` (multipart, `file` 필드)로
먼저 업로드해 URL을 발급받고, 그 URL을 생성·수정 API에 넘긴다.
화면에서는 `ImageUploadField` 하나만 쓰면 된다(`src/components/ui/ImageUploadField.tsx`).

목업 구간에서는 스토리지가 없으므로 MSW 핸들러가 파일을 **data URL로 변환해서 돌려준다.**
서버가 붙으면 핸들러만 꺼지고 화면 코드는 그대로 동작한다.
# plat-admin-fe
