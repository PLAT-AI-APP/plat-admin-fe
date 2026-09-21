# 어드민 환불 승인 화면 + plat-be 변경 요청

## Context

plat-be에서 결제(카카오페이 우선)를 개발하고 있고, 어드민에서 **유저 환불 요청을 받아 승인하거나 거절**할 수 있어야 한다.
plat-be는 조회만 했고 수정하지 않았다. 조회 결과, 현재 BE는 유저가 요청하는 순간 노트 회수와 PG 취소까지 **즉시** 처리한다(`PaymentRefundService.requestRefund`). 승인 단계와 어드민 환불 API는 아직 없다.

### 합의된 정책 (대화에서 확정)

| 항목 | 결정 |
|---|---|
| 흐름 | 유저 요청 → `REQUESTED`(승인 대기) → 관리자 승인이면 노트 회수 + PG 취소 / 관리자 거절 |
| 신청 시 검증 | 결제 CAPTURED, 결제 후 7일 이내(`refund-expiration: P7D`), 노트 미사용, 전액만, 주문당 열린 환불 1건. 통과하면 금액·노트 수를 스냅샷으로 남긴다 |
| 노트 동결 | **하지 않는다.** credit 상태를 늘리지 않는다 |
| 승인 시 사용 여부 | 신청 뒤 노트를 썼으면 **자동 거절**. `REJECTED` + 사유 코드 `CREDIT_USED`, 유저 문구 "크레딧을 사용하여 환불이 거절되었습니다" |
| 7일 기한 | **신청 시점 기준.** 승인이 늦어져도 기한 만료로 거절하지 않는다 |
| 진행 중 채팅(크레딧 예약) | 거절하지 않는다. 409와 함께 "유저에게 완료되지 않은 채팅이 있어 크레딧이 예약 중입니다. 채팅이 끝난 뒤 다시 승인해 주세요." 환불 건은 `REQUESTED`로 남는다 |
| PG 구분 | 주문의 `pg_provider`로 구분한다(이미 있음). 취소는 결제에 쓴 PG로 나간다. 화면은 PG 공통 필드명만 쓰고 카카오 전용 이름(tid/aid)은 쓰지 않는다 |
| 범위 밖 | 관리자 직권 환불, 부분 환불, 사이드바 대기 배지(`/admin/ops/pending-counts`가 실서버에 없음) |

---

## Part A. admin-fe 구현

### A1. 권한 · 메뉴
- `src/type/permission.ts`
  - `PermissionResource`에 `"refund"`(actions `read`, `adjust`, `isSensitive`)와 `"payment"`(`read`)를 추가한다. BE `AdminResource`에 이미 있는 키이고, FE에 없으면 직책 편집에서 부여할 수 없다.
  - `refund`는 `money` 갈래에, `payment`는 `record` 갈래에 넣는다.
- `src/constants/menu.tsx`: `billing` 그룹에 "환불 관리" `/billing/refunds`를 추가한다. 권한은 `refund:read`, 아이콘은 기존 `@/icons`에서 고른다.

### A2. 타입 · 상수
- `src/type/billing.ts`에 추가한다.
  - `RefundStatus = "REQUESTED" | "PROCESSING" | "COMPLETED" | "FAILED" | "REJECTED"`
  - `ClawbackStatus`
  - `RefundRejectReasonCode = "CREDIT_USED" | "ADMIN"`
  - `RefundReasonCode`
  - **`PaymentPgProvider = "TOSS" | "KAKAO_PAY" | "INICIS" | "NICE"`**: BE enum과 같은 값이다. 기존 `PgProvider`(KAKAOPAY/TOSSPAY…)는 보존 원장 MOCK 전용이라 건드리지 않는다.
  - `RefundListItem`, `RefundDetail`(주문 스냅샷과 `pgTransactions[]` 포함). ID(`refundId`, `userId`, `paymentOrderId`)는 **문자열**로 둔다(Snowflake).
