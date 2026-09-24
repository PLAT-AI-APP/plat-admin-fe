"use client";

import { useState } from "react";
import {
  useEarningPoliciesQuery,
  useRewardProductListQuery,
} from "@/api/earning/getEarningPolicy";
import {
  useChangeEarningPolicyMutation,
  useRewardProductMutation,
} from "@/api/earning/mutateEarning";
import { formatDateTime } from "@/lib/dayjs";
import { resolveImageUrl } from "@/lib/imageUrl";
import { formatWithCommas } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import type {
  EarningPolicy,
  EarningPolicyValues,
  RewardProduct,
  RewardProductFormValues,
} from "@/type/earning";
import ProductThumb from "@/components/earning/ProductThumb";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Switch from "@/components/ui/Switch";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import Textarea from "@/components/ui/Textarea";

const POLICY_FIELDS = [
  { key: "shareBps", label: "배분 비율", unit: "%", toInput: (v: number) => String(v / 100), fromInput: (v: string) => Math.round(Number(v) * 100) },
  { key: "noteUnitPrice", label: "노트 기준가", unit: "원", toInput: String, fromInput: Number },
  { key: "minRedeemAmount", label: "상품권 최소 교환", unit: "P", toInput: String, fromInput: Number },
  { key: "validYears", label: "포인트 유효기간", unit: "년", toInput: String, fromInput: Number },
] as const;

type PolicyKey = (typeof POLICY_FIELDS)[number]["key"];

const HISTORY_COLUMNS: TableColumn<EarningPolicy>[] = [
  { key: "effectiveFrom", header: "적용 시작", width: "150px", numeric: true, render: (row) => <span className="text-font-2">{formatDateTime(row.effectiveFrom)}</span> },
  { key: "shareBps", header: "비율", align: "right", numeric: true, render: (row) => `${row.shareBps / 100}%` },
  { key: "unit", header: "기준가", align: "right", numeric: true, render: (row) => `${row.noteUnitPrice}원` },
  { key: "min", header: "최소 교환", align: "right", numeric: true, render: (row) => `${formatWithCommas(row.minRedeemAmount)}P` },
  { key: "valid", header: "유효기간", align: "right", numeric: true, render: (row) => `${row.validYears}년` },
  { key: "memo", header: "사유", render: (row) => <TableCellStack primary={row.memo ?? "-"} secondary={row.changedByName} /> },
];

interface ProductDraft extends RewardProductFormValues {
  productId?: string;
}

const EMPTY_PRODUCT: ProductDraft = { name: "", pointPrice: 5000, active: true, sortOrder: 0 };

const toDraft = (product: RewardProduct): ProductDraft => ({
  productId: product.productId,
  name: product.name,
  imageFileId: product.imageFileId,
  pointPrice: product.pointPrice,
  active: product.active,
  sortOrder: product.sortOrder,
});

