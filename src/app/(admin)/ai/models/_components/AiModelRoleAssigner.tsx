"use client";

import type { ReactNode } from "react";
import { useAiModelMutation } from "@/api/ai/mutateAiModel";
import { Layers, Scale, Star } from "@/icons";
import { openConfirm } from "@/store/useConfirmStore";
import type { AiModel, AiModelRole } from "@/type/ai";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import type { SelectOption } from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import {
  AI_MODEL_ROLES,
  AI_MODEL_ROLE_DESCRIPTION,
  AI_MODEL_ROLE_LABEL,
} from "../../_constants/aiOptions";

/** 역할을 한눈에 구분하기 위한 아이콘. 라벨과 달리 화면 장식이라 여기에 둔다. */
const ROLE_ICON: Record<AiModelRole, ReactNode> = {
  CHAT_DEFAULT: <Star size={16} />,
  UNIVERSE_REVIEW: <Scale size={16} />,
  MEMORY_SUMMARY: <Layers size={16} />,
};

interface AiModelRoleAssignerProps {
  models: AiModel[];
  isLoading: boolean;
}

/**
 * 역할마다 어떤 모델이 서는지를 고르는 자리.
 *
 * 역할을 표의 행 버튼으로 두지 않는 이유는, 운영자가 알고 싶은 것이 "이 모델이 무슨
 * 역할인가"가 아니라 **"이 역할은 지금 누가 맡고 있나"**이기 때문이다. 역할 쪽에서
 * 모델을 고르게 두면 세 자리가 모두 채워져 있는지도 한 번에 보인다.
 */
const AiModelRoleAssigner = ({
  models,
  isLoading,
}: AiModelRoleAssignerProps) => {
  const { assignRoleMutation } = useAiModelMutation();

  const findHolder = (role: AiModelRole) =>
    models.find((model) => model.roles.includes(role));

  const toOption = (model: AiModel): SelectOption => ({
    label: model.displayName,
    value: String(model.modelId),
  });

  /**
   * 고를 수 있는 모델. 사용 중지된 모델은 역할을 맡을 수 없으므로 뺀다.
   *
   * 지금 맡고 있는 모델만은 중지 상태여도 남긴다. 목록에 없으면 select 가 가리킬
   * 값을 잃고 빈칸이 되는데, 그러면 역할이 비어 있는 것처럼 읽힌다.
   */
  const buildOptions = (holder?: AiModel): SelectOption[] => {
    const enabled = models.filter((model) => model.isEnabled);

    if (holder && !holder.isEnabled)
      return [toOption(holder), ...enabled.map(toOption)];

    return enabled.map(toOption);
  };

  const handleChange = (role: AiModelRole, modelId: number) => {
    const nextModel = models.find((model) => model.modelId === modelId);

    if (!nextModel) return;

    const currentModel = findHolder(role);

    if (currentModel?.modelId === modelId) return;

    const roleLabel = AI_MODEL_ROLE_LABEL[role];

    openConfirm({
      title: `${roleLabel} 모델을 변경할까요?`,
      description: `'${nextModel.displayName}' 모델이 ${roleLabel}을(를) 맡습니다.`,
      warning: currentModel
        ? `현재 맡고 있는 '${currentModel.displayName}' 모델의 지정이 해제됩니다.`
        : undefined,
      confirmText: "지정",
      onConfirm: () =>
        assignRoleMutation.mutateAsync({
          modelId,
          role,
          successMessage: `${roleLabel} 모델을 '${nextModel.displayName}'(으)로 지정했습니다.`,
        }),
    });
  };

  return (
    <Card
      title="모델 역할 지정"
      description="역할 하나에는 모델 하나가 섭니다 — 지정을 옮기면 이전 모델의 역할은 자동으로 해제됩니다. 반대로 한 모델이 여러 역할을 함께 맡는 것은 제한하지 않습니다."
      bodyClassName="flex flex-col gap-3"
    >
      {AI_MODEL_ROLES.map((role) => {
        const holder = findHolder(role);

        return (
          <div
            key={role}
            className="flex items-center justify-between gap-4 rounded-field border border-border-main px-4 py-3"
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-font-2">
                {ROLE_ICON[role]}
              </span>

              <div className="min-w-0">
                <p className="body-4 font-medium text-font-1">
                  {AI_MODEL_ROLE_LABEL[role]}
                </p>
                <p className="mt-0.5 body-6 text-font-2">
                  {AI_MODEL_ROLE_DESCRIPTION[role]}
                </p>
              </div>
            </div>

            {isLoading ? (
              <Skeleton className="h-10 w-56 shrink-0" />
            ) : (
              <Select
                aria-label={`${AI_MODEL_ROLE_LABEL[role]} 모델`}
                selectBoxClassName="w-56 shrink-0"
                options={buildOptions(holder)}
                // 지정이 비어 있으면 그 기능이 멈춘 상태다. 빈 값을 골라 둔 것처럼 보이면 안 된다.
                placeholder="미지정"
                value={holder ? String(holder.modelId) : ""}
                onChange={(event) =>
                  handleChange(role, Number(event.target.value))
                }
                disabled={assignRoleMutation.isPending || models.length === 0}
              />
            )}
          </div>
        );
      })}
    </Card>
  );
};

export default AiModelRoleAssigner;
