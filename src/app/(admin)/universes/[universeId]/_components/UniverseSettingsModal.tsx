"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UniversePatchBody } from "@/api/universe/mutateUniverse";
import type { UniverseDetail } from "@/type/character";
import {
  universeSettingsSchema,
  type UniverseSettingsSchema,
} from "@/schema/universe.schema";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import {
  UNIVERSE_CATEGORY_OPTIONS,
  UNIVERSE_TENDENCY_OPTIONS,
  UNIVERSE_VISIBILITY_OPTIONS,
} from "./universeMeta";

/** 무엇을 바꾸러 열었는지. 한 번에 한 가지만 바꾸게 해 오조작을 줄인다. */
export type UniverseSettingsMode = "visibility" | "classification";

interface UniverseSettingsModalProps {
  mode: UniverseSettingsMode | null;
  universe: Pick<UniverseDetail, "visibility" | "category" | "tendency">;
  isPending: boolean;
  onClose: () => void;
  /** 바뀐 필드만 담긴 본문. 바뀐 것이 없으면 호출되지 않는다. */
  onSubmit: (body: UniversePatchBody) => void;
}

const MODE_TEXT: Record<
  UniverseSettingsMode,
  { title: string; description: string }
> = {
  visibility: {
    title: "공개 범위 변경",
    description:
      "공개는 앱 목록·검색에 노출, 일부공개는 링크를 아는 사람만, 비공개는 크리에이터만 볼 수 있습니다.",
  },
  classification: {
    title: "장르 · 성향 변경",
    description:
      "장르와 성향은 앱의 탐색·추천 분류에 쓰입니다. 신고로 분류 오류가 확인됐을 때 바로잡습니다.",
  },
};

/**
 * 공개 범위 · 장르 · 성향 변경 모달.
 *
 * `PATCH /admin/universes/{id}`는 이 세 값을 받는데 화면에는 수단이 아예 없어,
 * 분류가 잘못된 세계관을 발견해도 운영자가 할 수 있는 일이 "비활성화"뿐이었다.
 * 잘못 분류된 것을 통째로 내리는 것은 크리에이터에게 과한 조치다.
 *
 * 폼 값은 `values`로 서버 값과 동기화한다. `defaultValues`만 주면 조치 후 상세를
 * 다시 불러와도 폼이 옛 값을 들고 있어, 방금 바꾼 값을 되돌려 보내게 된다.
 */
const UniverseSettingsModal = ({
  mode,
  universe,
  isPending,
  onClose,
  onSubmit,
}: UniverseSettingsModalProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UniverseSettingsSchema>({
    resolver: zodResolver(universeSettingsSchema),
    values: {
      visibility: universe.visibility,
      category: universe.category,
      tendency: universe.tendency,
    },
  });

  const submit = handleSubmit((values) => {
    const body: UniversePatchBody = {};

    // 바뀐 필드만 보낸다. 부분 갱신 API라 안 보낸 값은 서버가 그대로 둔다.
    if (mode === "visibility" && values.visibility !== universe.visibility) {
      body.visibility = values.visibility;
    }

    if (mode === "classification") {
      if (values.category !== universe.category) body.category = values.category;
      if (values.tendency !== universe.tendency) body.tendency = values.tendency;
    }

    if (Object.keys(body).length === 0) {
      onClose();

      return;
    }

    onSubmit(body);
  });

  if (!mode) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={MODE_TEXT[mode].title}
      description={MODE_TEXT[mode].description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isPending}>
            변경
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {mode === "visibility" && (
          <>
            <Controller
              control={control}
              name="visibility"
              render={({ field }) => (
                <FormField
                  label="공개 범위"
                  error={errors.visibility?.message}
                >
                  <Select {...field} options={UNIVERSE_VISIBILITY_OPTIONS} />
                </FormField>
              )}
            />

            {/* 심사 전 세계관을 공개로 올려도 앱에는 뜨지 않는다. 먼저 알려 준다. */}
            <Alert tone="info">
              공개로 바꿔도 심사가 승인되지 않았거나 비활성 상태면 앱에
              노출되지 않습니다.
            </Alert>
          </>
        )}

        {mode === "classification" && (
          <>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <FormField label="장르" error={errors.category?.message}>
                  <Select {...field} options={UNIVERSE_CATEGORY_OPTIONS} />
                </FormField>
              )}
            />

            <Controller
              control={control}
              name="tendency"
              render={({ field }) => (
                <FormField label="성향" error={errors.tendency?.message}>
                  <Select {...field} options={UNIVERSE_TENDENCY_OPTIONS} />
                </FormField>
              )}
            />
          </>
        )}
      </div>
    </Modal>
  );
};

export default UniverseSettingsModal;
