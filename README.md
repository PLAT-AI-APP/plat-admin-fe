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
| `NEXT_PUBLIC_BASE_URI` | 관리자 API 베이스 URI |
| `NEXT_PUBLIC_API_MOCKING` | `enabled`일 때만 MSW 목업 워커가 뜬다 |

서버가 아직 없으므로 **기본값은 목업 모드**다. 실제 서버에 붙일 때는
`NEXT_PUBLIC_API_MOCKING`을 비우고 `NEXT_PUBLIC_BASE_URI`만 바꾸면 된다.

## 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
TanStack Query v5 · zustand · axios · react-hook-form + zod ·
sonner · recharts · MSW v2

## 운영 편의 기능

| 기능 | 위치 |
|---|---|
| 전역 검색 (`⌘K` / `Ctrl+K`) | 메뉴 + 유저·캐릭터·세계관·해시태그 통합 검색 후 이동 |
| CSV 내보내기 | 유저 관리 · 결제 장부 · 크레딧 수동 조정 · 운영 로그 · 해시태그 |
| 감사 로그 | 모든 변경 요청(POST/PUT/PATCH/DELETE)이 운영 로그에 자동 적재 |
| 기간 프리셋 | 오늘 / 7일 / 30일 / 90일 · 결제 장부 |
| 다크 모드 | 헤더 토글 |

## 확인

```bash
npx tsc --noEmit && npx eslint src
```

## 아직 없는 것

- **로그인 / 권한 게이트.** 서버 인증이 붙으면 `src/app/(admin)/layout.tsx`와
  `src/api/index.ts`의 요청 인터셉터 두 곳만 수정하면 된다.

## 이미지 업로드

`plat-fe`와 동일하게 `POST /admin/files/upload/{fileType}` (multipart, `file` 필드)로
먼저 업로드해 URL을 발급받고, 그 URL을 생성·수정 API에 넘긴다.
화면에서는 `ImageUploadField` 하나만 쓰면 된다(`src/components/ui/ImageUploadField.tsx`).

목업 구간에서는 스토리지가 없으므로 MSW 핸들러가 파일을 **data URL로 변환해서 돌려준다.**
서버가 붙으면 핸들러만 꺼지고 화면 코드는 그대로 동작한다.
# plat-admin-fe
