import { aiHandlers } from "./ai";
import { authHandlers } from "./auth";
import { auditLogHandlers } from "./auditLog";
import { billingHandlers } from "./billing";
import { characterHandlers } from "./character";
import { commentHandlers } from "./comment";
import { communicationHandlers } from "./communication";
import { dashboardHandlers } from "./dashboard";
import { fileHandlers } from "./file";
import { hashtagHandlers } from "./hashtag";
import { noticeHandlers } from "./notice";
import { officialHandlers } from "./official";
import { reportHandlers } from "./report";
import { legalHandlers } from "./legal";
import { mainExposureHandlers } from "./mainExposure";
import { opsHandlers } from "./ops";
import { universeHandlers } from "./universe";
import { searchHandlers } from "./search";
import { userHandlers } from "./user";

/**
 * MSW 핸들러 모음.
 * 도메인별 파일에서 배열을 만들어 여기서 합친다.
 */
export const handlers = [
  // 감사 로그는 모든 변경 요청을 먼저 가로채야 하므로 항상 맨 앞에 둔다.
  ...auditLogHandlers,
  // 인증은 감사 대상이 아니고(비밀번호가 본문에 있다) 다른 핸들러보다 앞선다.
  ...authHandlers,
  ...fileHandlers,
  ...searchHandlers,
  ...dashboardHandlers,
  ...mainExposureHandlers,
  ...universeHandlers,
  ...officialHandlers,
  ...characterHandlers,
  ...hashtagHandlers,
  ...commentHandlers,
  ...reportHandlers,
  ...userHandlers,
  ...aiHandlers,
  ...billingHandlers,
  ...communicationHandlers,
  ...noticeHandlers,
  ...legalHandlers,
  ...opsHandlers,
];
