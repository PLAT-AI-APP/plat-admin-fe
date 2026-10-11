"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useDocsGroupQuery } from "@/api/docs/getDocsGroup";
import { useDocsMutation } from "@/api/docs/mutateDocs";
import { postDocsImage } from "@/api/docs/postDocsImage";
import { docsGroupSchema, type DocsGroupSchema } from "@/schema/docs.schema";
import { DOCS_GROUP_STATUS_LABEL, type DocsLocale } from "@/type/docs";
import { Trash } from "@/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import Textarea from "@/components/ui/Textarea";
import {
  DOCS_GROUP_STATUS_OPTIONS,
  DOCS_GROUP_STATUS_TONE,
  DOCS_IMAGE_MIME_TYPES,
} from "@/app/(admin)/communication/docs/_constants/docsOptions";
import {
  emptyGroupForm,
  slugSourceOrder,
  toGroupForm,
  toGroupPayload,
} from "@/app/(admin)/communication/docs/_lib/docsForm";
import { useDocsLocales } from "@/app/(admin)/communication/docs/_lib/useDocsLocales";
import { fallbackSlug, slugify } from "@/app/(admin)/communication/docs/_lib/docsMarkdown";

interface DocsGroupEditorProps {
  /** 고친다면 그룹 ID, 새로 만든다면 `null` */
  groupId: string | null;
  /** 새로 만들 때 넣을 부모 그룹. 최상위면 `null` */
  parentId: string | null;
  /** 최상위부터 이 그룹(또는 새 그룹의 부모)까지 이름 */
  path: string[];
  canWrite: boolean;
  canDelete: boolean;
  onCreated: (groupId: string) => void;
  onDelete: () => void;
  onDirtyChange: (isDirty: boolean) => void;
}

/**
 * 그룹 편집 패널. 트리에서 그룹을 누르면 오른쪽에 바로 열린다.
 *
 * 부모는 여기서 바꾸지 않는다 — 이동은 트리를 끌거나 '이동' 메뉴로 한다
 * (서버도 그룹 수정 API 에서 부모를 받지 않는다).
 */
