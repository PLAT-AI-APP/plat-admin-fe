# plat-fe 코드 스타일 참조

> `plat-admin-fe`가 따르기로 한 원본 프로젝트(`../plat-fe`)의 실제 코드 스타일 정리.
> 아래 내용은 전부 `plat-fe`의 실제 파일을 읽고 확인한 것이며, 추측은 넣지 않았다.
> 새 코드를 어떻게 쓸지는 `docs/DEVELOPMENT_GUIDE.md`를 본다. 이 문서는 "원본이 이렇게 되어 있다"는 근거다.

---

## 1. 스택 (plat-fe/package.json)

| 영역 | 패키지 | 버전 |
|---|---|---|
| 프레임워크 | `next` | 16.1.6 |
| 런타임 | `react` / `react-dom` | 19.2.3 |
| 언어 | `typescript` | ^5 |
| 스타일 | `tailwindcss` + `@tailwindcss/postcss` | ^4.2.1 |
| 서버 상태 | `@tanstack/react-query` | ^5.90.21 |
| 클라이언트 상태 | `zustand` | ^5.0.11 |
| HTTP | `axios` | ^1.13.6 |
| 폼 | `react-hook-form` + `@hookform/resolvers` + `zod` | ^7.72 / ^5.4 / ^4.4 |
| 토스트 | `sonner` | ^2.0.7 |
| 애니메이션 | `framer-motion` | ^12.35.1 (admin은 미채택 — 11장 참고) |
| 날짜 | `dayjs` | ^1.11.20 |
| 클래스 병합 | `clsx` + `tailwind-merge` | ^2.1.1 / ^3.5.0 |
| 마크다운 | `react-markdown` + `remark-gfm` + `remark-breaks` | ^10 / ^4 / ^4 |
| 드래그 | `@hello-pangea/dnd` | ^18.0.1 |
| 폰트 | `pretendard` | ^1.3.9 |
| 테마 | `next-themes` | ^0.4.6 |
| 목업 | `msw` (devDep) | ^2.13.2 |
| i18n | `next-intl` | ^4.13.0 |

패키지 매니저는 npm(`package-lock.json`). 스크립트는 `dev` / `build` / `start` / `lint` 4개뿐이고 테스트 스크립트는 없다.

**admin에서 뺀 것**: `next-intl`(관리자는 한국어 단일), `embla-carousel-*`, `react-easy-crop`, `react-calendar`, `next-navigation-guard`.
**admin에서 더한 것**: `recharts`(대시보드 차트).

---

## 2. 설정 파일

- **tsconfig.json** — `strict: true`, `target: ES2017`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, 경로 별칭은 `@/*` → `./src/*` **하나뿐**이다.
- **eslint.config.mjs** — flat config. `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`를 펼쳐 쓰고 커스텀 룰은 추가하지 않는다.
- **postcss.config.mjs** — `@tailwindcss/postcss` 하나.
- **tailwind.config는 없다.** Tailwind v4이므로 토큰은 CSS의 `@theme inline` 블록에서 정의한다.
- **prettier 설정 파일이 없다.** 코드에 나타난 실제 포맷은 큰따옴표, 세미콜론 있음, 후행 쉼표 있음, 들여쓰기 2칸, 폭 80자 기준이다.
- **.vscode/settings.json** — `tailwindCSS.classAttributes`에 `className` 외에 `gridClassName`, `cardClassName`, `inputClassName`, `inputBoxClassName`, `formClassName`, `boxClassName`을 등록해 둔다. → **컴포넌트가 여러 개의 className prop을 받는 관례가 있다는 뜻**이고, admin도 같은 설정을 복사했다.

---

## 3. 디렉토리 구조 (plat-fe/src)

```
api/        도메인별 폴더 + index.ts (axios 인스턴스)
app/        App Router. 라우트 그룹 (auth) (main) 사용
components/ 도메인별 하위 폴더 (auth, character, chat, dialog, field, modal, popover, skeleton …)
constants/  상수
hooks/      범용 UI 훅만 (useClickAway, useDebounce, useToggle …)
i18n/       next-intl
icons/      개별 SVG 컴포넌트 + index.tsx 배럴
lib/        cn, dayjs, toast, regex, file, image …
mocks/      MSW (handlers/ 하위 도메인별 분리)
providers/  IntlProvider, MSWProvider, ReactQueryProvider, SonnerProvider, ThemeProvider
schema/     zod 스키마 (`character.schema.ts`)
store/      zustand (`useAuthStore.ts`, `useModalStore.ts` …)
type/       타입 (`type/api/index.ts` 포함)
```

