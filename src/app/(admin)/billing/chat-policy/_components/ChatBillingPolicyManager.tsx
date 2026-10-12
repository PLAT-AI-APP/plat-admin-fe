"use client";

import { useState } from "react";
import {
  useChangeChatBillingPolicyMutation,
  useChatBillingPoliciesQuery,
} from "@/api/billing/chatBilling";
import { formatDateTime } from "@/lib/dayjs";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import type { ChatBillingPolicy, ChatBillingPolicyValues } from "@/type/chatBilling";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import Textarea from "@/components/ui/Textarea";

/** 만분율은 %로, 안전계수는 배로 보여 준다. 저장할 때 다시 만분율로 바꾼다. */
const bpsToPercent = (bps: number) => String(bps / 100);
const percentToBps = (value: string) => Math.round(Number(value) * 100);

const POLICY_FIELDS = [
  { key: "noteBasePrice", label: "노트 기준가", unit: "원", toInput: (v: number) => String(v), fromInput: (v: string) => Number(v) },
  { key: "creatorShareBps", label: "제작자 몫", unit: "%", toInput: bpsToPercent, fromInput: percentToBps },
  { key: "feeBps", label: "결제 수수료", unit: "%", toInput: bpsToPercent, fromInput: percentToBps },
  { key: "vatBps", label: "부가세", unit: "%", toInput: bpsToPercent, fromInput: percentToBps },
  { key: "opsBps", label: "운영비", unit: "%", toInput: bpsToPercent, fromInput: percentToBps },
  { key: "targetMarginBps", label: "목표 이익률", unit: "%", toInput: bpsToPercent, fromInput: percentToBps },
  { key: "inputSafetyBps", label: "입력 안전계수", unit: "배", toInput: (v: number) => String(v / 10_000), fromInput: (v: string) => Math.round(Number(v) * 10_000) },
] as const;

type PolicyKey = (typeof POLICY_FIELDS)[number]["key"];

const HISTORY_COLUMNS: TableColumn<ChatBillingPolicy>[] = [
  { key: "effectiveFrom", header: "적용 시작", width: "150px", numeric: true, render: (row) => <span className="text-font-2">{formatDateTime(row.effectiveFrom)}</span> },
  { key: "noteBasePrice", header: "기준가", align: "right", numeric: true, render: (row) => `${row.noteBasePrice}원` },
  { key: "creatorShareBps", header: "제작자", align: "right", numeric: true, render: (row) => `${row.creatorShareBps / 100}%` },
  { key: "feeBps", header: "수수료", align: "right", numeric: true, render: (row) => `${row.feeBps / 100}%` },
  { key: "vatBps", header: "부가세", align: "right", numeric: true, render: (row) => `${row.vatBps / 100}%` },
  { key: "opsBps", header: "운영비", align: "right", numeric: true, render: (row) => `${row.opsBps / 100}%` },
  { key: "targetMarginBps", header: "목표 이익", align: "right", numeric: true, render: (row) => `${row.targetMarginBps / 100}%` },
  { key: "priceMultiplier", header: "k", align: "right", numeric: true, render: (row) => row.priceMultiplier.toFixed(4) },
  { key: "memo", header: "사유", render: (row) => <TableCellStack primary={row.memo ?? "-"} secondary={row.changedByName ?? undefined} /> },
];

/** k = 1 ÷ (1 − 제작자몫 − 수수료 − 부가세 − 운영비 − 목표이익률). 서버와 같은 식으로 미리 보여 준다. */
const multiplierOf = (values: ChatBillingPolicyValues) => {
  const remain =
    10_000 - values.creatorShareBps - values.feeBps - values.vatBps - values.opsBps - values.targetMarginBps;
  return remain > 0 ? 10_000 / remain : null;
};

