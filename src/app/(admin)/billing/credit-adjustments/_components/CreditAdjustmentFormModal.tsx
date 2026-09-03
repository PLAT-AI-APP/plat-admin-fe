"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Users } from "@/icons";
import { cn, formatCredit } from "@/lib/utils";
import {
  creditAdjustmentSchema,
  type CreditAdjustmentSchema,
} from "@/schema/creditAdjustment.schema";
import type { CreditAdjustmentRequest } from "@/api/billing/mutateCreditAdjustment";
import type { AdjustableUser } from "@/type/user";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import UserPickerModal from "./UserPickerModal";
import { ADJUSTMENT_TYPE_OPTIONS } from "./adjustmentOptions";

interface CreditAdjustmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 확인 다이얼로그 문구에 닉네임이 필요해 대상 유저를 함께 넘긴다. */
  onSubmit: (request: CreditAdjustmentRequest, user: AdjustableUser) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: CreditAdjustmentSchema = {
  userId: "",
  type: "GRANT",
  amount: 0,
  reason: "",
};

/**
 * 멱등키 한 개.
 *
 * `crypto.randomUUID`는 **보안 컨텍스트(https · localhost)에서만** 존재한다.
 * 사내망 http나 LAN IP(`http://192.168.x.x:3100`)로 열면 `undefined`인데,
 * 이 모달은 닫혀 있어도 항상 렌더되므로 그냥 부르면 모달이 아니라
 * **크레딧 조정 페이지 전체가 렌더 중 예외로 죽는다.**
 *
 * `getRandomValues`는 비보안 컨텍스트에서도 쓸 수 있어 그쪽으로 물러선다.
 * 키의 용도는 중복 요청 식별이라 UUID 형식일 필요는 없고 충돌만 없으면 된다.
 */
const createIdempotencyKey = (): string => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

const CreditAdjustmentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreditAdjustmentFormModalProps) => {
  const [selectedUser, setSelectedUser] = useState<AdjustableUser | undefined>();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  /*
    멱등키. 모달을 한 번 열면 하나를 쥐고 재시도에도 같은 값을 보낸다.
    제출할 때마다 새로 만들면 중복 클릭이 그대로 두 번 조정되고,
    아예 고정해 두면 두 번째 조정이 영영 409로 막힌다. 그래서 '모달 1회 = 키 1개'다.
  */
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreditAdjustmentSchema>({
    resolver: zodResolver(creditAdjustmentSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 조정은 1회성 작업이므로 모달을 열 때마다 빈 폼에서 시작한다.
  useEffect(() => {
    if (!isOpen) return;

    setSelectedUser(undefined);
    setIdempotencyKey(createIdempotencyKey());
    reset(EMPTY_VALUES);
  }, [isOpen, reset]);

  const values = watch();
  const amount = Number.isFinite(values.amount) ? values.amount : 0;
  const delta = values.type === "GRANT" ? amount : -amount;
  const expectedBalance = selectedUser
    ? Math.max(0, selectedUser.creditBalance + delta)
    : 0;
  /*
    차감 한도는 총 잔액이 아니라 available이다. 예약(대화 진행 중 등)으로 잠긴
    몫은 다른 작업이 이미 잡아둔 것이라 회수 대상이 아니고, 총 잔액을 기준으로
    검사하면 잠긴 만큼 서버에서 422를 맞는다. 눌러 보고 알게 하지 않는다.
  */
  const lockedBalance = selectedUser
    ? selectedUser.creditBalance - selectedUser.availableBalance
    : 0;
  const isOverDeduction = Boolean(
    selectedUser &&
      values.type === "DEDUCT" &&
      amount > selectedUser.availableBalance,
  );

  const handleSelectUser = (user: AdjustableUser) => {
    setSelectedUser(user);
    setValue("userId", user.userId, { shouldValidate: true });
  };

  const submit = handleSubmit((formValues) => {
    if (!selectedUser) return;

    onSubmit({ ...formValues, idempotencyKey }, selectedUser);
  });

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="크레딧 수동 조정"
        description="지급·차감 내역은 장부에 그대로 기록되며 되돌릴 수 없습니다."
        size="md"
        // 실수로 닫히면 입력한 사유가 사라지므로 오버레이 클릭으로 닫지 않는다.
        closeOnOverlayClick={false}
        footer={
          <>
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button
              variant="danger"
              onClick={submit}
              isLoading={isSubmitting}
              disabled={isOverDeduction}
            >
              조정 실행
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-1">
          <Alert tone="warning" title="되돌릴 수 없는 작업입니다.">
            조정 결과는 즉시 유저 잔액에 반영됩니다. 사유는 감사 로그로 남으니
            티켓 번호 등 확인 가능한 근거를 함께 적어 주세요.
          </Alert>

          <FormField
            label="대상 유저"
            required
            error={errors.userId?.message}
            className="mt-4"
          >
            {selectedUser ? (
              <div className="flex items-center gap-3 rounded-field border border-border-main p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate body-4 font-medium text-font-1">
                    {selectedUser.nickname}
                  </p>
                  <p className="mt-0.5 truncate body-6 text-font-2">
                    #{selectedUser.userId} · 보유{" "}
                    {formatCredit(selectedUser.creditBalance)}
                    {/* 잠긴 몫이 있을 때만 알린다. 없으면 보유 = 차감 가능이라 덧붙일 것이 없다. */}
                    {lockedBalance > 0 && (
                      <> · 잠김 {formatCredit(lockedBalance)}</>
                    )}
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPickerOpen(true)}
                >
                  변경
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                leftIcon={<Users size={16} />}
                onClick={() => setIsPickerOpen(true)}
                fullWidth
              >
                유저 검색
              </Button>
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="조정 유형"
              htmlFor="adjustment-type"
              required
              error={errors.type?.message}
            >
              <Select
                id="adjustment-type"
                options={ADJUSTMENT_TYPE_OPTIONS}
                hasError={Boolean(errors.type)}
                {...register("type")}
              />
            </FormField>

            <FormField
              label="조정 크레딧"
              htmlFor="adjustment-amount"
              required
              error={errors.amount?.message}
              hint="정수"
            >
              <Input
                id="adjustment-amount"
                type="number"
                min={1}
                step={1}
                placeholder="100"
                className="tabular-nums"
                hasError={Boolean(errors.amount)}
                {...register("amount", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <FormField
            label="조정 사유"
            htmlFor="adjustment-reason"
            required
            error={errors.reason?.message}
            hint="감사 로그에 그대로 남습니다."
          >
            <Textarea
              id="adjustment-reason"
              rows={3}
              placeholder="예) 결제 오류 보상 (CS 티켓 #2481)"
              hasError={Boolean(errors.reason)}
              {...register("reason")}
            />
          </FormField>

          {/* 실행 전에 잔액이 어떻게 바뀌는지 숫자로 먼저 보여준다. */}
          <dl className="flex items-center justify-between gap-4 rounded-field border border-border-main bg-subtle px-4 py-3 body-5">
            <div className="flex items-center gap-2">
              <dt className="text-font-2">조정 크레딧</dt>
              <dd
                className={cn(
                  "font-semibold tabular-nums",
                  delta >= 0 ? "text-success" : "text-danger",
                )}
              >
                {delta > 0 ? "+" : ""}
                {formatCredit(delta)}
              </dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="text-font-2">조정 후 예상 잔액</dt>
              <dd className="font-semibold text-font-1 tabular-nums">
                {selectedUser ? formatCredit(expectedBalance) : "-"}
              </dd>
            </div>
          </dl>

          {isOverDeduction && selectedUser && (
            <p className="mt-2 body-6 text-font-error">
              차감할 수 있는 크레딧은 {formatCredit(selectedUser.availableBalance)}
              까지입니다.
              {lockedBalance > 0 &&
                ` 예약으로 잠긴 ${formatCredit(lockedBalance)}은 회수할 수 없습니다.`}
            </p>
          )}
        </form>
      </Modal>

      <UserPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectUser}
      />
    </>
  );
};

export default CreditAdjustmentFormModal;
