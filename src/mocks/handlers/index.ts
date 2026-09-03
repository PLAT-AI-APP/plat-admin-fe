import { billingHandlers } from "./billing";
import { billingProductHandlers } from "./billingProduct";
import { characterHandlers } from "./character";
import { communicationHandlers } from "./communication";
import { dashboardHandlers } from "./dashboard";
import { paymentRecordHandlers } from "./paymentRecord";
import { reportHandlers } from "./report";
import { legalHandlers } from "./legal";
import { opsHandlers } from "./ops";
import { universeAdminHandlers } from "./universeAdmin";
import { searchHandlers } from "./search";

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
 * 공지사항(`/admin/notices`) · 유저(`/admin/users`) ·
 * 공식 계정(`/admin/official-accounts`) · 로그(`/admin/logs/**`) ·
 * 서버 상태(`/admin/server/**`)는 실서버로 그대로 나간다.
 *
 * 관리자 활동 로그는 목업이 모든 변경 요청을 가로채 직접 쌓았지만, 이제 서버가
 * 요청 길목에서 남긴다. 목업이 실서버로 나간 요청은 애초에 보지도 못했으므로
 * 가로채는 핸들러째로 걷어냈다.
 *
 * 유저와 공식 계정은 핸들러만 지우고 **`db/user.ts` · `db/official.ts` 는 남겼다.**
 * 전역 검색(⌘K) · 캐릭터 · 댓글 · 신고 · 결제 목업이 전부 그 씨앗에서 유저를
 * 빌려 쓰고, 목업 캐릭터·세계관의 공식 뱃지는 `db/official.ts` 가 계산한다.
 */
export const handlers = [
  ...searchHandlers,
  ...dashboardHandlers,
  ...billingProductHandlers,
  ...universeAdminHandlers,
  ...characterHandlers,
  ...reportHandlers,
  ...billingHandlers,
  ...paymentRecordHandlers,
  ...communicationHandlers,
  ...legalHandlers,
  ...opsHandlers,
];
