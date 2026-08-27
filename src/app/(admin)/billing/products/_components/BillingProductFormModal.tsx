"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { formatCredit, formatCurrency } from "@/lib/utils";
import {
  billingProductSchema,
  type BillingProductSchema,
} from "@/schema/billingProduct.schema";
import type { BillingProduct, BillingProductFormValues } from "@/type/billing";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import {
  PRODUCT_PLATFORM_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
} from "./productOptions";

interface BillingProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상. 없으면 신규 등록 모드다. */
  product?: BillingProduct;
  onSubmit: (values: BillingProductFormValues) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: BillingProductSchema = {
  name: "",
  price: 0,
  credit: 0,
  bonusCredit: 0,
  platform: "IOS",
  status: "ON_SALE",
};

const BillingProductFormModal = ({
  isOpen,
  onClose,
  product,
  onSubmit,
  isSubmitting,
}: BillingProductFormModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BillingProductSchema>({
    resolver: zodResolver(billingProductSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 상품 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    reset(
      product
        ? {
            name: product.name,
            price: product.price,
            credit: product.credit,
            bonusCredit: product.bonusCredit,
            platform: product.platform,
            status: product.status,
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, product, reset]);

  const values = watch();
  const totalCredit = (values.credit || 0) + (values.bonusCredit || 0);
  // 크레딧 1개당 실제 결제 단가. 상품 간 가격 균형을 확인하는 용도다.
  const unitPrice = totalCredit > 0 ? Math.round(values.price / totalCredit) : 0;

  const submit = handleSubmit((formValues) => onSubmit(formValues));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? "상품 수정" : "상품 추가"}
      description="결제 금액은 원 단위 정수, 크레딧은 정수로만 입력합니다."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            {product ? "수정" : "추가"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-1">
        <FormField
          label="상품명"
          htmlFor="product-name"
          required
          error={errors.name?.message}
        >
          <Input
            id="product-name"
            placeholder="크레딧 300"
            hasError={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>

        <FormField
          label="플랫폼"
          htmlFor="product-platform"
          required
          error={errors.platform?.message}
          hint="스토어별로 상품을 따로 등록합니다."
        >
          <Select
            id="product-platform"
            options={PRODUCT_PLATFORM_OPTIONS}
            hasError={Boolean(errors.platform)}
            {...register("platform")}
          />
        </FormField>

        <FormField
          label="결제 금액"
          htmlFor="product-price"
          required
          error={errors.price?.message}
          hint="원 단위 정수"
        >
          <Input
            id="product-price"
            type="number"
            min={0}
            step={100}
            placeholder="3500"
            className="tabular-nums"
            hasError={Boolean(errors.price)}
            {...register("price", { valueAsNumber: true })}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="지급 크레딧"
            htmlFor="product-credit"
            required
            error={errors.credit?.message}
          >
            <Input
              id="product-credit"
              type="number"
              min={0}
              step={1}
              placeholder="300"
              className="tabular-nums"
              hasError={Boolean(errors.credit)}
              {...register("credit", { valueAsNumber: true })}
            />
          </FormField>

          <FormField
            label="보너스 크레딧"
            htmlFor="product-bonus-credit"
            required
            error={errors.bonusCredit?.message}
          >
            <Input
              id="product-bonus-credit"
              type="number"
              min={0}
              step={1}
              placeholder="15"
              className="tabular-nums"
              hasError={Boolean(errors.bonusCredit)}
              {...register("bonusCredit", { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <FormField
          label="노출 상태"
          htmlFor="product-status"
          required
          error={errors.status?.message}
        >
          <Select
            id="product-status"
            options={PRODUCT_STATUS_OPTIONS}
            hasError={Boolean(errors.status)}
            {...register("status")}
          />
        </FormField>

        {/* 저장 전에 최종 지급 구성을 한 번 더 확인할 수 있게 요약을 둔다. */}
        <dl className="flex items-center justify-between gap-4 rounded-field border border-border-main bg-subtle px-4 py-3 body-5">
          <div className="flex items-center gap-2">
            <dt className="text-font-2">총 지급 크레딧</dt>
            <dd className="font-semibold text-font-1 tabular-nums">
              {formatCredit(totalCredit)}
            </dd>
          </div>

          <div className="flex items-center gap-2">
            <dt className="text-font-2">크레딧당 단가</dt>
            <dd className="font-semibold text-font-1 tabular-nums">
              {unitPrice > 0 ? formatCurrency(unitPrice) : "-"}
            </dd>
          </div>
        </dl>
      </form>
    </Modal>
  );
};

export default BillingProductFormModal;
