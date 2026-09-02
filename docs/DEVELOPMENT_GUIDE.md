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
5. 절대 경로 `@/`만 사용한다. 상대 경로는 같은 폴더(`./`, `..`)에서만.

---

## 1. 파일·폴더 규칙

| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 파일 | PascalCase.tsx | `BannerManager.tsx` |
| API 파일 | camelCase.ts, `동사+리소스` | `getBannerList.ts` |
| 훅 파일 | `useXxx.ts` | `useIsClient.ts` |
| 스토어 | `useXxxStore.ts` | `useSidebarStore.ts` |
| 타입 | camelCase.ts | `mainExposure.ts` |
| zod 스키마 | `xxx.schema.ts` | `banner.schema.ts` |
| 화면 전용 컴포넌트 | 해당 라우트의 `_components/` | `app/(admin)/legal/_components/` |

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

```ts
// src/api/user/getUserList.ts
import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { User } from "@/type/user";

export interface UserListParams {
  page: number;
  size: number;
  keyword?: string;
  status?: UserStatus;
}

export const getUserList = async (params: UserListParams) => {
  const response = await adminAxios.get<PageResponse<User>>("/admin/users", {
    params,
  });

  return response.data;
};

/** 유저 목록 화면에서 검색·필터·페이지네이션과 함께 사용합니다. */
export const useUserListQuery = (params: UserListParams) => {
  return useQuery<PageResponse<User>, AppError>({
    queryKey: ["get-user-list", params],
    queryFn: () => getUserList(params),
  });
};
```

변경 API는 `mutateXxx.ts` 한 파일에 모으고, 성공 시 **토스트 + 무효화**를 함께 처리한다.

```ts
export const useUserMutation = () => {
  const queryClient = useQueryClient();

  const invalidateUserList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-user-list"] });

  const statusMutation = useMutation<User, AppError, { userId: number; status: UserStatus }>({
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
- `staleTime` 기본값(5분)은 `ReactQueryProvider`에 있으므로 개별 훅에서 다시 지정하지 않는다.

---

## 4. MSW 목업 규칙

- 도메인별 시드 데이터는 `src/mocks/db/<domain>.ts`에 **모듈 스코프 배열**로 둔다.
- 핸들러는 `src/mocks/handlers/<domain>.ts`에 `export const <domain>Handlers = [...]`로 만든다.
  (`handlers/index.ts`에 이미 등록되어 있다.)
- **POST/PUT/DELETE는 시드 배열을 실제로 변경한다.** 새로고침 전까지 CRUD가 진짜처럼 동작해야 한다.
- 응답 지연은 `MOCK_DELAY_MS`, 페이지네이션은 `paginate(items, url)`,
  검색은 `matchesKeyword(keyword, ...fields)`, 새 ID는 `nextId(items, "xxxId")`를 쓴다.
- 난수는 `randomInt(seed, min, max)` / `pickOne(seed, items)`처럼 **seed 기반**으로만 만든다.
  `Math.random()`을 쓰면 렌더링마다 값이 바뀌어 확인이 어렵다.

---

## 5. 목록 화면 표준 구조

```tsx
"use client";

const XxxList = () => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<XxxStatus | "">("");

  const { data, isLoading } = useXxxListQuery({ page, size: DEFAULT_PAGE_SIZE, keyword, status });

  const columns: TableColumn<Xxx>[] = [ ... ];

  return (
    <Card noPadding>
      {/* 1. 필터 바 */}
      <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
        <SearchInput value={keyword} onSearch={(next) => { setKeyword(next); setPage(1); }} />
        <Select options={STATUS_OPTIONS} value={status} onChange={...} />
      </div>

      {/* 2. 표 */}
      <Table columns={columns} rows={data?.content ?? []} getRowKey={(row) => String(row.xxxId)} isLoading={isLoading} />

      {/* 3. 페이지네이션 */}
      <Pagination page={page} totalCount={data?.totalCount ?? 0} pageSize={DEFAULT_PAGE_SIZE} onChange={setPage} />
    </Card>
  );
};
```

- 검색어 변경 시 **항상 `page`를 1로 되돌린다.**
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
- **이미지 필드는 URL 입력창을 만들지 않는다.** `ImageUploadField`를 `Controller`로 감싸 쓴다.

```tsx
<FormField label="배너 이미지" required error={errors.imageUrl?.message}>
  <Controller
    control={control}
    name="imageUrl"
    render={({ field }) => (
      <ImageUploadField
        value={field.value}
        onChange={field.onChange}
        fileType="MAIN_BANNER"
        aspectRatio={BANNER_ASPECT_RATIO}
        hasError={Boolean(errors.imageUrl)}
      />
    )}
  />
</FormField>
```

업로드는 생성·수정 API와 분리되어 있다. 파일을 고르는 즉시
`POST /admin/files/upload/{fileType}`로 올려 URL을 받고, 폼은 그 URL만 들고 있다가 저장한다.
따라서 스키마는 형식 검증 없이 `z.string().min(1, "…업로드해 주세요.")`면 된다.

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

1. `constants/menu.tsx`의 해당 항목에 `isMock: true`. 사이드바와 ⌘K 검색이 같은
   배지를 그린다.
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
- `npx eslint src` 에러 0 (react-hook-form 관련 경고는 허용)
- 화면에서 목록 조회 / 생성 / 수정 / 삭제가 목업으로 실제 동작
- 로딩·빈 상태·에러 상태가 모두 표시됨
