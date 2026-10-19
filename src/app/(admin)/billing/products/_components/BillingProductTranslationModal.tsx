"use client";

import { useState } from "react";
import {
  useBillingProductTranslationMutation,
  useBillingProductTranslationsQuery,
  type BillingProductTranslationLanguage,
} from "@/api/billing/billingProductTranslation";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import type { BillingProduct } from "@/type/billing";
import {
  SERVICE_LANGUAGES,
  SERVICE_LANGUAGE_LABEL,
  type ServiceLanguage,
} from "@/type/language";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import Textarea from "@/components/ui/Textarea";

/** 서버 검증과 같은 길이 제한. */
const NAME_MAX = 30;
const DESCRIPTION_MAX = 200;

interface BillingProductTranslationModalProps {
  /** null이면 닫힌 상태다. */
  product: BillingProduct | null;
  onClose: () => void;
}

/**
 * 상품 하나의 언어별 상품명 · 설명.
 *
 * 법적 고지 번역과 같은 구조다. 한국어는 상품 원문이라 여기서는 읽기만 하고 상품 수정에서 고친다.
 * 번역이 없는 언어는 결제 화면에 한국어가 보인다.
 */
const BillingProductTranslationModal = ({
  product,
  onClose,
}: BillingProductTranslationModalProps) => {
  const canWrite = useHasPermission("billingProduct:write");
  const canDelete = useHasPermission("billingProduct:delete");
  const { data: translations = [], isLoading } =
    useBillingProductTranslationsQuery(product?.productId);
  const { saveMutation, deleteMutation } =
    useBillingProductTranslationMutation();

  const [tab, setTab] = useState<ServiceLanguage>("KO");
  // 편집 중인 언어와 초안. 탭을 옮기거나 다른 상품을 열면 편집을 접는다.
  const [editing, setEditing] =
    useState<BillingProductTranslationLanguage | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [openedProductId, setOpenedProductId] = useState(product?.productId);

  if (product?.productId !== openedProductId) {
    setOpenedProductId(product?.productId);
    setTab("KO");
    setEditing(null);
  }

  const translationOf = (language: ServiceLanguage) =>
    translations.find((item) => item.language === language);

  const tabs: TabItem<ServiceLanguage>[] = SERVICE_LANGUAGES.map(
    (language) => ({
      label:
        language === "KO"
          ? "한국어 원문"
          : translationOf(language)
            ? SERVICE_LANGUAGE_LABEL[language]
            : `${SERVICE_LANGUAGE_LABEL[language]} · 없음`,
      value: language,
    }),
  );

  const handleTabChange = (next: ServiceLanguage) => {
    setTab(next);
    setEditing(null);
  };

  const startEditing = (language: BillingProductTranslationLanguage) => {
    const current = translationOf(language);

    setEditing(language);
    setDraftName(current?.name ?? "");
    setDraftDescription(current?.description ?? "");
  };

  const name = draftName.trim();
  const description = draftDescription.trim();
  const draftError =
    name.length === 0
      ? "상품명을 입력해 주세요."
      : name.length > NAME_MAX
        ? `상품명은 ${NAME_MAX}자 이하여야 합니다.`
        : description.length > DESCRIPTION_MAX
          ? `설명은 ${DESCRIPTION_MAX}자 이하여야 합니다.`
          : null;

  const handleSave = (language: BillingProductTranslationLanguage) => {
    if (!product || draftError) return;

    saveMutation.mutate(
      { productId: product.productId, language, name, description },
      { onSuccess: () => setEditing(null) },
    );
  };

  const handleDelete = (language: BillingProductTranslationLanguage) => {
    if (!product) return;

    openConfirm({
      title: `${SERVICE_LANGUAGE_LABEL[language]} 번역을 지울까요?`,
      description:
        "지우면 이 언어 유저에게는 결제 화면에 한국어 상품명 · 설명이 보입니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () =>
        deleteMutation.mutateAsync({ productId: product.productId, language }),
    });
  };

  const renderReadonly = (itemName: string, itemDescription: string) => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="body-6 text-font-2">상품명</p>
        <p className="body-4 text-font-1">{itemName}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="body-6 text-font-2">설명</p>
        <p className="body-4 whitespace-pre-wrap text-font-1">
          {itemDescription || <span className="text-font-disabled">-</span>}
        </p>
      </div>
    </div>
  );

  const renderTranslation = (language: BillingProductTranslationLanguage) => {
    const label = SERVICE_LANGUAGE_LABEL[language];
    const translation = translationOf(language);

    if (editing === language) {
      return (
        <div className="flex flex-col gap-3">
          <FormField
            label="상품명"
            htmlFor="product-translation-name"
            required
            hint={`${draftName.length}/${NAME_MAX}`}
          >
            <Input
              id="product-translation-name"
              value={draftName}
              maxLength={NAME_MAX}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder={product?.name}
            />
          </FormField>
          <FormField
            label="설명"
            htmlFor="product-translation-description"
            hint={`${draftDescription.length}/${DESCRIPTION_MAX}`}
          >
            <Textarea
              id="product-translation-description"
              rows={3}
              value={draftDescription}
              maxLength={DESCRIPTION_MAX}
              onChange={(event) => setDraftDescription(event.target.value)}
              placeholder={product?.description}
            />
          </FormField>
          <div className="flex items-center justify-between gap-2">
            <span className="body-6 text-font-2">{draftError ?? ""}</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                취소
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSave(language)}
                disabled={Boolean(draftError)}
                isLoading={saveMutation.isPending}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (!translation) {
      return (
        <EmptyState
          title={`${label} 번역이 없습니다.`}
          description="지금은 이 언어 유저에게 한국어 상품명 · 설명이 보입니다."
          action={
            canWrite && (
              <Button variant="primary" onClick={() => startEditing(language)}>
                번역 추가
              </Button>
            )
          }
        />
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {(canWrite || canDelete) && (
          <div className="flex justify-end gap-2">
            {canDelete && (
              <Button variant="ghost" onClick={() => handleDelete(language)}>
                삭제
              </Button>
            )}
            {canWrite && (
              <Button
                variant="secondary"
                onClick={() => startEditing(language)}
              >
                수정
              </Button>
            )}
          </div>
        )}
        {renderReadonly(translation.name, translation.description)}
      </div>
    );
  };

  const original = translationOf("KO");

  return (
    <Modal
      isOpen={product !== null}
      onClose={onClose}
      title="상품 번역"
      description={product ? `${product.name} · ${product.code}` : undefined}
      size="md"
      isDirty={editing !== null}
    >
      {product && (
        <div className="flex flex-col gap-4">
          <Tabs items={tabs} value={tab} onChange={handleTabChange} />

          {tab === "KO" && (
            <Alert tone="info" title="한국어는 상품 원문입니다.">
              한국어 상품명 · 설명은 상품 수정에서 고칩니다. 번역이 없는 언어는
              결제 화면에 한국어가 보입니다.
            </Alert>
          )}

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))}
            </div>
          ) : tab === "KO" ? (
            renderReadonly(
              original?.name ?? product.name,
              original?.description ?? product.description,
            )
          ) : (
            renderTranslation(tab)
          )}
        </div>
      )}
    </Modal>
  );
};

export default BillingProductTranslationModal;
