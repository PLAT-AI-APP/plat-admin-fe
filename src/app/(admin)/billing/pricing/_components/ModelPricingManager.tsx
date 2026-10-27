"use client";

import { useState } from "react";
import { useAiModelListQuery } from "@/api/ai/getAiModelList";
import { useAiModelMutation } from "@/api/ai/mutateAiModel";
import { useCan } from "@/hooks/useCan";
import { Edit } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import type { AiModelPricingSchema } from "@/schema/aiModel.schema";
import type { AiModel } from "@/type/ai";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Table from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import type { TableColumn } from "@/components/ui/Table";
import {
  AI_PROVIDER_LABEL,
  AI_PROVIDER_TONE,
} from "@/app/(admin)/ai/_constants/aiOptions";
import ModelPricingFormModal from "./ModelPricingFormModal";

/**
 * 모델별 노트 요금.
 *
 * AI 모델 화면에 함께 있던 단가 · 캐시 비율 · 판매 배수를 떼어 왔다. 요금은 운영이 고치고
 * 튜닝(토큰 · temperature)은 개발이 고쳐 권한도 다르다(`creditPolicy:write` · `aiModel:write`).
 */
const ModelPricingManager = () => {
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);

  const { data, isLoading } = useAiModelListQuery();
  const { pricingMutation } = useAiModelMutation();
  const canWrite = useCan("creditPolicy:write");

  const models = data ?? [];

  /** 폼은 사람이 읽는 단위(%·배)로 받고, 서버에는 만분율로 보낸다. 판매 배수를 비우면 과금 정책 값으로 되돌린다. */
  const handleSubmit = (values: AiModelPricingSchema) => {
    if (!editingModel) return;

    const { cacheRatioPercent, priceMultiplier, ...prices } = values;
    const multiplier = priceMultiplier.trim();

    pricingMutation.mutate(
      {
        modelId: editingModel.modelId,
        body: {
          ...prices,
          cacheRatioBps: Math.round(cacheRatioPercent * 100),
          ...(multiplier === ""
            ? {
                useDefaultPriceMultiplier:
                  editingModel.priceMultiplierBps !== null,
              }
            : { priceMultiplierBps: Math.round(Number(multiplier) * 10_000) }),
        },
      },
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
      render: (model) =>
        model.isEnabled ? (
          <Badge tone="success">사용 중</Badge>
        ) : (
          <Badge tone="neutral">중지</Badge>
        ),
    },
    {
      key: "formatNoteEstimates",
      header: "예상 노트",
      // 응답 형식별 기준 대화 한 턴. 실제 차감은 쓴 토큰만큼이라 대화 길이에 따라 다르다.
      render: (model) =>
        model.formatNoteEstimates.length === 0 ? (
          <span className="body-5 text-font-2">-</span>
        ) : (
          <TableCellStack
            primary={model.formatNoteEstimates
              .map(
                (estimate) =>
                  `${estimate.responseFormatName} ${formatWithCommas(estimate.estimatedNotes)}`,
              )
              .join(" · ")}
            secondary={`k ${model.effectivePriceMultiplier.toFixed(4)}${model.priceMultiplierBps === null ? "" : " (덮어씀)"} · 캐시 ${model.cacheRatioBps / 100}%`}
          />
        ),
    },
    {
      key: "price",
      header: "단가 (100만 토큰당 원)",
      numeric: true,
      render: (model) => (
        <TableCellStack
          primary={`입력 ${formatWithCommas(model.inputPricePerMillion)} · 출력 ${formatWithCommas(model.outputPricePerMillion)}`}
          secondary={`캐시 읽기 ${formatWithCommas(model.cacheReadPricePerMillion)} · 쓰기 ${formatWithCommas(model.cacheWritePricePerMillion)}`}
        />
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
      render: (model) =>
        canWrite && (
          <div className="flex justify-center">
            <IconButton
              label="요금 수정"
              icon={<Edit size={16} />}
              onClick={() => setEditingModel(model)}
            />
          </div>
        ),
    },
  ];

  return (
    <>
      <Alert tone="info" title="판매 배수(k)를 비우면 채팅 요금의 기준 배수를 씁니다.">
        손익분기 배수보다 낮게는 저장되지 않습니다. 단가는 제공사가 가격을 바꿨을 때
        고치며, 바꾼 뒤 시작한 대화부터 새 단가로 원가를 적습니다.
      </Alert>

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
          emptyDescription="AI 엔진 > 모델에서 사용할 모델을 먼저 확인해 보세요."
        />
      </Card>

      <ModelPricingFormModal
        model={editingModel}
        onClose={() => setEditingModel(null)}
        onSubmit={handleSubmit}
        isSubmitting={pricingMutation.isPending}
      />
    </>
  );
};

export default ModelPricingManager;
