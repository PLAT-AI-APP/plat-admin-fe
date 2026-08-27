"use client";

import { useState } from "react";
import { useAiModelListQuery } from "@/api/ai/getAiModelList";
import { useAiModelMutation } from "@/api/ai/mutateAiModel";
import { Edit, Star } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { showAppToast } from "@/lib/toast";
import { formatWithCommas } from "@/lib/utils";
import type { AiModelSchema } from "@/schema/aiModel.schema";
import { openConfirm } from "@/store/useConfirmStore";
import type { AiModel } from "@/type/ai";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Switch from "@/components/ui/Switch";
import Table, { TableCellStack } from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
import { AI_PROVIDER_LABEL, AI_PROVIDER_TONE } from "../../_constants/aiOptions";
import AiModelFormModal from "./AiModelFormModal";

const AiModelManager = () => {
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);

  const { data, isLoading } = useAiModelListQuery();
  const { updateMutation } = useAiModelMutation();

  const models = data ?? [];
  const defaultModel = models.find((model) => model.isDefault);

  /** 사용 여부 토글. 기본 모델은 항상 사용 상태여야 하므로 중지할 수 없다. */
  const handleToggleEnabled = (model: AiModel, isEnabled: boolean) => {
    if (model.isDefault && !isEnabled) {
      showAppToast("warning", "기본 모델은 사용 중지할 수 없습니다.", {
        description: "다른 모델을 기본 모델로 지정한 뒤에 중지해 주세요.",
      });
      return;
    }

    updateMutation.mutate({
      modelId: model.modelId,
      body: { isEnabled },
      successMessage: isEnabled
        ? `'${model.displayName}' 모델을 사용합니다.`
        : `'${model.displayName}' 모델 사용을 중지했습니다.`,
    });
  };

  /**
   * 기본 모델은 서비스 전체에서 항상 정확히 1개만 유지된다.
   * 지정 시 기존 기본 모델이 자동으로 해제되므로 반드시 확인을 받는다.
   */
  const handleSetDefault = (model: AiModel) => {
    openConfirm({
      title: "기본 모델을 변경할까요?",
      description: `'${model.displayName}' 모델을 기본 모델로 지정합니다.`,
      warning: defaultModel
        ? `기존 기본 모델 '${defaultModel.displayName}'의 기본 지정이 해제됩니다.`
        : undefined,
      confirmText: "기본으로 지정",
      onConfirm: () =>
        updateMutation.mutateAsync({
          modelId: model.modelId,
          body: { isDefault: true },
          successMessage: `'${model.displayName}' 모델을 기본 모델로 지정했습니다.`,
        }),
    });
  };

  const handleSubmit = (values: AiModelSchema) => {
    if (!editingModel) return;

    updateMutation.mutate(
      { modelId: editingModel.modelId, body: values },
      { onSuccess: () => setEditingModel(null) },
    );
  };

  const columns: TableColumn<AiModel>[] = [
    {
      key: "model",
      header: "모델",
      render: (model) => (
        <TableCellStack primary={model.displayName} secondary={model.model} />
      ),
    },
    {
      key: "provider",
      header: "제공사",
      render: (model) => (
        <Badge tone={AI_PROVIDER_TONE[model.provider]}>
          {AI_PROVIDER_LABEL[model.provider]}
        </Badge>
      ),
    },
    {
      key: "isEnabled",
      header: "사용",
      align: "center",
      render: (model) => (
        <div className="flex justify-center">
          <Switch
            label={`${model.displayName} 사용 여부`}
            checked={model.isEnabled}
            onChange={(isEnabled) => handleToggleEnabled(model, isEnabled)}
            disabled={updateMutation.isPending}
          />
        </div>
      ),
    },
    {
      key: "isDefault",
      header: "기본 모델",
      align: "center",
      render: (model) => (
        <div className="flex justify-center">
          {model.isDefault ? (
            <Badge tone="brand" leftIcon={<Star size={13} />}>
              기본 모델
            </Badge>
          ) : (
            // 사용 중지된 모델은 기본 모델로 지정할 수 없다.
            <Button
              size="sm"
              onClick={() => handleSetDefault(model)}
              disabled={!model.isEnabled || updateMutation.isPending}
              title={
                model.isEnabled
                  ? undefined
                  : "사용 중지된 모델은 기본 모델로 지정할 수 없습니다."
              }
            >
              기본으로 지정
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "creditCost",
      header: "차감 크레딧",
      align: "right",
      numeric: true,
      render: (model) => formatWithCommas(model.creditCost),
    },
    {
      key: "maxOutputTokens",
      header: "최대 출력 토큰",
      align: "right",
      numeric: true,
      render: (model) => formatWithCommas(model.maxOutputTokens),
    },
    {
      key: "temperature",
      header: "temperature",
      align: "right",
      numeric: true,
      render: (model) => model.temperature.toFixed(1),
    },
    {
      key: "memo",
      header: "메모",
      render: (model) => (
        <p className="max-w-80 truncate body-5 text-font-2">
          {model.memo || "-"}
        </p>
      ),
    },
    {
      key: "updatedAt",
      header: "수정일",
      numeric: true,
      render: (model) => (
        <span className="body-5 text-font-2">
          {formatDateTime(model.updatedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "56px",
      align: "center",
      render: (model) => (
        <div className="flex justify-center">
          <IconButton
            label="수정"
            icon={<Edit size={16} />}
            onClick={() => setEditingModel(model)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Alert tone="info" title="기본 모델은 항상 1개만 유지됩니다.">
        기본 모델은 모델을 따로 지정하지 않은 대화에 사용됩니다. 다른 모델을
        기본으로 지정하면 기존 기본 모델은 자동으로 해제됩니다.
      </Alert>

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <p className="body-5 text-font-2">
            총 {formatWithCommas(models.length)}개 · 사용 중{" "}
            {formatWithCommas(models.filter((model) => model.isEnabled).length)}
            개
          </p>

          <p className="body-5 text-font-2">
            현재 기본 모델{" "}
            <span className="font-medium text-font-1">
              {defaultModel?.displayName ?? "미지정"}
            </span>
          </p>
        </div>

        <Table
          columns={columns}
          rows={models}
          getRowKey={(model) => String(model.modelId)}
          isLoading={isLoading}
          skeletonRows={5}
          emptyTitle="운영 중인 모델이 없습니다."
          emptyDescription="모델 카탈로그에서 사용할 모델을 먼저 확인해 보세요."
        />
      </Card>

      <AiModelFormModal
        model={editingModel}
        onClose={() => setEditingModel(null)}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </>
  );
};

export default AiModelManager;
