"use client";

import { useState } from "react";
import { useBillingProductListQuery } from "@/api/billing/getBillingProductList";
import { useBillingProductMutation } from "@/api/billing/mutateBillingProduct";
import { Edit, Package, Plus } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatCredit, formatCurrency } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type {
  BillingProduct,
  BillingProductFormValues,
  ProductPlatform,
  ProductStatus,
} from "@/type/billing";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import IconButton from "@/components/ui/IconButton";
import Table, {
  TableCellStack,
  type TableColumn,
} from "@/components/ui/Table";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import BillingProductFormModal from "./BillingProductFormModal";
import {
  PRODUCT_PLATFORM_LABEL,
  PRODUCT_PLATFORM_TONE,
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_TONE,
} from "./productOptions";

const STATUS_ORDER: ProductStatus[] = ["ON_SALE", "HIDDEN", "ENDED"];

/** 플랫폼 탭. 상품이 스토어별로 나뉘어 있어 한 화면에 다 쌓으면 비교가 어렵다. */
type PlatformTab = ProductPlatform | "ALL";

const PLATFORM_TAB_ORDER: PlatformTab[] = ["ALL", "WEB", "IOS", "AOS"];

const BillingProductManager = () => {
  const { data, isLoading } = useBillingProductListQuery();
  const { createMutation, updateMutation, statusMutation } =
    useBillingProductMutation();

  const [editingProduct, setEditingProduct] = useState<BillingProduct | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [platformTab, setPlatformTab] = useState<PlatformTab>("ALL");

  const products = data ?? [];

  const visibleProducts =
    platformTab === "ALL"
      ? products
      : products.filter((product) => product.platform === platformTab);

  const platformTabs: TabItem<PlatformTab>[] = PLATFORM_TAB_ORDER.map((tab) => ({
    label: tab === "ALL" ? "전체" : PRODUCT_PLATFORM_LABEL[tab],
    value: tab,
    count:
      tab === "ALL"
        ? products.length
        : products.filter((product) => product.platform === tab).length,
  }));

  /** 새 상품은 목록 맨 뒤에 붙인다. 서버와 같은 규칙(마지막 순서 + 10)이다. */
  const nextSortOrder =
    products.reduce((max, product) => Math.max(max, product.sortOrder), 0) + 10;

  const handleOpenCreate = () => {
    setEditingProduct(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: BillingProduct) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: BillingProductFormValues) => {
    if (editingProduct) {
      updateMutation.mutate(
        { productId: editingProduct.productId, values },
        { onSuccess: () => setIsFormOpen(false) },
      );
      return;
    }

    createMutation.mutate(values, { onSuccess: () => setIsFormOpen(false) });
  };

  /** 판매 종료는 되돌리기 부담이 크므로 확인 다이얼로그를 거친다. */
  const handleChangeStatus = (product: BillingProduct, status: ProductStatus) => {
    if (status !== "ENDED") {
      statusMutation.mutate({ productId: product.productId, status });
      return;
    }

    openConfirm({
      title: "상품 판매를 종료할까요?",
      description: `'${product.name}' 상품이 결제 화면에서 즉시 사라집니다.`,
      warning: "이미 결제한 유저의 크레딧에는 영향을 주지 않습니다.",
      confirmText: "판매 종료",
      tone: "danger",
      onConfirm: () =>
        statusMutation.mutateAsync({ productId: product.productId, status }),
    });
  };

  const columns: TableColumn<BillingProduct>[] = [
    {
      key: "name",
      header: "상품명",
      width: "220px",
      render: (product) => (
        <TableCellStack
          primary={product.name}
          secondary={`#${product.productId} · ${product.code}`}
        />
      ),
    },
    {
      key: "description",
      header: "설명",
      width: "200px",
      render: (product) => (
        <span className="line-clamp-2 text-font-2">{product.description}</span>
      ),
    },
    // 특정 플랫폼 탭에서는 모든 행이 같은 값이라 열을 뺀다.
    ...(platformTab === "ALL"
      ? [
          {
            key: "platform",
            header: "플랫폼",
            width: "110px",
            render: (product: BillingProduct) => (
              <Badge tone={PRODUCT_PLATFORM_TONE[product.platform]}>
                {PRODUCT_PLATFORM_LABEL[product.platform]}
              </Badge>
            ),
          },
        ]
      : []),
    {
      key: "amountMinor",
      header: "결제 금액",
      align: "right",
      numeric: true,
      render: (product) => formatCurrency(product.amountMinor),
    },
    {
      key: "credit",
      header: "지급 크레딧",
      align: "right",
      numeric: true,
      render: (product) => formatCredit(product.credit),
    },
    {
      key: "bonusCredit",
      header: "보너스 크레딧",
      align: "right",
      numeric: true,
      render: (product) =>
        product.bonusCredit > 0 ? (
          <span className="text-success">
            +{formatCredit(product.bonusCredit)}
          </span>
        ) : (
          <span className="text-font-disabled">-</span>
        ),
    },
    {
      key: "totalCredit",
      header: "총 크레딧",
      align: "right",
      numeric: true,
      render: (product) => (
        <span className="font-semibold">
          {formatCredit(product.credit + product.bonusCredit)}
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      width: "110px",
      render: (product) => (
        <Badge tone={PRODUCT_STATUS_TONE[product.status]}>
          {PRODUCT_STATUS_LABEL[product.status]}
        </Badge>
      ),
    },
    {
      key: "sortOrder",
      header: "순서",
      width: "70px",
      align: "right",
      numeric: true,
      render: (product) => (
        <span className="text-font-2">{product.sortOrder}</span>
      ),
    },
    {
      key: "updatedAt",
      header: "수정일",
      width: "150px",
      numeric: true,
      render: (product) => (
        <span className="text-font-2">{formatDateTime(product.updatedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "88px",
      align: "right",
      render: (product) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            label="수정"
            icon={<Edit size={16} />}
            onClick={() => handleOpenEdit(product)}
          />

          <Dropdown
            items={STATUS_ORDER.filter((status) => status !== product.status).map(
              (status) => ({
                label: `${PRODUCT_STATUS_LABEL[status]}로 변경`,
                tone: status === "ENDED" ? "danger" : "default",
                onSelect: () => handleChangeStatus(product, status),
              }),
            )}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Card
        title={`상품 ${visibleProducts.length}건`}
        description="결제 금액과 지급 크레딧 구성을 관리합니다. 금액은 원 단위 정수입니다."
        action={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={handleOpenCreate}
          >
            상품 추가
          </Button>
        }
        noPadding
      >
        <Tabs
          items={platformTabs}
          value={platformTab}
          onChange={setPlatformTab}
          className="px-5"
        />

        <Table
          columns={columns}
          rows={visibleProducts}
          getRowKey={(product) => String(product.productId)}
          isLoading={isLoading}
          skeletonRows={6}
          emptyTitle={
            platformTab === "ALL"
              ? "등록된 상품이 없습니다."
              : `${PRODUCT_PLATFORM_LABEL[platformTab]} 상품이 없습니다.`
          }
          emptyDescription="첫 크레딧 상품을 추가해 결제 화면을 구성해 보세요."
          emptyAction={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              상품 추가
            </Button>
          }
        />
      </Card>

      <Card title="상품 구성 안내">
        <div className="flex items-start gap-2.5 body-5 text-font-2">
          <Package size={18} className="mt-px shrink-0 text-font-disabled" />
          <p>
            총 크레딧은 지급 크레딧과 보너스 크레딧의 합입니다. 스토어 심사 정책상
            iOS·Android는 결제 금액을 스토어 등록 금액과 반드시 일치시켜야 합니다.
          </p>
        </div>
      </Card>

      <BillingProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={editingProduct}
        defaultSortOrder={nextSortOrder}
        defaultPlatform={platformTab === "ALL" ? "IOS" : platformTab}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default BillingProductManager;
