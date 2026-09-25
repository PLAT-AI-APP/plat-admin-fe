"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useCreditBulkGrantMutation } from "@/api/billing/mutateCreditBulkGrant";
import { Upload } from "@/icons";
import { parseUserIds } from "@/lib/userIdList";
import { formatCredit, formatWithCommas } from "@/lib/utils";
import {
  creditBulkGrantSchema,
  type CreditBulkGrantSchema,
} from "@/schema/creditBulkGrant.schema";
import { openConfirm } from "@/store/useConfirmStore";
import type { CreditBulkGrantResult } from "@/type/billing";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";

interface CreditBulkGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_VALUES: CreditBulkGrantSchema = {
  userIdsText: "",
  amount: 0,
  reason: "",
};

/** 운영자가 고칠 수 있는 것을 알려 주는 말로 바꾼다. 모르는 코드는 그대로 보여 준다. */
const FAILURE_LABEL: Record<string, string> = {
  CREDIT_WALLET_NOT_FOUND: "지갑 없음 — 없는 유저이거나 가입이 끝나지 않았습니다.",
  UNKNOWN: "알 수 없는 오류 — 서버 로그를 확인해 주세요.",
};

/**
 * 묶음 멱등키. 서버가 `키:userId`로 풀어 64자에 맞추므로 40자 · 영문 숫자 하이픈만 쓴다.
 * `crypto.randomUUID`가 없는 비보안 컨텍스트에서도 되도록 `getRandomValues`로 만든다.
 */
