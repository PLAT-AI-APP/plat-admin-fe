# plat-admin-fe — 개발 가이드

> 새 화면을 추가할 때 이 문서의 순서와 규칙을 그대로 따른다.
> 규칙은 `plat-fe`의 실제 코드 스타일에서 가져왔다. 임의로 바꾸지 않는다.

---

## 0. 절대 규칙

1. **색상·간격·모서리·그림자는 `docs/DESIGN_SYSTEM.md`의 토큰만 쓴다.**
   `text-gray-500`, `bg-white` 같은 Tailwind 기본 팔레트 직접 사용 금지.
2. **공통 UI는 `src/components/ui`에서 가져다 쓴다.** 버튼·표·모달을 화면에서 새로 만들지 않는다.
3. **주석은 한국어로, `/** */` 형식으로 단다.** 왜 그렇게 했는지를 적는다.
4. **문자열은 한국어 하드코딩.** admin은 i18n을 쓰지 않는다.
5. 절대 경로 `@/`만 사용한다. 상대 경로는 **같은 폴더(`./`)에서만** 쓴다.
   `src/api` 안에서 axios 인스턴스를 부르는 `from ".."`만 예외다.
6. **다른 라우트의 `_components` · `_constants` · `_lib`를 가져다 쓰지 않는다.**
   두 화면이 함께 쓰게 되면 `src/components/<domain>` · `src/constants`로 올린다.
   라우트 폴더를 옮기거나 지울 때 다른 화면이 조용히 깨지지 않게 하기 위해서다.

---

## 1. 파일·폴더 규칙

| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 파일 | PascalCase.tsx | `BannerManager.tsx` |
| API 파일 | camelCase.ts, `동사+리소스` | `getBannerList.ts` |
| 훅 파일 | `useXxx.ts` | `useIsClient.ts` |
| 스토어 | `useXxxStore.ts` | `useSidebarStore.ts` |
| 타입 | camelCase.ts | `mainExposure.ts` |
| zod 스키마 | `src/schema/xxx.schema.ts` | `banner.schema.ts` |
| 화면 전용 컴포넌트 | 해당 라우트의 `_components/` | `app/(admin)/legal/_components/` |
| 화면 전용 라벨 · 옵션 | 해당 라우트의 `_constants/xxxOptions.ts` | `communication/_constants/communicationOptions.ts` |
| 화면 전용 순수 함수 | 해당 라우트의 `_lib/` | `universes/characters/_lib/characterExposure.ts` |
| 여러 화면이 쓰는 컴포넌트 · 옵션 | `src/components/<domain>/` · `src/constants/` | `components/universe/CharacterCell.tsx` |

**이름 규칙**

| 대상 | 규칙 | 예시 |
|---|---|---|
| 목록 + CRUD 화면 컨테이너 | `XxxManager` | `NoticeManager`, `AdminAccountManager` |
| 상세 화면 컨테이너 | `XxxDetailView` · `XxxView` | `UniverseDetailView` |
| 생성 · 수정 모달 | `XxxFormModal` | `BannerFormModal` |
| 읽기 전용 모달 | `XxxDetailModal` | `NoticeDetailModal` |
| 조회 API 파일 · 훅 | `getXxx.ts` · `useXxxQuery` | `getNoticeList.ts` · `useNoticeListQuery` |
| 변경 API 파일 · 훅 | `mutateXxx.ts` · `useXxxMutation` | `mutateNotice.ts` · `useNoticeMutation` |
| 단일 동작 API | `동사+리소스.ts` | `login.ts`, `pingModel.ts`, `postFileUpload.ts` |
| 쿼리 키 | 파일 이름을 kebab-case로 | `getNoticeList.ts` → `["get-notice-list", params]` |

---

## 2. 컴포넌트 작성 규칙

```tsx
import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface ExampleProps extends ComponentPropsWithoutRef<"div"> {
  title: string;
  isActive: boolean;
}

const Example = ({ title, isActive, className, ...props }: ExampleProps) => {
  return (
    <div className={cn("base-class", isActive && "active-class", className)} {...props}>
      {title}
    </div>
  );
};

export default Example;
```

- **화살표 함수 + `export default`.** (`app/**/page.tsx`만 `export default function`)
- props 타입은 `interface XxxProps`, 시그니처에서 구조분해.
- 클래스 조합은 항상 `cn()`.
- 훅을 쓰는 컴포넌트 파일 최상단에 `"use client";`.
- `page.tsx`는 서버 컴포넌트로 두고, 상태가 필요한 부분만 `_components/`의 클라이언트 컴포넌트로 분리한다.

---

