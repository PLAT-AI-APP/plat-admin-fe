import { billingHandlers } from "./billing";
import { characterHandlers } from "./character";
import { communicationHandlers } from "./communication";
import { dashboardHandlers } from "./dashboard";
import { paymentRecordHandlers } from "./paymentRecord";
import { reportHandlers } from "./report";
import { legalHandlers } from "./legal";
import { opsHandlers } from "./ops";
import { searchHandlers } from "./search";

/**
 * MSW 핸들러 모음.
 * 도메인별 파일에서 배열을 만들어 여기서 합친다.
 */
/*
 * 목업은 **실서버에 아직 엔드포인트가 없는 도메인만** 받는다. 전부 목업 베이스
 * (`NEXT_PUBLIC_BASE_URI`, 아무것도 뜨지 않는 오리진)에 등록하므로 `liveAxios`로
 * 나가는 실서버 요청은 가로채지 않는다.
 *
 * 연동이 끝난 도메인은 목업을 걷어냈다 — 세계관 · 상품 · 해시태그 · 금지어 ·
 * 크레딧 조정 · 장부 · 시스템 프롬프트 · AI 모델 · 공지사항 · 유저 · 공식 계정 ·
 * 댓글 · 메인 노출 · 로그 · 배치 · 서버 상태 · 관리자 계정 · 직책은 실서버로 그대로 나간다.
 *
 * 관리자 활동 로그는 목업이 모든 변경 요청을 가로채 직접 쌓았지만, 이제 서버가
 * 요청 길목에서 남긴다. 목업이 실서버로 나간 요청은 애초에 보지도 못했으므로
 * 가로채는 핸들러째로 걷어냈다.
 *
 * 유저와 공식 계정은 핸들러만 지우고 **`db/user.ts` · `db/official.ts` 는 남겼다.**
 * 전역 검색(⌘K) · 캐릭터 · 신고 · 결제 목업이 전부 그 씨앗에서 유저를
 * 빌려 쓰고, 목업 캐릭터·세계관의 공식 뱃지는 `db/official.ts` 가 계산한다.
 */
export const handlers = [
  ...searchHandlers,
  ...dashboardHandlers,
  ...characterHandlers,
  ...reportHandlers,
  ...billingHandlers,
  ...paymentRecordHandlers,
  ...communicationHandlers,
  ...legalHandlers,
  ...opsHandlers,
];
