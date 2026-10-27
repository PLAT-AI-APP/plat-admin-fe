export type SecretGrade = "CRITICAL" | "HIGH";

export const SECRET_GRADE_LABEL: Record<SecretGrade, string> = {
  CRITICAL: "치명",
  HIGH: "높음",
};

export interface SecretItem {
  /** Parameter Store 이름(/plat/<env>/secret/<name>). */
  name: string;
  label: string;
  /** 화면에서 묶는 단위. 서버가 주는 순서가 화면 순서다. */
  group: string;
  groupLabel: string;
  grade: SecretGrade;
  /** 화면에서 바꾸지 못하는 사유. null 이면 바꿀 수 있다. */
  lockedReason: string | null;
  /** 값을 바꾸면 다시 띄워야 하는 앱. 서버 상태의 app 이름(api · ai · admin)이다. */
  restartApps: string[];
  /** 바꾸기 전에 알아야 할 것. 없으면 빈 문자열. */
  note: string;
  /** false 면 저장소에 없다 — 앱이 기동하지 못한다. */
  registered: boolean;
  version: number | null;
  /** 저장소 기준 마지막 수정(AWS 콘솔에서 바꾼 것도 포함). */
  lastModifiedAt: string | null;
  lastModifiedBy: string | null;
  /** 관리자 화면에서 마지막으로 넣은 값의 끝 4자리(…abcd). 짧은 값이면 없다. 값 원문은 내려오지 않는다. */
  valueHint: string | null;
  valueUpdatedAt: string | null;
  valueUpdatedBy: string | null;
  expiresOn: string | null;
  memo: string | null;
}

export interface SecretOverview {
  path: string;
  /** 이 환경에서는 바꿀 수 없다(로컬). */
  readOnly: boolean;
  secrets: SecretItem[];
}
