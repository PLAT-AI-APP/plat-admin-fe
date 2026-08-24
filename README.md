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
| `NEXT_PUBLIC_BASE_URI` | 목업 구간의 관리자 API 베이스 URI |
| `NEXT_PUBLIC_API_MOCKING` | `enabled`일 때만 MSW 목업 워커가 뜬다 |
| `NEXT_PUBLIC_LIVE_BASE_URI` | 실서버(`plat-be` `plat-admin`, 기본 `8081`) 베이스 URI |
| `NEXT_PUBLIC_LIVE_ACCESS_TOKEN` | 개발용 실서버 ADMIN 토큰 (아래 참고) |

**목업과 실서버가 함께 돈다.** 연동이 끝난 도메인은 `src/api/index.ts`의
`liveAxios`로 `NEXT_PUBLIC_LIVE_BASE_URI`에 붙고, 나머지는 그대로
`adminAxios` + MSW 목업을 쓴다. 두 베이스 URI의 **오리진이 달라야** MSW가
실서버 요청을 가로채지 않는다.

### 실서버 연동 현황

**지금은 전부 목업으로 돈다.** 실서버 없이 화면을 돌릴 수 있게, 서버에 연동해 둔
해시태그 · 세계관도 **목업 응답으로 받는다.** 다만 목업을 목업 베이스가 아니라
**실서버 베이스(`NEXT_PUBLIC_LIVE_BASE_URI`)에 등록**해 두어, API 코드(`liveAxios`)와
응답 DTO 모양은 실서버 계약 그대로다. 실서버를 붙일 때는 아래 두 핸들러의 등록만
지우면 된다.

| 도메인 | 호출 | 지금 응답하는 곳 |
|---|---|---|
| 해시태그 (`/admin/hashtags`) | `liveAxios` | 목업 `src/mocks/handlers/hashtag.ts` (실서버 DTO 모양) |
| 세계관 운영 (`/admin/universes`) | `liveAxios` | 목업 `src/mocks/handlers/universeAdmin.ts` (실서버 DTO 모양) |
| 세계관 큐레이션 후보 목록 | `adminAxios` | 목업 `src/mocks/handlers/universe.ts` |
| 그 외 전체 | `adminAxios` | MSW 목업 |

세계관 운영 목업은 큐레이션과 **같은 시드(`src/mocks/db/character.ts`)** 를 쓴다.
보드에서 내린 조치가 큐레이션 후보 목록에도 그대로 반영된다. 이미지 URL은 실서버가
만들지 못하는 것과 똑같이 늘 `null`이고, 화면은 함께 오는 `*FileId`로 자리표시를 둔다.

관리자 서버에는 **로그인 엔드포인트가 없다.** 토큰은 서비스 서버가 발급하고
관리자 서버는 `hasRole(ADMIN)`으로 검증만 한다. 관리자 로그인이 실연동될
때까지는 서비스 서버에서 받은 ADMIN 토큰을 `.env.local`의
`NEXT_PUBLIC_LIVE_ACCESS_TOKEN`에 넣어 쓴다.

```bash
curl -s -X POST http://localhost:8080/auth/login -H 'Content-Type: application/json' -d '{"username":"<admin-email>","password":"<password>"}'
```

목업 로그인 세션과 실서버 토큰은 별개이므로, 목업 구간에서는 실서버 401이
콘솔 세션을 끊지 않는다(토큰만 잘못 넣었을 때 로그인 화면으로 튕기지 않는다).

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

## 목업 로그인

서버 인증 연동 전까지 아래 시드 계정으로 접속한다. (로그인 화면에도 안내가 뜬다)

| 계정 | 비밀번호 | 직책 |
|---|---|---|
| `admin@plat.so` | `plat-admin-2026!` | 최고관리자 |
| `seoyeon@plat.so` | `plat-admin-2026!` | 콘텐츠 운영 |
| `haneul@plat.so` | `Plat-temp-2026!` | 결제 담당 · 초대 상태(첫 로그인 시 비밀번호 변경 강제) |

## 확인

```bash
npx tsc --noEmit && npx eslint src
```

## 아직 없는 것

- **로그인 / 권한 게이트.** 서버 인증이 붙으면 `src/app/(admin)/layout.tsx`와
  `src/api/index.ts`의 요청 인터셉터 두 곳만 수정하면 된다.
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