## 3. API + react-query 규칙 ★

**`plat-fe`와 동일하게, API 함수와 react-query 훅을 같은 파일에 둔다.**
쿼리키는 별도 상수 파일 없이 `["동사-리소스", ...파라미터]` 형태의 인라인 배열을 쓴다.

### axios 인스턴스

| 인스턴스 | 쓰는 곳 |
|---|---|
| `liveAxios` | **실서버에 엔드포인트가 있는 도메인.** 새 화면의 기본값이다. |
| `adminAxios` | 서버에 아직 엔드포인트가 없어 MSW 목업으로만 도는 도메인. |

### 서버 계약 (plat-be `docs/10-Response-Guide.md`)

- 성공 응답에 봉투가 없다. DTO가 그대로 온다. 명령형은 **204 무바디**, 생성은 201.
- 목록은 `PageWith`(`{ condition, page: { number, size, totalElements, … }, content }`)이고
  **페이지는 0부터** 센다. 화면은 1부터 세므로 경계에서 `toPageRequest` · `toPageResponse`
  (`@/type/api`)로 바꾼다. 페이지 번호 변환을 파일마다 손으로 쓰지 않는다.
- **Snowflake ID(유저 · 캐릭터 · 세계관 · 시나리오 · 댓글 · 신고 · 크리에이터)는 `string`이다.**
  `Number()`로 바꾸면 끝자리가 뭉개져 다른 대상을 가리킨다. 자동 증가 ID(공지 · 해시태그 ·
  금지어 · 직책 · 관리자 등)만 `number`로 바꿔 쓸 수 있다.
- 서버 `@Nullable` 필드는 `null`로 온다(`undefined`가 아니다). 타입에는 `T | null`로 적는다.
- 서버 DTO와 화면 타입이 다르면 **API 파일 안에서만** 변환한다(`toXxx`). 화면은 서버 필드 이름을 모른다.

```ts
// src/api/notice/getNoticeList.ts
import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageRequest,
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { NoticeStatus, NoticeSummary } from "@/type/notice";

export interface NoticeListParams {
  page: number;
  size: number;
  keyword?: string;
  status?: NoticeStatus | "";
}

/** 빈 필터는 서버에 보내지 않는다(enum 파싱 실패 방지). */
const toRequestParams = (params: NoticeListParams) => ({
  ...toPageRequest(params),
  keyword: params.keyword?.trim() || undefined,
  status: params.status || undefined,
});

export const getNoticeList = async (params: NoticeListParams) => {
  const response = await liveAxios.get<PageWith<NoticeSummary>>("/admin/notices", {
    params: toRequestParams(params),
  });

  return toPageResponse(response.data);
};

/** 공지 목록 화면에서 검색·필터·페이지네이션과 함께 사용합니다. */
export const useNoticeListQuery = (params: NoticeListParams) => {
  return useQuery<PageResponse<NoticeSummary>, AppError>({
    queryKey: ["get-notice-list", params],
    queryFn: () => getNoticeList(params),
  });
};
```

변경 API는 `mutateXxx.ts` 한 파일에 모으고, 성공 시 **토스트 + 무효화**를 함께 처리한다.

```ts
export const useUserMutation = () => {
  const queryClient = useQueryClient();

  const invalidateUserList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-user-list"] });

  const statusMutation = useMutation<void, AppError, { userId: string; status: UserStatus }>({
    mutationFn: ({ userId, status }) => updateUserStatus(userId, status),
    onSuccess: () => {
      showAppToast("success", "유저 상태를 변경했습니다.");
      invalidateUserList();
    },
  });

  return { statusMutation };
};
```

- 에러 토스트는 따로 붙이지 않는다. axios 인터셉터가 `AppError`로 정규화하고,
  화면에서 필요할 때만 `showErrorToast(error)`를 쓴다.
- 무효화 키는 **실제 조회 훅의 키와 같은 첫 원소**를 쓴다. 존재하지 않는 키를 무효화해도
  아무 에러가 나지 않아 캐시가 조용히 낡는다. 키를 바꾸면 `rg`로 무효화하는 곳도 함께 바꾼다.
- `staleTime` 기본값(5분)은 `ReactQueryProvider`에 있다. 개별 훅에서 바꾸는 것은
  **폴링(`0`) · 세션 동안 고정(`Infinity`)처럼 이유가 있을 때만**이고, 그 이유를 주석으로 남긴다.
- 서버에 없는 엔드포인트를 부르는 목업 전용 조회가 목록 화면 밖(뱃지 · 검색 등)에서 돌면
  `IS_MOCKING`(`src/api/baseUri.ts`)으로 막는다. 운영(`main`)은 목업이 꺼져 404만 쌓인다.