**레이어 기반**이지 기능(feature) 기반이 아니다. 화면 전용 컴포넌트는 라우트 폴더 안의 `_components/`에 둔다 (`app/character-creat/_components/…`).

파일명 규칙:
- 컴포넌트 `PascalCase.tsx`
- 훅/스토어 `useXxx.ts`
- API `동사+리소스.ts` (`getCharacterDetail.ts`, `postChatacterCreate.ts`)
- 스키마 `xxx.schema.ts`
- lib/constants `camelCase.ts`

---

## 4. 컴포넌트 작성 (실제 예: components/ActiveButton.tsx)

```tsx
import { cn } from "@/lib/utils";
import React, { ComponentPropsWithoutRef, ReactNode } from "react";

// HTMLButtonElement의 모든 기본 속성을 포함하도록 확장
interface ActiveButtonProps extends ComponentPropsWithoutRef<"button"> {
  text: string;
  isActive: boolean;
  id?: string;
  children?: ReactNode;
  textClassName?: string;
}

const ActiveButton = ({
  className,
  text,
  isActive,
  type = "submit",
  ...props
}: ActiveButtonProps) => {
  return (
    <button
      type={type}
      disabled={!isActive}
      className={cn(
        "w-full h-11.5 title-3 rounded-lg transition-all",
        isActive
          ? "bg-brand text-font-4 cursor-pointer"
          : "bg-card text-font-1 cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
};

export default ActiveButton;
```

정리하면:
- **화살표 함수 + `const` + 파일 하단 `export default`**
- props 타입은 `interface XxxProps extends ComponentPropsWithoutRef<"tag">`
- 시그니처에서 구조분해, 기본값도 시그니처에서 지정 (`type = "submit"`)
- 클래스 조합은 항상 `cn()`, 조건부는 삼항 또는 `조건 && "클래스"`
- 나머지 props는 `{...props}`로 전달
- `cva` 같은 variant 라이브러리는 **쓰지 않는다.** variant는 객체 맵 또는 삼항으로 처리한다.

---

## 5. 색상 토큰 (plat-fe/src/app/globals.css)

Tailwind v4 `@theme inline`으로 CSS 변수를 유틸리티에 매핑한다.

```css
:root {
  --brand: #ff7a00;
  --brand-opacity: rgba(255, 122, 0, 0.1); /* 10% 투명도 적용 */
  --font-1: #11141f;
  --font-2: #4a4d5e;
}

@theme inline {
  --default-transition-duration: 0.2s;
  --color-font-1: var(--font-1);
  --color-brand: var(--brand);
  --color-card: var(--bg-card);
  /* … */
}
```

- 시맨틱 네이밍: `--font-0..4`(글자 위계), `--bg-*`(표면), `--border`, `--brand*`, 상태색.
- 화면에서는 `text-font-1`, `bg-card`, `border-border-main`처럼 **시맨틱 클래스만** 쓴다.
- 전역 규칙: `html, body { height:100%; overflow:hidden }`, `button { cursor:pointer; transition-duration:0.2s }`, `textarea { resize:none }`, 폰트 Pretendard, `letter-spacing:-0.025em`, `line-height:1.4`.
- 다크가 기본 테마이고 `@variant dark (&:where(.dark, .dark *));`로 정의한다.

→ admin은 **토큰 구조와 네이밍을 그대로** 따르고 값만 라이트 테마 + 인디고 브랜드로 바꿨다.

---

## 6. 아이콘 (plat-fe/src/icons)

아이콘 라이브러리를 쓰지 않고 SVG를 직접 컴포넌트로 만든다.

```tsx
// icons/index.tsx
export interface IconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number | string;
}

export const IconWrapper = ({ size = 24, className = "", children, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
    {children}
  </svg>
);
```

```tsx
// icons/Adjust.tsx
const Adjust = (props: IconProps) => (
  <IconWrapper {...props}>
    <path d="…" />
  </IconWrapper>
);
export default Adjust;
```

`index.tsx`에서 주석으로 분류(`// 1. 방향 및 화살표`, `// 2. 알림 및 상태` …)해 배럴 export 한다.
→ admin도 동일 구조를 쓰되, 아이콘이 라인 스타일이라 `LineIconWrapper`를 하나 더 뒀다.

---

## 7. API 레이어 (plat-fe/src/api)

### 7.1 axios 인스턴스 (`api/index.ts`)