- `src/constants/billingOptions.ts`: 상태·거절 사유·PG 라벨/톤 맵과 필터 옵션을 추가한다. 기존 `ADJUSTMENT_TYPE_*` 패턴을 따른다.

### A3. API 훅 (`src/api/billing/`, `liveAxios`)
기존 `getCreditAdjustmentList.ts`의 `toPageRequest`, `toPageResponse`, `PageWith` 패턴을 그대로 쓴다.
- `getRefundList.ts`: `GET /admin/refunds`, `useRefundListQuery`
- `getRefundSummary.ts`: `GET /admin/refunds/summary`(상태별 건수, 탭 배지용)
- `getRefundDetail.ts`: `GET /admin/refunds/{refundId}`
- `mutateRefund.ts`
  - `useApproveRefundMutation`: `POST .../approve`
  - `useRejectRefundMutation`: `POST .../reject {reason}`
  - 성공하면 list·summary·detail 쿼리를 무효화한다.
  - 승인 응답의 `status`가 `REJECTED`면 오류가 아니라 "크레딧 사용으로 자동 거절됨"으로 토스트를 띄운다.

### A4. 목록 화면 `src/app/(admin)/billing/refunds/`
- `page.tsx`: `PageHeader`와 `Suspense`로 감싼 `RefundManager`. `credit-adjustments/page.tsx`와 같은 구조다.
- `_components/RefundManager.tsx`: `useListParams`로 주소에 목록 조건을 싣는다.
  - 상태 탭: 승인 대기(건수) / 처리 중 / 완료 / 거절 / 실패
  - 필터: PG, 기간, 검색어(주문번호·환불번호·유저 ID·닉네임)
  - 열: 요청일, 유저(`userId` 링크. creatorId 아님), 주문번호, 상품, 결제 금액, 회수 노트, PG/결제수단, 요청 사유, 상태 배지(+회수 상태), **"신청 후 사용됨"·"채팅 진행 중" 경고 배지**, 처리자
  - 행을 누르면 상세로 간다(새 탭 열기 지원). CSV 내보내기는 `CsvExportButton`과 `CsvColumn`으로 한다.

### A5. 상세 화면 `src/app/(admin)/billing/refunds/[refundId]/`
- `RefundDetailView.tsx`: 기존 `components/detail/DetailSection` 계열을 재사용한다.
  - 주문 스냅샷: 결제 금액, 결제일, 환불 기한, PG, PG 거래번호, 결제수단
  - 환불 정보: 환불번호, 요청 사유, 요청일, 상태, 노트 회수 상태, 처리자, 결정일, 거절 사유 코드/문구
  - PG 거래 이력 표: 유형(CONFIRM/CANCEL/INQUIRY), 결과, 금액, `pgCode`/`pgMessage`, 시각
  - 경고 `Alert`
    - 신청 후 사용됨: 승인하면 자동 거절된다고 안내한다.
    - 채팅 진행 중: 409 문구와 같은 내용이다.
    - `FAILED`이면서 회수 `DONE`: "노트만 회수되고 돈은 돌아가지 않았다. 수동 복구가 필요하다."
    - `PROCESSING`: "PG 결과 확인 중이며 배치가 재확인한다."
- 액션은 `refund:adjust` 권한이 있고 `REQUESTED`일 때만 보인다(`useHasPermission`).
  - **승인**: `openConfirm`으로 "PG(카카오페이 등)로 N원이 취소되고 노트 M개가 회수됩니다. 되돌릴 수 없습니다."를 띄운 뒤 실행한다.
  - **거절**: `RefundRejectModal.tsx`. `CommentHideModal` 패턴을 따르며 사유 입력이 필수이고 프리셋을 둔다. "사유는 유저에게 보입니다"라고 안내한다.
- 오류 처리(`AppError.code` 기준)
  - 409 이미 처리됨: 알림을 띄우고 새로 읽는다.
  - 409 채팅 진행 중: 위 문구를 보여 준다.
  - 422: 서버 메시지를 그대로 보여 준다.
  - 5xx·PG 판정 불가: 새로 읽은 뒤 상태 배지로 안내한다.

