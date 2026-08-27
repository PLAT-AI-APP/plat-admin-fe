import { aiHandlers } from "./ai";
import { auditLogHandlers } from "./auditLog";
import { billingHandlers } from "./billing";
import { characterHandlers } from "./character";
import { commentHandlers } from "./comment";
import { communicationHandlers } from "./communication";
import { dashboardHandlers } from "./dashboard";
import { fileHandlers } from "./file";
import { noticeHandlers } from "./notice";
import { officialHandlers } from "./official";
import { reportHandlers } from "./report";
import { legalHandlers } from "./legal";
import { mainExposureHandlers } from "./mainExposure";
import { opsHandlers } from "./ops";
import { hashtagHandlers } from "./hashtag";
import { universeHandlers } from "./universe";
import { universeAdminHandlers } from "./universeAdmin";
import { searchHandlers } from "./search";
import { userHandlers } from "./user";

/**
 * MSW 핸들러 모음.
 * 도메인별 파일에서 배열을 만들어 여기서 합친다.
 */
/*
 * 해시태그·세계관 운영 화면은 `liveAxios`(실서버 베이스)로 나가지만, 서버 없이도 돌도록
 * 실서버 베이스에 등록한 목업으로 받는다(`hashtag` · `universeAdmin`).
 * 실서버를 붙일 때는 두 핸들러의 등록만 지우면 된다.
 */
export const handlers = [
  // 감사 로그는 모든 변경 요청을 먼저 가로채야 하므로 항상 맨 앞에 둔다.
  ...auditLogHandlers,
  ...fileHandlers,
  ...searchHandlers,
  ...dashboardHandlers,
  ...mainExposureHandlers,
  ...hashtagHandlers,
  ...universeAdminHandlers,
  ...universeHandlers,
  ...officialHandlers,
  ...characterHandlers,
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
