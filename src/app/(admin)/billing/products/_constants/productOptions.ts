import type { ProductPlatform, ProductStatus } from "@/type/billing";
import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";

/** 플랫폼 표기 — 스토어 명칭을 그대로 쓴다. */
export const PRODUCT_PLATFORM_LABEL: Record<ProductPlatform, string> = {
  IOS: "iOS",
  AOS: "Android",
  WEB: "Web",
};

export const PRODUCT_PLATFORM_TONE: Record<ProductPlatform, BadgeTone> = {
  IOS: "neutral",
  AOS: "info",
  WEB: "brand",
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  ON_SALE: "판매 중",
  HIDDEN: "숨김",
  ENDED: "판매 종료",
};

export const PRODUCT_STATUS_TONE: Record<ProductStatus, BadgeTone> = {
  ON_SALE: "success",
  HIDDEN: "warning",
  ENDED: "neutral",
};

export const PRODUCT_PLATFORM_OPTIONS: SelectOption[] = (
  Object.keys(PRODUCT_PLATFORM_LABEL) as ProductPlatform[]
).map((platform) => ({
  label: PRODUCT_PLATFORM_LABEL[platform],
  value: platform,
}));

export const PRODUCT_STATUS_OPTIONS: SelectOption[] = (
  Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[]
).map((status) => ({
  label: PRODUCT_STATUS_LABEL[status],
  value: status,
}));