### A6. 유저 상세 연결 (선택, 작게)
- `users/[userId]/_components/UserBillingPanel.tsx`에 "환불 내역 보기" 링크(`/billing/refunds?keyword={userId}`)를 단다. 목록 API의 `userId` 파라미터를 재사용한다.

---

## Part B. plat-be 변경 요청 (FE가 기대는 계약, 수정은 BE 담당)

1. **상태와 컬럼**
   - `RefundStatus`에 `REJECTED`를 추가한다. `REQUESTED`는 "승인 대기"라는 뜻으로 쓴다.
   - `refunds`에 `reject_reason_code VARCHAR(20)`(`CREDIT_USED`/`ADMIN`), `reject_reason VARCHAR(255)`, `decided_at TIMESTAMP(6)` 컬럼을 추가한다.
   - `processed_by`는 승인·거절한 관리자다.
2. **⚠️ 재개 배치 대상 축소.** `RefundPersistenceAdapter.findStale`이 지금 `REQUESTED`까지 잡아 `resume()`을 돌린다. 이대로면 **관리자 승인 없이 환불이 나간다.** `PROCESSING`만 대상으로 좁혀야 한다.
3. **유저 요청은 접수만 한다** (`PaymentRefundService.requestRefund`).
   - CAPTURED, 7일, 전액, 열린 환불 없음을 검사한다. **미사용 여부는 credit 쪽 읽기 전용 검사**로 확인한다(새 포트 예: `CreditGrantPort.checkRefundable(userId, orderUid)`가 `EXPIRED`/`ALREADY_USED`/`INVALID_SOURCE`를 던진다).
   - `REQUESTED`로 저장만 하고 회수와 PG 호출은 하지 않는다.
   - 응답의 하드코딩된 `RefundStatus.COMPLETED`를 실제 상태로 바꾼다.
4. **승인** `approve(refundId, adminId)`
   - 주문을 잠그고 `REQUESTED`인지 확인한다. 아니면 409 `PAYMENT_REFUND_ALREADY_DECIDED`.
   - `processedBy`와 `decidedAt`을 기록하고 기존 `process()`(회수 → PG 취소)를 태운다.
   - 회수에서 `CREDIT_REFUND_ALREADY_USED`가 나오면 **예외로 올리지 않고** `REJECTED(CREDIT_USED)`로 확정한 뒤 200으로 결과를 돌려준다. 지금은 `transactions.reject()`로 `FAILED`를 적고 422를 던진다.
   - 회수에서 `LOCKED_RESERVATION`이 나오면 상태는 `REQUESTED`로 두고 **409 전용 코드**(예: `PAYMENT_REFUND_CHAT_IN_PROGRESS`)를 던진다. 문구는 합의안대로다. 기존 `credit.refund.error.lockedReservation` 문구는 이유가 모호하다.
   - **기한 검사는 신청 시점 기준으로 한다.** `CreditPoolRepositoryImpl.refund`가 `now`로 `EXPIRED`를 다시 검사해서, 6일째 신청한 건을 8일째 승인하면 막힌다. `RefundCreditCommand`에 `requestedAt`을 넣어 `requestedAt < refundableUntil`로 판정하게 한다.
5. **거절** `reject(refundId, adminId, reason)`: `REQUESTED`에서 `REJECTED(ADMIN)`으로 바꾼다. 409 규칙은 승인과 같다. 동결이 없으므로 credit 쪽 작업은 없다.
6. **유저에게 거절 사유 노출**
   - 알림 시스템은 아직 뼈대뿐이다(`NotificationEventListener`가 로그만 남긴다).
   - 우선 유저 결제 조회 `GET /payments/orders/{orderUid}`(`PaymentOrderResponse`)에 최신 환불의 `status`, `rejectReasonCode`, `rejectReason`을 싣는다. `CREDIT_USED`는 서버 메시지 키로 "크레딧을 사용하여 환불이 거절되었습니다"를 내려준다.
   - 푸시/알림은 알림 기능이 생길 때 붙인다.