const EarningPolicyManager = () => {
  const { data: policies = [], isLoading: isPolicyLoading } = useEarningPoliciesQuery();
  const { data: products = [], isLoading: isProductLoading } = useRewardProductListQuery();
  const policyMutation = useChangeEarningPolicyMutation();
  const { saveMutation, activeMutation, deleteMutation } = useRewardProductMutation();

  const canWritePolicy = useHasPermission("earning:write");
  const canWriteProduct = useHasPermission("rewardProduct:write");
  const canDeleteProduct = useHasPermission("rewardProduct:delete");

  const [policyDraft, setPolicyDraft] = useState<Record<PolicyKey, string> | null>(null);
  const [policyMemo, setPolicyMemo] = useState("");
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [productDraft, setProductDraft] = useState<ProductDraft | null>(null);

  const current = policies[0];

  if (isPolicyLoading) return <Skeleton className="h-64 w-full rounded-card" />;

  const openPolicyEdit = () => {
    if (!current) return;
    setPolicyMemo("");
    setPolicyDraft(
      Object.fromEntries(POLICY_FIELDS.map((field) => [field.key, field.toInput(current[field.key])])) as Record<PolicyKey, string>,
    );
  };

  const draftPolicy = policyDraft
    ? (Object.fromEntries(POLICY_FIELDS.map((field) => [field.key, field.fromInput(policyDraft[field.key])])) as EarningPolicyValues)
    : null;
  const changedFields =
    draftPolicy && current ? POLICY_FIELDS.filter((field) => draftPolicy[field.key] !== current[field.key]) : [];

  const commonColumns = {
    image: {
      key: "image",
      header: "",
      width: "64px",
      render: (row: RewardProduct) => (
        <ProductThumb src={resolveImageUrl(row.imageUrl, row.imageFileId, "REWARD_PRODUCT", "SQ80")} />
      ),
    },
    name: { key: "name", header: "상품명", render: (row: RewardProduct) => row.name },
    price: {
      key: "price",
      header: "필요 포인트",
      align: "right" as const,
      numeric: true,
      render: (row: RewardProduct) => `${formatWithCommas(row.pointPrice)}P`,
    },
    active: {
      key: "active",
      header: "노출",
      width: "80px",
      render: (row: RewardProduct) => (
        <Switch
          checked={row.active}
          disabled={!canWriteProduct || activeMutation.isPending}
          onChange={() => activeMutation.mutate({ productId: row.productId, active: !row.active })}
          label={`${row.name} 노출`}
        />
      ),
    },
    edit: {
      key: "edit",
      header: "",
      width: "120px",
      align: "right" as const,
      render: (row: RewardProduct) => (
        <div className="flex justify-end gap-1">
          {canWriteProduct && (
            <Button size="sm" variant="ghost" onClick={() => setProductDraft(toDraft(row))}>
              수정
            </Button>
          )}
          {canDeleteProduct && (
            <Button
              size="sm"
              variant="dangerGhost"
              onClick={() =>
                openConfirm({
                  title: `${row.name}을(를) 삭제할까요?`,
                  description: "제작자 화면에서 사라집니다. 이미 들어온 교환 신청과 이력은 그대로 남습니다.",
                  confirmText: "삭제",
                  tone: "danger",
                  onConfirm: () => deleteMutation.mutateAsync(row.productId).then(() => undefined),
                })
              }
            >
              삭제
            </Button>
          )}
        </div>
      ),
    },
  };

  const giftColumns: TableColumn<RewardProduct>[] = [
    commonColumns.image,
    commonColumns.name,
    commonColumns.price,
    commonColumns.active,
    commonColumns.edit,
  ];

  const minRedeem = current?.minRedeemAmount ?? 0;

  const saveProduct = () => {
    if (!productDraft) return;
    const { productId, ...values } = productDraft;
    saveMutation.mutate({ productId, values }, { onSuccess: () => setProductDraft(null) });
  };

  return (
    <div className="flex flex-col gap-5">
      {current && (
        <Card
          title="현재 정책"
          description={`${formatDateTime(current.effectiveFrom)}부터 적용${current.changedByName ? ` · ${current.changedByName}` : ""}`}
          action={
            <>
              <Button size="sm" variant="secondary" onClick={() => setHistoryOpen(true)}>
                이력
              </Button>
              {canWritePolicy && (
                <Button size="sm" onClick={openPolicyEdit}>
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
                  {formatWithCommas(field.toInput(current[field.key]))}
                  <span className="ml-0.5 body-4 text-font-2">{field.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      <Card
        title="상품권"
        description="노트는 상품 없이 제작자가 원하는 만큼 전환합니다(노트 1개 = 노트 기준가 P)."
        noPadding
        action={
          canWriteProduct && (
            <Button size="sm" variant="secondary" onClick={() => setProductDraft(EMPTY_PRODUCT)}>
              상품 추가
            </Button>
          )
        }
      >
        <Table
          minRows={0}
          columns={giftColumns}
          rows={products}
          isLoading={isProductLoading}
          getRowKey={(row) => row.productId}
          emptyTitle="상품권이 없습니다."
        />
      </Card>

      {isHistoryOpen && (
        <Modal isOpen size="xl" onClose={() => setHistoryOpen(false)} title="정책 변경 이력">
          <Table minRows={0} columns={HISTORY_COLUMNS} rows={policies} getRowKey={(row) => row.policyId} />
        </Modal>
      )}

      {policyDraft && draftPolicy && current && (
        <Modal
          isOpen
          size="md"
          onClose={() => setPolicyDraft(null)}
          title="정책 변경"
          description="저장하는 즉시 다음 적립부터 적용됩니다."
          isDirty={changedFields.length > 0}
          footer={
            <>
              <Button variant="ghost" onClick={() => setPolicyDraft(null)}>
                취소
              </Button>
              <Button
                disabled={changedFields.length === 0 || policyMemo.trim().length === 0 || policyMutation.isPending}
                onClick={() =>
                  openConfirm({
                    title: "정책을 바로 적용할까요?",
                    description: changedFields
                      .map((field) => `${field.label}: ${field.toInput(current[field.key])}${field.unit} → ${policyDraft[field.key]}${field.unit}`)
                      .join(" · "),
                    confirmText: "적용",
                    onConfirm: () =>
                      policyMutation
                        .mutateAsync({ ...draftPolicy, memo: policyMemo.trim() })
                        .then(() => setPolicyDraft(null)),
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
                  value={policyDraft[field.key]}
                  onChange={(event) => setPolicyDraft({ ...policyDraft, [field.key]: event.target.value })}
                />
              </FormField>
            ))}
            <FormField label="변경 사유" required className="col-span-2">
              <Textarea rows={2} maxLength={200} value={policyMemo} onChange={(event) => setPolicyMemo(event.target.value)} />
            </FormField>
          </div>
        </Modal>
      )}

      {productDraft && (
        <Modal
          isOpen
          size="sm"
          onClose={() => setProductDraft(null)}
          title={`상품권 ${productDraft.productId ? "수정" : "추가"}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setProductDraft(null)}>
                취소
              </Button>
              <Button
                disabled={
                  saveMutation.isPending ||
                  productDraft.name.trim().length === 0 ||
                  productDraft.pointPrice < minRedeem
                }
                onClick={saveProduct}
              >
                저장
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <FormField label="이미지" hint="정사각형 PNG · JPG · WEBP">
              <ImageUploadField
                value={productDraft.imageFileId ?? ""}
                onChange={(fileId) => setProductDraft({ ...productDraft, imageFileId: fileId || undefined })}
                fileType="REWARD_PRODUCT"
                aspectRatio="1 / 1"
                className="w-32"
              />
            </FormField>
            <FormField label="상품명" required>
              <Input
                value={productDraft.name}
                maxLength={50}
                placeholder="네이버페이 5,000원권"
                onChange={(event) => setProductDraft({ ...productDraft, name: event.target.value })}
              />
            </FormField>
            <FormField label="필요 포인트" required hint={`최소 교환 ${formatWithCommas(minRedeem)}P 이상`}>
              <Input
                type="number"
                value={productDraft.pointPrice}
                onChange={(event) => setProductDraft({ ...productDraft, pointPrice: Number(event.target.value) })}
              />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EarningPolicyManager;
