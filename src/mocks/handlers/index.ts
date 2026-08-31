import { auditLogHandlers } from "./auditLog";
import { billingHandlers } from "./billing";
import { billingProductHandlers } from "./billingProduct";
import { characterHandlers } from "./character";
import { commentHandlers } from "./comment";
import { communicationHandlers } from "./communication";
import { dashboardHandlers } from "./dashboard";
import { fileHandlers } from "./file";
import { officialHandlers } from "./official";
import { paymentRecordHandlers } from "./paymentRecord";
import { reportHandlers } from "./report";
import { legalHandlers } from "./legal";
import { mainExposureHandlers } from "./mainExposure";
import { opsHandlers } from "./ops";
import { universeHandlers } from "./universe";
import { universeAdminHandlers } from "./universeAdmin";
import { searchHandlers } from "./search";
import { userHandlers } from "./user";

/**
 * MSW 핸들러 모음.
 * 도메인별 파일에서 배열을 만들어 여기서 합친다.
 */
/*
 * 세계관·상품 운영 화면은 `liveAxios`(실서버 베이스)로 나가지만, 서버 없이도 돌도록
 * 실서버 베이스에 등록한 목업으로 받는다(`universeAdmin` · `billingProduct`).
 * 실서버를 붙일 때는 해당 핸들러의 등록만 지우면 된다.
 *
 * 연동이 끝난 도메인은 목업을 걷어냈다 — 해시태그 · 금지어 · 크레딧 조정 · 장부 ·
 * 시스템 프롬프트(`/admin/ai/prompts`) · AI 모델(`/admin/ai/models`) ·
 * 공지사항(`/admin/notices`)은 실서버로 그대로 나간다.
 */
export const handlers = [
  // 감사 로그는 모든 변경 요청을 먼저 가로채야 하므로 항상 맨 앞에 둔다.
  ...auditLogHandlers,
  ...fileHandlers,
  ...searchHandlers,
  ...dashboardHandlers,
  ...mainExposureHandlers,
  ...billingProductHandlers,
  ...universeAdminHandlers,
  ...universeHandlers,
  ...officialHandlers,
  ...characterHandlers,
  ...commentHandlers,
  ...reportHandlers,
  ...userHandlers,
  ...billingHandlers,
  ...paymentRecordHandlers,
  ...communicationHandlers,
  ...legalHandlers,
  ...opsHandlers,
];
