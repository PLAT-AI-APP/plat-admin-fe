"use client";

import { useState } from "react";
import { useModelCatalogQuery } from "@/api/ai/getModelCatalog";
import { useModelPingMutation } from "@/api/ai/pingModel";
import { Activity, CheckCircle, Warning } from "@/icons";
import { formatWithCommas } from "@/lib/utils";
import type { AiModelCatalogItem, AiModelPingResult, AiProvider } from "@/type/ai";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Table, { TableCellStack } from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
import {
  AI_MODEL_STATUS_LABEL,
  AI_MODEL_STATUS_TONE,
  AI_PROVIDER_FILTER_OPTIONS,
  AI_PROVIDER_LABEL,
  AI_PROVIDER_TONE,
} from "../../_constants/aiOptions";

const ModelCatalogManager = () => {
  const [provider, setProvider] = useState<AiProvider | "">("");

  /** 테스트 호출 결과는 모델명을 키로 화면에만 쌓아 둔다. (서버에 저장되지 않는다) */
  const [pingResults, setPingResults] = useState<
    Record<string, AiModelPingResult>
  >({});

  const { data, isLoading } = useModelCatalogQuery({
    provider: provider || undefined,
  });

  const pingMutation = useModelPingMutation();

  const handlePing = (model: string) => {
    pingMutation.mutate(model, {
      onSuccess: (result) =>
        setPingResults((prev) => ({ ...prev, [result.model]: result })),
    });
  };

  const columns: TableColumn<AiModelCatalogItem>[] = [
    {
      key: "model",
      header: "모델",
      render: (item) => (
        <TableCellStack primary={item.displayName} secondary={item.model} />
      ),
    },
    {
      key: "provider",
      header: "제공사",
      render: (item) => (
        <Badge tone={AI_PROVIDER_TONE[item.provider]}>
          {AI_PROVIDER_LABEL[item.provider]}
        </Badge>
      ),
    },
    {
      key: "contextWindow",
      header: "컨텍스트 윈도우",
      align: "right",
      numeric: true,
      render: (item) => `${formatWithCommas(item.contextWindow)} 토큰`,
    },
    {
      key: "status",
      header: "상태",
      render: (item) => (
        <Badge tone={AI_MODEL_STATUS_TONE[item.status]}>
          {AI_MODEL_STATUS_LABEL[item.status]}
        </Badge>
      ),
    },
    {
      key: "inputPricePerMillion",
      header: "입력 단가",
      align: "right",
      numeric: true,
      render: (item) => `${formatWithCommas(item.inputPricePerMillion)}원`,
    },
    {
      key: "outputPricePerMillion",
      header: "출력 단가",
      align: "right",
      numeric: true,
      render: (item) => `${formatWithCommas(item.outputPricePerMillion)}원`,
    },
    {
      key: "pingResult",
      header: "테스트 결과",
      render: (item) => {
        const result = pingResults[item.model];

        if (!result) {
          return <span className="text-[13px] text-font-disabled">-</span>;
        }

        return (
          <div className="flex items-center gap-2">
            <Badge
              tone={result.isSuccess ? "success" : "danger"}
              leftIcon={
                result.isSuccess ? (
                  <CheckCircle size={13} />
                ) : (
                  <Warning size={13} />
                )
              }
            >
              {result.isSuccess ? "성공" : "실패"}
            </Badge>

            <span className="text-[13px] tabular-nums text-font-2">
              {formatWithCommas(result.latencyMs)}ms
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: "120px",
      align: "center",
      render: (item) => (
        <Button
          size="sm"
          leftIcon={<Activity size={15} />}
          onClick={() => handlePing(item.model)}
          isLoading={
            pingMutation.isPending && pingMutation.variables === item.model
          }
          disabled={pingMutation.isPending}
        >
          테스트 호출
        </Button>
      ),
    },
  ];

  return (
    <>
      <Alert tone="info" title="제공사가 내려주는 원본 모델 정보입니다.">
        여기서는 운영 설정을 바꾸지 않습니다. 사용 여부·차감 크레딧 같은 운영
        값은 &apos;AI 모델 관리&apos;에서 변경하세요. 테스트 호출 결과는 이
        화면에서만 유지됩니다.
      </Alert>

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <p className="text-[13px] text-font-2">
            총 {formatWithCommas(data?.length ?? 0)}개 모델
          </p>

          <Select
            options={AI_PROVIDER_FILTER_OPTIONS}
            value={provider}
            onChange={(event) =>
              setProvider(event.target.value as AiProvider | "")
            }
            selectBoxClassName="w-40"
          />
        </div>

        <Table
          columns={columns}
          rows={data ?? []}
          getRowKey={(item) => item.model}
          isLoading={isLoading}
          skeletonRows={6}
          emptyTitle="조건에 맞는 모델이 없습니다."
          emptyDescription="제공사 필터를 바꿔서 다시 찾아보세요."
        />
      </Card>
    </>
  );
};

export default ModelCatalogManager;