const ChatBillingPolicyManager = () => {
  const { data: policies = [], isLoading } = useChatBillingPoliciesQuery();
  const policyMutation = useChangeChatBillingPolicyMutation();
  const canWrite = useHasPermission("creditPolicy:write");

  const [draft, setDraft] = useState<Record<PolicyKey, string> | null>(null);
  const [memo, setMemo] = useState("");
  const [isHistoryOpen, setHistoryOpen] = useState(false);

  const current = policies[0];

  if (isLoading) return <Skeleton className="h-64 w-full rounded-card" />;

  const openEdit = () => {
    if (!current) return;
    setMemo("");
    setDraft(
      Object.fromEntries(POLICY_FIELDS.map((field) => [field.key, field.toInput(current[field.key])])) as Record<PolicyKey, string>,
    );
  };

  const draftValues = draft
    ? (Object.fromEntries(POLICY_FIELDS.map((field) => [field.key, field.fromInput(draft[field.key])])) as ChatBillingPolicyValues)
    : null;
  const changedFields =
    draftValues && current ? POLICY_FIELDS.filter((field) => draftValues[field.key] !== current[field.key]) : [];
  const draftMultiplier = draftValues ? multiplierOf(draftValues) : null;

  return (
    <div className="flex flex-col gap-5">
      {!current && <Alert tone="danger" title="과금 정책이 없습니다. 채팅 요금을 계산할 수 없어 대화가 시작되지 않습니다." />}

      {current && (
        <Card
          title="현재 정책"
          description={`${formatDateTime(current.effectiveFrom)}부터 적용${current.changedByName ? ` · ${current.changedByName}` : ""}`}
          action={
            <>
              <Button size="sm" variant="secondary" onClick={() => setHistoryOpen(true)}>
                이력
              </Button>
              {canWrite && (
                <Button size="sm" onClick={openEdit}>
                  정책 변경
                </Button>
              )}
            </>
          }
        >
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {POLICY_FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <dt className="body-5 text-font-2">{field.label}</dt>
                <dd className="title-2 font-mono">
                  {field.toInput(current[field.key])}
                  <span className="ml-0.5 body-4 text-font-2">{field.unit}</span>
                </dd>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <dt className="body-5 text-font-2">판매 배수 k</dt>
              <dd className="title-2 font-mono">
                {current.priceMultiplier.toFixed(4)}
                <span className="ml-0.5 body-4 text-font-2">배</span>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="body-5 text-font-2">손익분기 배수</dt>
              <dd className="title-2 font-mono">
                {current.breakEvenMultiplier.toFixed(4)}
                <span className="ml-0.5 body-4 text-font-2">배</span>
              </dd>
            </div>
          </dl>
          <p className="mt-4 body-6 text-font-2">
            노트 = max(1, 올림(청구원가 × k ÷ 노트 기준가)). 청구원가는 입력을 모델별 평균 캐시 비율로 매긴 원가이고, 모델마다 k를
            덮어쓸 수 있습니다(AI 모델 관리). 1노트는 원가 약 {(current.noteBasePrice / current.priceMultiplier).toFixed(2)}원어치입니다.
          </p>
        </Card>
      )}

      {isHistoryOpen && (
        <Modal isOpen size="xl" onClose={() => setHistoryOpen(false)} title="과금 정책 변경 이력">
          <Table minRows={0} columns={HISTORY_COLUMNS} rows={policies} getRowKey={(row) => row.policyId} />
        </Modal>
      )}

      {draft && draftValues && current && (
        <Modal
          isOpen
          size="md"
          onClose={() => setDraft(null)}
          title="과금 정책 변경"
          description={
            draftMultiplier === null
              ? "제작자 몫·수수료·부가세·운영비·목표 이익률의 합은 100% 미만이어야 합니다."
              : `저장하는 즉시 다음 대화부터 적용됩니다. 새 k = ${draftMultiplier.toFixed(4)}배`
          }
          isDirty={changedFields.length > 0}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDraft(null)}>
                취소
              </Button>
              <Button
                disabled={
                  changedFields.length === 0 ||
                  draftMultiplier === null ||
                  memo.trim().length === 0 ||
                  policyMutation.isPending
                }
                onClick={() =>
                  openConfirm({
                    title: "과금 정책을 바로 적용할까요?",
                    description: changedFields
                      .map((field) => `${field.label}: ${field.toInput(current[field.key])}${field.unit} → ${draft[field.key]}${field.unit}`)
                      .join(" · "),
                    confirmText: "적용",
                    onConfirm: () =>
                      policyMutation.mutateAsync({ ...draftValues, memo: memo.trim() }).then(() => setDraft(null)),
                  })
                }
              >
                저장
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            {POLICY_FIELDS.map((field) => (
              <FormField key={field.key} label={`${field.label} (${field.unit})`}>
                <Input
                  type="number"
                  step="0.01"
                  value={draft[field.key]}
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                />
              </FormField>
            ))}
            <FormField label="변경 사유" required className="col-span-2">
              <Textarea rows={2} maxLength={200} value={memo} onChange={(event) => setMemo(event.target.value)} />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ChatBillingPolicyManager;
