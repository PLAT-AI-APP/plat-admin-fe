import { HttpResponse, delay, http } from "msw";
import { LIVE_BASE_URI } from "@/api/baseUri";
import type {
  BillingProduct,
  BillingProductFormValues,
  ProductStatus,
} from "@/type/billing";
import { billingProducts } from "../db/billing";
import { MOCK_DELAY_MS } from "../utils";

/*
 * 상품·결제금액 목업.
 *
 * 이 도메인은 실서버(plat-be `plat-admin`)에 연동해 두었지만, 서버를 띄우지 않고도
 * 화면을 돌릴 수 있도록 **다시 목업으로 세운다.** 그래서 목업 베이스가 아니라
 * **실서버 베이스에 등록한다** — `src/api/billing/*BillingProduct*`가 `liveAxios`로
 * 그대로 부르고, 실서버를 붙일 때는 이 파일과 handlers/index.ts의 등록 줄만 지우면 된다.
 *
 * 응답 모양은 서버 `BillingProductResponse`를 그대로 흉내 낸다.
 */

/** 카탈로그 번호는 Snowflake가 아니라 1001부터 이어 붙이는 번호다. */
const nextProductId = () =>
  billingProducts.reduce((max, product) => Math.max(max, product.productId), 1000) + 1;

const findIndexById = (productId: number) =>
  billingProducts.findIndex((product) => product.productId === productId);

const notFound = () =>
  HttpResponse.json(
    { code: "PRODUCT_NOT_FOUND", message: "상품을 찾을 수 없습니다." },
    { status: 404 },
  );

/** 서버가 저장 시점에 거는 크레딧당 단가 가드레일(3.5원 ~ 9.0원)을 목업에서도 그대로 건다. */
const unitPriceOutOfRange = (values: BillingProductFormValues) => {
  const totalCredit = values.credit + values.bonusCredit;

  if (totalCredit <= 0) return true;

  const unitPrice = values.amountMinor / totalCredit;

  return unitPrice < 3.5 || unitPrice > 9;
};

const invalidUnitPrice = () =>
  HttpResponse.json(
    {
      code: "PRODUCT_UNIT_PRICE_OUT_OF_RANGE",
      message: "크레딧당 단가가 허용 범위를 벗어났습니다.",
    },
    { status: 400 },
  );

const duplicatedCode = () =>
  HttpResponse.json(
    { code: "PRODUCT_CODE_DUPLICATED", message: "이미 사용 중인 상품 코드입니다." },
    { status: 409 },
  );

export const billingProductHandlers = [
  http.get(`${LIVE_BASE_URI}/admin/billing/products`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(
      [...billingProducts].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.productId - b.productId,
      ),
    );
  }),

  http.post(`${LIVE_BASE_URI}/admin/billing/products`, async ({ request }) => {
    const body = (await request.json()) as BillingProductFormValues;

    if (billingProducts.some((product) => product.code === body.code)) {
      return duplicatedCode();
    }
    if (unitPriceOutOfRange(body)) return invalidUnitPrice();

    const created: BillingProduct = {
      ...body,
      productId: nextProductId(),
      // 통화·세금 정책은 폼에 없다. MVP는 KRW 고정이라 서버가 채운다.
      currency: "KRW",
      updatedAt: new Date().toISOString(),
    };

    billingProducts.push(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(
    `${LIVE_BASE_URI}/admin/billing/products/:productId`,
    async ({ params, request }) => {
      const productId = Number(params.productId);
      const body = (await request.json()) as BillingProductFormValues;
      const index = findIndexById(productId);

      if (index < 0) return notFound();
      if (
        billingProducts.some(
          (product) => product.code === body.code && product.productId !== productId,
        )
      ) {
        return duplicatedCode();
      }
      if (unitPriceOutOfRange(body)) return invalidUnitPrice();

      billingProducts[index] = {
        ...billingProducts[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(billingProducts[index]);
    },
  ),

  http.patch(
    `${LIVE_BASE_URI}/admin/billing/products/:productId/status`,
    async ({ params, request }) => {
      const productId = Number(params.productId);
      const { status } = (await request.json()) as { status: ProductStatus };
      const index = findIndexById(productId);

      if (index < 0) return notFound();

      billingProducts[index] = {
        ...billingProducts[index],
        status,
        updatedAt: new Date().toISOString(),
      };

      await delay(MOCK_DELAY_MS);

      return new HttpResponse(null, { status: 204 });
    },
  ),
];