const DocsGroupEditor = ({
  groupId,
  parentId,
  path,
  canWrite,
  canDelete,
  onCreated,
  onDelete,
  onDirtyChange,
}: DocsGroupEditorProps) => {
  const isCreate = groupId === null;
  const { defaultLocale, locales, codes } = useDocsLocales();
  const [locale, setLocale] = useState<DocsLocale>(defaultLocale);
  /** slug 를 사람이 직접 고쳤는지. 고친 뒤로는 이름을 바꿔도 덮어쓰지 않는다. */
  const [isSlugTouched, setIsSlugTouched] = useState(!isCreate);

  const { data: group, isLoading, isError } = useDocsGroupQuery(groupId);
  const { createGroupMutation, updateGroupMutation } = useDocsMutation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<DocsGroupSchema>({
    resolver: zodResolver(docsGroupSchema),
    defaultValues: emptyGroupForm(codes),
  });

  useEffect(() => {
    if (group) reset(toGroupForm(group, codes));
  }, [group, codes, reset]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const translations = useWatch({ control, name: "translations" });

  /** 새 그룹은 이름에서 slug 를 제안한다. 영어 이름이 있으면 영어를 먼저 쓴다. */
  const suggestSlug = () => {
    if (isSlugTouched) return;

    const current = getValues("translations");
    const suggested = slugSourceOrder(codes)
      .map((code) => slugify(current[code]?.name ?? ""))
      .find(Boolean);
    setValue("slug", suggested ?? "", { shouldDirty: true });
  };

  const submit = handleSubmit((values) => {
    const payload = toGroupPayload(values, codes);

    if (isCreate) {
      createGroupMutation.mutate(
        { ...payload, parentId },
        {
          onSuccess: (created) => {
            reset(values);
            onCreated(created.id);
          },
        },
      );
      return;
    }

    updateGroupMutation.mutate(
      { groupId, values: payload },
      { onSuccess: (updated) => reset(toGroupForm(updated, codes)) },
    );
  });

  /* 다른 언어 칸에서 난 오류는 탭을 넘겨야 보인다. 저장을 눌렀을 때 그 탭으로 옮긴다. */
  const errorLocale = codes.find((code) => errors.translations?.[code]);
  const handleSave = () => {
    if (errorLocale && errorLocale !== locale) setLocale(errorLocale);
    submit();
  };

  const isSaving = createGroupMutation.isPending || updateGroupMutation.isPending;
  const isReadOnly = !canWrite;

  const localeTabs = locales.map(({ code, name }) => ({
    value: code,
    label: translations?.[code]?.name?.trim() ? name : `${name} (없음)`,
  }));

  if (isError) {
    return (
      <Alert tone="danger" title="그룹을 불러오지 못했습니다.">
        삭제되었거나 서버에 연결할 수 없습니다. 트리를 새로 고쳐 주세요.
      </Alert>
    );
  }

  return (
    <Card noPadding>
      <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <p className="body-4 font-semibold text-font-1">
              {isCreate ? "새 그룹" : "그룹 편집"}
            </p>
            {group && (
              <Badge tone={DOCS_GROUP_STATUS_TONE[group.status]}>
                {DOCS_GROUP_STATUS_LABEL[group.status]}
              </Badge>
            )}
          </div>
          <p className="truncate body-6 text-font-2">
            {isCreate
              ? path.length > 0
                ? `'${path.join(" › ")}' 아래에 만듭니다.`
                : "최상위 그룹으로 만듭니다."
              : path.join(" › ")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!isCreate && canDelete && (
            <Button
              size="sm"
              variant="dangerGhost"
              leftIcon={<Trash size={14} />}
              onClick={onDelete}
            >
              삭제
            </Button>
          )}
          {canWrite && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving || (!isCreate && !isDirty)}
            >
              {isCreate ? "만들기" : "저장"}
            </Button>
          )}
        </div>
      </div>

      {!isCreate && isLoading ? (
        <div className="flex flex-col gap-3 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
          className="flex flex-col gap-4 p-5"
        >
          <div className="flex flex-col gap-3">
            <Tabs items={localeTabs} value={locale} onChange={setLocale} />

            {/* 모든 언어 칸을 띄워 두고 탭으로 보이는 것만 바꾼다. 입력이 탭을 오가도 남는다. */}
            {codes.map((key) => (
              <div key={key} hidden={key !== locale} className="flex flex-col gap-1">
                <FormField
                  label="이름"
                  htmlFor={`docs-group-name-${key}`}
                  error={errors.translations?.[key]?.name?.message}
                  hint="최대 60자 · 비우면 이 언어 번역이 없어집니다"
                >
                  <Input
                    id={`docs-group-name-${key}`}
                    placeholder={key === "ko" ? "유저 가이드" : "User Guide"}
                    disabled={isReadOnly}
                    hasError={Boolean(errors.translations?.[key]?.name)}
                    {...register(`translations.${key}.name`, { onChange: suggestSlug })}
                  />
                </FormField>

                <FormField
                  label="설명"
                  htmlFor={`docs-group-description-${key}`}
                  error={errors.translations?.[key]?.description?.message}
                  hint="최대 200자 · 그룹 카드에 보입니다"
                >
                  <Textarea
                    id={`docs-group-description-${key}`}
                    rows={3}
                    disabled={isReadOnly}
                    placeholder={
                      key === "ko"
                        ? "캐릭터와 대화하는 유저를 위한 안내"
                        : "Guides for users chatting with characters"
                    }
                    hasError={Boolean(errors.translations?.[key]?.description)}
                    {...register(`translations.${key}.description`)}
                  />
                </FormField>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="slug"
              htmlFor="docs-group-slug"
              required
              error={errors.slug?.message}
              labelSuffix={
                canWrite && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => {
                      setIsSlugTouched(true);
                      setValue("slug", fallbackSlug("group"), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    임시 slug
                  </Button>
                )
              }
              hint="영문 소문자 · 숫자 · 하이픈"
            >
              <Input
                id="docs-group-slug"
                placeholder="user-guide"
                disabled={isReadOnly}
                hasError={Boolean(errors.slug)}
                {...register("slug", { onChange: () => setIsSlugTouched(true) })}
              />
            </FormField>

            <FormField
              label="노출"
              htmlFor="docs-group-status"
              required
              hint="숨기면 하위 페이지도 모두 안 보입니다"
            >
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    id="docs-group-status"
                    options={DOCS_GROUP_STATUS_OPTIONS}
                    value={field.value}
                    disabled={isReadOnly}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>
          </div>

          <div className="max-w-xl">
            <FormField label="커버 이미지" hint="홈 · 그룹 화면 카드">
              <Controller
                control={control}
                name="coverImage"
                render={({ field }) => (
                  <ImageUploadField
                    value={field.value?.url ?? ""}
                    maxSizeMb={5}
                    upload={async (file) => {
                      const image = await postDocsImage(file);
                      field.onChange(image);
                      return image.url;
                    }}
                    onChange={(url) => {
                      if (!url) field.onChange(null);
                    }}
                    accept={DOCS_IMAGE_MIME_TYPES}
                    aspectRatio="16 / 9"
                    disabled={isReadOnly}
                  />
                )}
              />
            </FormField>
          </div>
        </form>
      )}
    </Card>
  );
};

export default DocsGroupEditor;
