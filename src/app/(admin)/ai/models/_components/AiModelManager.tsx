"use client";

import { useState } from "react";
import { useAiModelListQuery } from "@/api/ai/getAiModelList";
import { useAiModelMutation } from "@/api/ai/mutateAiModel";
import { Edit } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { showAppToast } from "@/lib/toast";
import { formatWithCommas } from "@/lib/utils";
import type { AiModelSchema } from "@/schema/aiModel.schema";
import type { AiModel } from "@/type/ai";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Switch from "@/components/ui/Switch";
import Table, { TableCellStack } from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
import {
  AI_MODEL_ROLES,
  AI_MODEL_ROLE_LABEL,
  AI_MODEL_ROLE_TONE,
  AI_PROVIDER_LABEL,
  AI_PROVIDER_TONE,
} from "../../_constants/aiOptions";
import AiModelFormModal from "./AiModelFormModal";
import AiModelRoleAssigner from "./AiModelRoleAssigner";

const AiModelManager = () => {
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);

  const { data, isLoading } = useAiModelListQuery();
  const { updateMutation } = useAiModelMutation();

  const models = data ?? [];

  /** 사용 여부 토글. 역할을 맡은 모델은 그 역할이 갈 곳을 잃으므로 중지할 수 없다. */
  const handleToggleEnabled = (model: AiModel, isEnabled: boolean) => {
    if (model.roles.length > 0 && !isEnabled) {
      const heldRoles = model.roles
        .map((role) => AI_MODEL_ROLE_LABEL[role])
        .join(" · ");

      showAppToast("warning", "역할을 맡은 모델은 사용 중지할 수 없습니다.", {
        description: `${heldRoles} 역할을 다른 모델에 먼저 지정해 주세요.`,
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
      key: "roles",
      header: "역할",
      // 지정은 위 카드에서만 한다. 여기서는 누가 무엇을 맡았는지만 읽는다.
      render: (model) => {
        if (model.roles.length === 0) {
          return <span className="body-5 text-font-2">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {/* 모델이 가진 순서가 아니라 역할의 고정 순서로 그린다. */}
            {AI_MODEL_ROLES.filter((role) => model.roles.includes(role)).map(
              (role) => (
                <Badge key={role} tone={AI_MODEL_ROLE_TONE[role]}>
                  {AI_MODEL_ROLE_LABEL[role]}
                </Badge>
              ),
            )}
          </div>
        );
      },
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
      {/* 지정 규칙은 바로 아래 역할 카드가 설명한다. 여기서는 그 카드가 다루지 않는 제약만 말한다. */}
      <Alert tone="info" title="역할을 맡은 모델은 사용 중지할 수 없습니다.">
        중지하면 그 역할이 갈 곳을 잃습니다. 중지하려면 그 역할을 다른 모델에
        먼저 지정해 주세요.
      </Alert>

      <AiModelRoleAssigner models={models} isLoading={isLoading} />

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <p className="body-5 text-font-2">
            총 {formatWithCommas(models.length)}개 · 사용 중{" "}
            {formatWithCommas(models.filter((model) => model.isEnabled).length)}
            개
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