7. **어드민 API** (`plat-boot/admin/billing/RefundAdminController`, `AdminCreditController` 패턴을 따르고 `PageWith`를 쓴다)
   - `GET /admin/refunds?status&pgProvider&keyword&userId&startDate&endDate&page&size` (`refund:read`)
     - `@ModelAttribute` 레코드에 boolean 필터를 넣으면 `@Nullable Boolean`으로 받는다.
   - `GET /admin/refunds/summary`: 상태별 건수 (`refund:read`)
   - `GET /admin/refunds/{refundId}` (`refund:read`): 환불 + 주문 스냅샷 + 유저 닉네임 + `PaymentTransaction` 이력(`type`, `result`, `amountMinor`, `pgCode`, `pgMessage`, `requestedAt`, `approvedAt`). `pgRaw`는 제외한다.
   - `POST /admin/refunds/{refundId}/approve` (`refund:adjust`): 결과 `status`를 돌려준다(`COMPLETED`/`PROCESSING`/`REJECTED`).
   - `POST /admin/refunds/{refundId}/reject {reason}` (`refund:adjust`)
   - 목록과 상세 공통 필드
     - `creditUsedSinceRequest`: 풀의 remaining < total
     - `chatInProgress`: 지갑의 `lockedBalance > 0`
   - ID(`refundId`, `paymentOrderId`, `userId`)는 문자열로 내려준다.
8. **카카오페이 어댑터 주의점** (추상화 `PgCancelCommand`/`PgCancelSnapshot`는 유지)
   - 카카오 취소에는 **멱등키가 없다.** `idempotencyKey`는 토스를 전제로 만들어졌다. 카카오는 `refundUid`를 `payload`에 싣는다. 판정 불가 뒤 재시도 전에는 주문 조회(`/online/v1/payment/order`)의 `payment_action_details`에 CANCEL이 있는지 먼저 확인해야 이중 취소를 막는다.
   - `cancel_tax_free_amount`는 필수이고, 승인 때 보낸 `vat`는 취소 때도 같게 보내야 한다. `PgCancelCommand`에 세금 필드를 추가하거나 어댑터가 `taxPolicyCode`에서 계산한다.
   - `cancel_available_amount`를 함께 보내 금액 불일치를 PG 쪽에서 막는다.
   - 실패 응답(`error_code`, `extras.method_result_code/message`)은 `pgCode`/`pgMessage`로 정규화한다.
9. **에러 코드 등록.** 새 코드(`ALREADY_DECIDED`, `CHAT_IN_PROGRESS`)는 `messages_ko.properties`, `docs/11-Error-Code-Reference.md`, `ErrorCodeContractTest`(src/test는 BE 담당 승인이 필요하다)에 등록한다.

---

## 산출물 순서
1. Part A와 B를 spec 문서로 커밋한다: `docs/superpowers/specs/2026-09-21-admin-refund-approval-design.md`.
2. Part B를 사용자에게 한 번에 전달한다(최종 메시지).
3. Part A를 구현한다: A1 → A2 → A3 → A4 → A5 → A6 순서, 기존 파일 패턴을 따른다.

## 검증
- `npx tsc --noEmit`, `npm run lint`
- `next build`는 dev 서버를 죽이지 않도록 사본 + node_modules 하드링크로 확인한다(메모리 절차).
- BE API가 아직 없고 `liveAxios`라 MSW 목업을 쓸 수 없다. 또 브라우저 패널에는 서비스 워커가 없다. 그래서 **화면 동작 검증은 BE 준비 후** 실서버 어드민 검증 절차로 한다: 3000 포트 주인 확인 → 로그인은 사용자에게 부탁 → 목록 탭·필터 → 상세 → 승인·거절·자동 거절·409 문구 확인.
- 그 전에는 권한 없는 계정에서 메뉴와 버튼이 숨는지, 새 권한 키가 직책 편집 화면에 나오는지를 로컬에서 확인한다.