const createBatchKey = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  return `bulk-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
};

/**
 * 크레딧 일괄 지급.
 *
 * 베타 보상 · 장애 보상처럼 여러 유저에게 같은 양을 같은 사유로 준다. 회수는 받지 않는다.
 *
 * **모달을 한 번 열면 묶음 키 하나를 끝까지 쥔다.** 서버는 유저마다 따로 커밋해 일부만
 * 실패할 수 있는데, 실패한 유저만 다시 보낼 때 키가 같아야 이미 받은 유저가 두 번 받지 않는다.
 * 목록을 통째로 다시 보내도 같은 이유로 안전하다.
 */
const CreditBulkGrantModal = ({ isOpen, onClose }: CreditBulkGrantModalProps) => {
  const [batchKey, setBatchKey] = useState(createBatchKey);
  const [result, setResult] = useState<CreditBulkGrantResult | null>(null);
  const [wasOpen, setWasOpen] = useState(isOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mutation = useCreditBulkGrantMutation();

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setBatchKey(createBatchKey());
      setResult(null);
    }
  }

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<CreditBulkGrantSchema>({
    resolver: zodResolver(creditBulkGrantSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!isOpen) return;

    reset(EMPTY_VALUES);
  }, [isOpen, reset]);

  const [userIdsText, watchedAmount] = useWatch({
    control,
    name: ["userIdsText", "amount"],
  });
  const parsed = parseUserIds(userIdsText ?? "");
  const amount = Number.isFinite(watchedAmount) ? watchedAmount : 0;

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const text = await file.text();
    const current = getValues("userIdsText").trim();

    setValue("userIdsText", current ? `${current}\n${text}` : text, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const submit = handleSubmit((values) => {
    const { userIds } = parseUserIds(values.userIdsText);

    openConfirm({
      title: `${formatWithCommas(userIds.length)}명에게 크레딧을 지급할까요?`,
      description: `한 명당 ${formatCredit(values.amount)}, 합계 ${formatCredit(values.amount * userIds.length)}를 지급합니다.`,
      warning:
        "실행 즉시 유저 잔액에 반영되며 되돌릴 수 없습니다. 사유는 유저마다 조정 이력으로 남습니다.",
      confirmText: "일괄 지급 실행",
      tone: "danger",
      onConfirm: async () => {
        const next = await mutation.mutateAsync({
          userIds,
          amount: values.amount,
          reason: values.reason.trim(),
          idempotencyKey: batchKey,
        });

        setResult(next);
      },
    });
  });

  /** 실패한 유저만 남겨 같은 키로 다시 보낼 수 있게 한다. 금액 · 사유는 그대로 둔다. */
  const retryFailed = () => {
    if (!result) return;

    setValue(
      "userIdsText",
      result.failed.map((failure) => failure.userId).join("\n"),
      { shouldDirty: true, shouldValidate: true },
    );
    setResult(null);
  };

  const hasFailures = Boolean(result && result.failed.length > 0);

  return (
    <Modal
      isDirty={isDirty && !result}
      isOpen={isOpen}
      onClose={onClose}
      title="크레딧 일괄 지급"
      description="여러 유저에게 같은 크레딧을 같은 사유로 지급합니다."
      size="md"
      closeOnOverlayClick={false}
      footer={
        result ? (
          <>
            {hasFailures && (
              <Button variant="secondary" onClick={retryFailed}>
                실패한 유저만 다시 시도
              </Button>
            )}
            <Button variant="primary" onClick={onClose}>
              닫기
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="danger"
              onClick={submit}
              isLoading={mutation.isPending}
            >
              지급 실행
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="flex flex-col gap-4">
          <Alert
            tone={hasFailures ? "warning" : "success"}
            title={
              hasFailures
                ? `${formatWithCommas(result.failed.length)}명은 지급하지 못했습니다.`
                : "모두 지급했습니다."
            }
          >
            대상 {formatWithCommas(result.requested)}명 · 새로 지급{" "}
            {formatWithCommas(result.granted)}명 · 이미 받아 건너뜀{" "}
            {formatWithCommas(result.alreadyGranted)}명
          </Alert>

          {hasFailures && (
            <ul className="flex max-h-60 flex-col divide-y divide-border-main overflow-y-auto rounded-field border border-border-main">
              {result.failed.map((failure) => (
                <li
                  key={failure.userId}
                  className="flex items-start justify-between gap-3 px-3 py-2 body-6"
                >
                  <span className="shrink-0 font-medium text-font-1 tabular-nums">
                    #{failure.userId}
                  </span>
                  <span className="text-right text-font-2">
                    {FAILURE_LABEL[failure.code] ?? failure.code}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-1">
          <Alert tone="warning" title="되돌릴 수 없는 작업입니다.">
            지급은 유저마다 따로 반영되어 일부만 실패할 수 있습니다. 실패한
            유저는 결과 화면에서 골라 다시 시도하면 이미 받은 유저는 건너뜁니다.
          </Alert>

          <FormField
            label="대상 유저 ID"
            htmlFor="bulk-user-ids"
            required
            error={errors.userIdsText?.message}
            hint="줄바꿈 · 쉼표로 구분합니다. CSV는 숫자 칸만 읽고 머리글은 알려 줍니다."
            className="mt-4"
          >
            <Textarea
              id="bulk-user-ids"
              rows={6}
              placeholder={"1234567890123\n1234567890124"}
              className="font-mono tabular-nums"
              hasError={Boolean(errors.userIdsText)}
              {...register("userIdsText")}
            />
          </FormField>

          <div className="-mt-1 mb-3 flex items-center justify-between gap-3">
            <p className="body-6 text-font-2">
              {formatWithCommas(parsed.userIds.length)}명
              {parsed.duplicateCount > 0 &&
                ` · 중복 ${formatWithCommas(parsed.duplicateCount)}개는 한 번만 지급`}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Upload size={14} />}
              onClick={() => fileInputRef.current?.click()}
            >
              CSV 불러오기
            </Button>
          </div>

          <FormField
            label="한 명당 지급 크레딧"
            htmlFor="bulk-amount"
            required
            error={errors.amount?.message}
            hint="정수 · 최대 100,000"
          >
            <Input
              id="bulk-amount"
              type="number"
              min={1}
              step={1}
              placeholder="100"
              className="tabular-nums"
              hasError={Boolean(errors.amount)}
              {...register("amount", { valueAsNumber: true })}
            />
          </FormField>

          <FormField
            label="지급 사유"
            htmlFor="bulk-reason"
            required
            error={errors.reason?.message}
            hint="유저마다 조정 이력에 그대로 남습니다."
          >
            <Textarea
              id="bulk-reason"
              rows={2}
              placeholder="예) 클로즈베타 참여 보상"
              hasError={Boolean(errors.reason)}
              {...register("reason")}
            />
          </FormField>

          <dl className="flex items-center justify-between gap-4 rounded-field border border-border-main bg-subtle px-4 py-3 body-5">
            <dt className="text-font-2">합계</dt>
            <dd className="font-semibold text-success tabular-nums">
              {formatCredit(amount * parsed.userIds.length)}
            </dd>
          </dl>
        </form>
      )}
    </Modal>
  );
};

export default CreditBulkGrantModal;