---

## 4. MSW 목업 규칙

- **목업은 실서버에 아직 엔드포인트가 없는 도메인만 만든다.** 서버가 붙으면 핸들러와
  등록을 지우고 호출을 `liveAxios`로 옮긴다. 실서버 베이스(`LIVE_BASE_URI`)에 목업을
  등록해 가로채지 않는다 — 어느 화면이 진짜로 붙었는지 아무도 구분하지 못하게 된다.
- 도메인별 시드 데이터는 `src/mocks/db/<domain>.ts`에 **모듈 스코프 배열**로 둔다.
- 핸들러는 `src/mocks/handlers/<domain>.ts`에 `export const <domain>Handlers = [...]`로 만들고
  `handlers/index.ts`에 등록한다. 베이스는 `NEXT_PUBLIC_BASE_URI`다.
- **POST/PUT/DELETE는 시드 배열을 실제로 변경한다.** 새로고침 전까지 CRUD가 진짜처럼 동작해야 한다.
- 응답 지연은 `MOCK_DELAY_MS`, 페이지네이션은 `paginate(items, url)`,
  검색은 `matchesKeyword(keyword, ...fields)`, 새 ID는 `nextId(items, "xxxId")`를 쓴다
  (`src/mocks/utils.ts`). 화면 코드에서 같은 걸러내기가 필요하면 `@/lib/listFilter`를 쓰고,
  **화면 · API 코드는 `src/mocks`를 import하지 않는다.**
- 문자열 ID를 난수 시드로 쓸 때는 `seedOf(id)`로 접는다. ID 자체를 숫자로 바꾸지 않는다.
- 난수는 `randomInt(seed, min, max)` / `pickOne(seed, items)`처럼 **seed 기반**으로만 만든다.
  `Math.random()`을 쓰면 렌더링마다 값이 바뀌어 확인이 어렵다.

---

## 5. 목록 화면 표준 구조

검색어 · 필터 · 페이지는 **주소에 싣는다**(`useListParams`). 새로고침 · 공유 · 뒤로 가기에도
조건이 남아야 운영자끼리 같은 목록을 본다. `useState`로 들고 있지 않는다.

```tsx
"use client";

/** 주소에 실리는 목록 조건 */
const DEFAULT_PARAMS = { page: 1, keyword: "", status: "" };

const XxxManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword } = params;
  const status = params.status as XxxStatus | "";

  const { data, isLoading } = useXxxListQuery({ page, size: DEFAULT_PAGE_SIZE, keyword, status });

  const columns: TableColumn<Xxx>[] = [ ... ];

  return (
    <Card noPadding>
      {/* 1. 필터 바 */}
      <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
        <SearchInput value={keyword} onSearch={(next) => setParams({ keyword: next })} />
        <Select options={STATUS_OPTIONS} value={status} onChange={(event) => setParams({ status: event.target.value })} />
      </div>

      {/* 2. 표 */}
      <Table columns={columns} rows={data?.content ?? []} getRowKey={(row) => row.xxxId} isLoading={isLoading} />

      {/* 3. 페이지네이션 */}
      <Pagination page={page} totalCount={data?.totalCount ?? 0} pageSize={DEFAULT_PAGE_SIZE} onChange={(next) => setParams({ page: next })} />
    </Card>
  );
};
```

```tsx
// page.tsx — useListParams가 useSearchParams를 쓰므로 Suspense가 필요하다.
<Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
  <XxxManager />
</Suspense>
```

- 필터를 바꾸면 `useListParams`가 **페이지를 1로 되돌린다.** 직접 `page: 1`을 넣지 않는다.
- 상태 뱃지는 `Badge`, 행 액션은 `IconButton` 또는 `Dropdown`.
- 파괴적 액션은 반드시 `openConfirm({ ... })`.

---

## 6. 폼 규칙

`react-hook-form` + `zod` + `@hookform/resolvers/zod` 조합만 쓴다.

```tsx
const { register, handleSubmit, control, reset, formState: { errors } } = useForm<XxxSchema>({
  resolver: zodResolver(xxxSchema),
  defaultValues: EMPTY_VALUES,
});
```

- 스키마는 `src/schema/xxx.schema.ts`, 에러 메시지는 한국어.
- 필드는 `FormField`로 감싸고 `error={errors.xxx?.message}`를 넘긴다.
- 체크박스·스위치처럼 비제어가 어려운 입력은 `Controller`를 쓴다.
- 입력값을 화면에 즉시 반영(미리보기 · 조건부 필드 · 합계)할 때는 `watch()`가 아니라
  **`useWatch({ control, name })`**를 쓴다. `watch()`는 React Compiler가 메모할 수 없어
  `react-hooks/incompatible-library` 경고가 나고, 그 컴포넌트 전체가 컴파일 대상에서 빠진다.