- `BASE_CONFIG.baseURL = process.env.NEXT_PUBLIC_BASE_URI` ← **env 이름이 `NEXT_PUBLIC_BASE_URI`다.**
- 인스턴스를 용도별로 나눈다: `plainAxios`(인터셉터 없음), `axiosInstance`, `authAxios`(`withCredentials`).
- 응답 인터셉터에서 `{ result: "OK", data }` 구식 봉투와 신식 DTO를 함께 해석하는 `unwrapApiData`로 정규화한다.
- 에러는 `AppError { code, fields, message }` 형태로 정규화한다.
- 주석은 한국어 `/** */`.

### 7.2 API 함수 + 훅은 같은 파일에 둔다 ★

`plat-fe`에서 가장 중요한 관례다. (`api/character/getCharacterDetail.ts`)

```ts
import { useQuery } from "@tanstack/react-query";
import { authAxios } from "..";
import { AppError } from "@/type/api";
import { CharacterDetail } from "@/type/character";

export const getCharacterDetail = async (characterId: string) => {
  const response = await authAxios.get<CharacterDetail>(`/character/${characterId}`);

  return response.data;
};

/** 캐릭터 상세 페이지 콘텐츠 영역에 필요한 프로필, 설정, 시나리오, 댓글 데이터를 조회합니다. */
export const useCharacterDetailQuery = (characterId: string) => {
  return useQuery<CharacterDetail, AppError>({
    queryKey: ["get-character-detail", characterId],
    queryFn: () => getCharacterDetail(characterId),
    staleTime: 1000 * 60 * 5,
  });
};
```

- **쿼리키 상수 파일이 없다.** `["get-리소스", ...파라미터]` 인라인 배열을 쓴다.
- 훅 이름은 `useXxxQuery` / `useXxxMutation`.
- 훅 바로 위에 한국어 `/** */`로 "언제 쓰는 훅인지"를 적는다.
- `src/hooks/`에는 API 훅을 두지 않는다. 거기는 `useDebounce`, `useClickAway` 같은 범용 UI 훅 전용이다.

---

## 8. 상태 관리 (plat-fe/src/store)

```ts
export const useModalStore = create<ModalState>((set, get) => ({
  modals: [],
  openModal: (type, props) => { … },
  closeModal: () => set((state) => ({ modals: state.modals.slice(0, -1) })),
}));
```

- `create<State>((set, get) => ({...}))`, **named export**, 파일명 = 스토어명.
- 상태와 액션을 하나의 인터페이스에 함께 선언한다.
- 컴포넌트 밖에서는 `useXxxStore.getState()`로 접근한다.
- 모달/다이얼로그를 스토어로 전역 관리하는 패턴이 있다(`useModalStore`, `useDialogStore`).
  → admin의 `useConfirmStore` + `ConfirmDialogHost`가 이 패턴을 따랐다.

---

## 9. 프로바이더 (plat-fe/src/providers)

- `ReactQueryProvider` — `useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 1000*60*5, refetchOnWindowFocus: false } } }))`
- `MSWProvider` — `process.env.NEXT_PUBLIC_API_MOCKING === "enabled"`일 때만 워커 기동, 준비 전에는 `null` 렌더
- `SonnerProvider` — `unstyled: true` + `classNames`로 직접 스타일, 아이콘도 커스텀 SVG로 교체
- 프로바이더는 `export default function` 또는 `const … export default` 둘 다 나타난다(혼용).

---

## 10. 주석·문구

- **주석은 전부 한국어.** 공개 함수/상수 위에는 `/** … */`, 코드 중간 설명은 `//`.
- "왜 이렇게 했는지"를 적는다. 예: `// useState를 사용해야 렌더링 시 인스턴스가 새로 생성되는 것을 방지`
- 사용자 노출 문구는 plat-fe에서는 `next-intl` 키를 쓰지만, admin은 한국어 하드코딩이다.

---

## 11. admin이 의도적으로 다르게 한 점

| 항목 | plat-fe | plat-admin-fe | 이유 |
|---|---|---|---|
| i18n | next-intl | 한국어 하드코딩 | 관리자는 다국어 대상이 아님 |
| 기본 테마 | 다크 | 라이트(+다크 지원) | 첨부된 관리자 화면이 라이트 |
| 브랜드 색 | `#ff7a00` | `#4f46e5` | 첨부된 관리자 화면 기준 |
| 아이콘 | 솔리드(`fill`) | 라인(`stroke`) | 관리 화면 정보 밀도에 맞춤 |
| 차트 | 없음 | recharts | 대시보드에 필요 |
| 애니메이션 | framer-motion | CSS 키프레임 (의존성 없음) | `AnimatePresence`가 포털 안에서 exit 후 언마운트를 하지 못해 투명 오버레이가 화면에 남는 문제를 겪음. 모션이 최소라 의존성 자체를 뺐다 (`docs/DESIGN_SYSTEM.md` 6장) |