- 모달을 열 때 폼 밖의 로컬 상태(탭 · 선택값 · 멱등 키)를 초기화하려고 이펙트에서
  `setState`를 부르지 않는다(`react-hooks/set-state-in-effect`). 열림이 바뀐 렌더에서 맞춘다.

```tsx
const [wasOpen, setWasOpen] = useState(isOpen);

if (isOpen !== wasOpen) {
  setWasOpen(isOpen);
  if (isOpen) setTab("write");
}

// react-hook-form 값은 지금처럼 이펙트에서 reset()한다.
useEffect(() => {
  if (isOpen) reset(initialValues);
}, [isOpen, initialValues, reset]);
```

- **이미지 필드는 URL 입력창을 만들지 않는다.** `ImageUploadField`를 `Controller`로 감싸 쓴다.

```tsx
<FormField label="배너 이미지" required error={errors.imageFileId?.message}>
  <Controller
    control={control}
    name="imageFileId"
    render={({ field }) => (
      <ImageUploadField
        value={field.value}
        onChange={field.onChange}
        fileType="MAIN_BANNER"
        aspectRatio={BANNER_ASPECT_RATIO}
        hasError={Boolean(errors.imageFileId)}
      />
    )}
  />
</FormField>
```

업로드는 생성·수정 API와 분리되어 있다. 파일을 고르는 즉시 자료 경로의 업로드 API
(`POST /admin/main-banners/image`)로 올려 **`fileId`**를 받고, 폼은 그 ID만 들고 있다가
저장한다. 화면에 그릴 때는 `src/lib/imageUrl.ts`가 `GET /images/{type}/{fileId}/{variant}`를
조립한다. 스키마는 형식 검증 없이 `z.string().min(1, "…업로드해 주세요.")`면 된다.

---

## 7. 서버 데이터를 편집할 때 (중요)

`useEffect`로 서버 데이터를 `useState`에 복사하면 **React Compiler 린트 에러**가 난다.
아래 draft 패턴을 쓴다.

```tsx
// 편집 전에는 서버 값을 그대로 쓰고, 편집이 시작되면 draft가 화면을 담당한다.
const [draft, setDraft] = useState<Xxx[] | null>(null);
const rows = draft ?? data ?? [];

const handleReset = () => setDraft(null);
const handleSave = () => mutation.mutate(rows, { onSuccess: () => setDraft(null) });
```

---

## 8. MOCK 화면

아직 실서버에 붙지 않았거나 다른 도구로 운영 중인 화면도 **목업으로 정상 동작하도록
구현한다.** 화면을 지우면 나중에 왜 없는지 아무도 모르고, 표시 없이 두면 저장한 값이
실제로 반영되는 줄 안다.

표시는 두 군데에 함께 넣는다. **둘 중 하나만으로는 부족하다** — 배지는 메뉴를 훑을
때만 보이고, 화면 안 안내는 메뉴에서 무엇이 목업인지 알려 주지 못한다.

1. `src/constants/menu.tsx`의 해당 항목에 `isMock: true`. 사이드바와 ⌘K 검색이 같은
   배지를 그린다. 실서버로 옮기면 **배지와 안내를 함께 지운다** — 라이브 화면에 MOCK이 남으면
   운영자가 저장 결과를 믿지 않는다.
2. 화면 최상단에 `Alert`.

```tsx
<Alert tone="warning" title="MOCK 화면 · 아직 실서버에 연결되지 않았습니다">
  여기 목록과 상태는 <b>목업 데이터</b>입니다. 이 화면에서 바꾼 값은 앱에 반영되지
  않습니다. 목록 API가 붙는 시점에 실제 연동으로 전환합니다.
</Alert>
```

**제목과 본문은 화면마다 다르게 쓴다.** "무엇이 목업이고 무엇이 반영되지 않는가"가
화면마다 다르다 — 지표를 못 믿는 것과, 저장이 앱에 안 나가는 것과, 발송이 실제로
나가지 않는 것은 운영자가 해야 할 판단이 서로 다르다.

---

## 9. 완료 기준

- `npx tsc --noEmit` 통과
- `npx eslint src` **에러 0 · 경고 0**
- 화면에서 목록 조회 / 생성 / 수정 / 삭제가 실서버(또는 목업)로 실제 동작
- 로딩·빈 상태·에러 상태가 모두 표시됨
