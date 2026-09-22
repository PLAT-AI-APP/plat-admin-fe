/**
 * 권한 모델.
 *
 * **직책(`AdminRole`)에 권한을 붙이고, 관리자를 직책에 넣는다.**
 * 관리자 한 명씩 권한을 주는 방식이 아니다. 권한은 "이 사람이 무엇을 할 수 있나"가
 * 아니라 **"이 일을 하는 사람에게 무엇이 필요한가"** 로 정해지기 때문이다.
 *
 * 사람마다 주면 관리자가 열 명일 때 설정도 열 번, 점검도 열 번이다.
 * 규칙이 바뀌면 열 곳을 고쳐야 하고 한 곳만 빠뜨리면 그 사람만 조용히 다른 권한을 갖는다.
 * "크레딧을 지급할 수 있는 사람이 누구인가"를 물었을 때, 직책이면 하나만 열어 보면 되고
 * 사람마다면 전원을 훑어야 한다.
 */

/** 권한을 거는 대상. 화면(메뉴)이 아니라 **자료와 행위** 기준으로 나눈다. */
export type PermissionResource =
  | "dashboard"
  | "mainExposure"
  | "character"
  | "officialAccount"
  | "universe"
  | "hashtag"
  | "bannedWord"
  | "chatExport"
  | "comment"
  | "report"
  | "user"
  | "aiModel"
  | "systemPrompt"
  | "billingProduct"
  | "creditPolicy"
  | "creditAdjustment"
  | "ledger"
  | "payment"
  | "refund"
  | "refundForce"
  | "notice"
  | "qna"
  | "faq"
  | "notification"
  | "push"
  | "legal"
  | "role"
  | "manager"
  | "appVersion"
  | "server"
  | "log"
  | "systemLog"
  | "batch";

/**
 * 행위.
 *
 * `read`/`write`/`delete`는 어디에나 있고, 그 외는 **돈과 대외 발신**처럼
 * 되돌릴 수 없는 행위만 따로 뗀다. 행위를 잘게 쪼갤수록 좋은 게 아니라,
 * 실수했을 때 되돌리기 어려운 것부터 떼어 내는 것이 맞다.
 */
export type PermissionAction =
  | "read"
  | "write"
  | "delete"
  | "publish"
  | "adjust"
  | "send";

export type PermissionKey = `${PermissionResource}:${PermissionAction}`;

interface ResourceDef {
  label: string;
  /** 이 자료가 무엇인지. 권한 설정 화면에서 그대로 보여 준다. */
  description: string;
  actions: PermissionAction[];
  /** 개인정보 · 금전처럼 특별히 좁게 열어야 하는 자료 */
  isSensitive?: boolean;
  /**
   * 이 자료에서만 행위를 다르게 부르는 이름.
   *
   * 표의 열 이름은 갈래가 함께 쓰지만, 거부 안내는 자료 하나를 짚어 말한다.
   * `환불 > 지급 · 차감 · 환불`처럼 읽히면 무엇이 막혔는지 다시 해석해야 한다.
   */
  actionLabels?: Partial<Record<PermissionAction, string>>;
}

export const PERMISSION_RESOURCES: Record<PermissionResource, ResourceDef> = {
  dashboard: {
    label: "대시보드",
    description: "운영 요약 지표",
    actions: ["read"],
  },
  mainExposure: {
    label: "메인 노출",
    description: "배너 · 오늘의 PICK · 공식 맛보기 · 에셋 추천",
    actions: ["read", "write", "delete"],
  },
  character: {
    label: "캐릭터",
    description: "세계관에 등장하는 캐릭터. 조회 · 노출 상태 · 삭제",
    actions: ["read", "write", "delete"],
  },
  officialAccount: {
    /*
      캐릭터 권한과 따로 뗀다. 계정 하나를 지정하면 그 계정이 가진 세계관 전부가
      한 번에 공식이 되고, 메인 '공식 맛보기'에 실릴 후보도 그만큼 바뀐다.
      캐릭터 한 건을 고치는 일과 같은 무게로 둘 수 없다.
    */
    label: "공식 계정",
    description: "공식으로 취급할 유저 ID 지정. 공식 세계관 전체가 여기서 정해진다.",
    actions: ["read", "write", "delete"],
  },
  universe: {
    label: "세계관",
    description:
      "캐릭터와 시나리오를 품는 콘텐츠 단위. 심사 · 상태 · 댓글을 운영에서 조치한다.",
    actions: ["read", "write"],
  },
  hashtag: {
    label: "해시태그",
    description: "사용자가 고를 수 있는 태그 목록",
    actions: ["read", "write", "delete"],
  },
  bannedWord: {
    label: "금지어",
    description: "캐릭터 · 대화 검수에 쓰는 금지어와 예외어 사전",
    actions: ["read", "write", "delete"],
  },
  chatExport: {
    label: "채팅 내보내기",
    /*
      개인 대화를 실제로 꺼내는 일이라 따로 뗀다.
      캐릭터 권한에 묶으면 캐릭터를 고칠 수 있는 사람이 전부 대화를 볼 수 있게 된다.
    */
    description: "유저의 실제 대화 기록을 추출한다. 개인정보라 따로 뗀다.",
    actions: ["read", "write"],
    isSensitive: true,
  },
  comment: {
    label: "댓글",
    description: "댓글 조회와 숨김 · 복원",
    actions: ["read", "write"],
  },
  report: {
    label: "신고",
    description: "댓글 · 세계관 신고 판정 · 조치",
    actions: ["read", "write"],
  },
  user: {
    label: "유저",
    description: "유저 조회, 계정 정지 · 역할 변경",
    actions: ["read", "write"],
    isSensitive: true,
  },
  aiModel: {
    label: "AI 모델",
    description: "모델 카탈로그 확인과 운영 설정",
    actions: ["read", "write"],
  },
  systemPrompt: {
    label: "시스템 프롬프트",
    /*
      삭제를 따로 뗀다. 지운 버전은 되돌릴 수 없고, 그 버전에서 무엇이 바뀌었는지를
      되짚을 근거까지 함께 사라진다. 활성 버전은 어떤 권한으로도 지울 수 없다.
    */
    description:
      "프롬프트 버전 작성과 활성화. 전체 대화 품질에 바로 반영된다.",
    actions: ["read", "write", "delete"],
    isSensitive: true,
  },
  billingProduct: {
    label: "결제 상품",
    description: "크레딧 상품과 결제 금액",
    actions: ["read", "write", "delete"],
    isSensitive: true,
  },
  creditPolicy: {
    label: "크레딧 정책",
    description: "지급 · 차감 기준",
    actions: ["read", "write"],
    isSensitive: true,
  },
  creditAdjustment: {
    label: "크레딧 수동 조정",
    /*
      `write`가 아니라 `adjust`다.
      조정은 승인 단계 없이 곧바로 유저 잔액에 반영되고 장부에 남는다.
      '등록 · 수정'이라는 이름으로 두면 다른 자료와 같은 무게로 읽힌다.
    */
    description: "유저 크레딧을 직접 지급 · 차감한다. 되돌릴 수 없다.",
    actions: ["read", "adjust"],
    isSensitive: true,
  },
  ledger: {
    label: "결제 장부",
    description: "결제 · 충전 · 사용 · 환불 흐름",
    actions: ["read"],
    isSensitive: true,
  },
  payment: {
    label: "결제 내역",
    description: "PG 결제 주문과 거래 기록. 돈이 오간 사실이라 고치지 않는다.",
    actions: ["read"],
    isSensitive: true,
  },
  refund: {
    label: "환불",
    /*
      `write`가 아니라 `adjust`다. 승인하면 PG로 실제 돈이 나가고 노트가 회수된다.
      되돌릴 수 없어 크레딧 수동 조정과 같은 무게로 둔다. 거절도 같은 권한이다 —
      유저에게 사유가 그대로 나가는 결정이라 승인과 떼어 줄 이유가 없다.
    */
    description: "유저 환불 요청을 승인 · 거절한다. 승인하면 PG로 돈이 나간다.",
    actions: ["read", "adjust"],
    isSensitive: true,
    actionLabels: { adjust: "승인 · 거절" },
  },
  refundForce: {
    label: "강제 환불",
    /*
      일반 환불 담당에게 딸려 가지 않도록 `refund`와 따로 뗐다. 노트를 이미 썼어도 결제 금액 전액이
      나가고 쓴 노트는 회사 손실로 남는다. 보기는 결제 내역 권한으로 충분해 조회 행위가 없다.
    */
    description:
      "사용 여부 · 기한을 건너뛰고 전액 환불한다. 이미 쓴 노트는 회수하지 않고 손실로 남는다.",
    actions: ["adjust"],
    isSensitive: true,
    actionLabels: { adjust: "강제 환불" },
  },
  notice: {
    label: "공지사항",
    description: "공지 작성과 게시",
    actions: ["read", "write", "delete", "publish"],
  },
  qna: {
    label: "Q&A",
    description: "문의 확인과 답변. 답변은 유저에게 그대로 보인다.",
    actions: ["read", "write", "send"],
  },
  faq: {
    label: "FAQ",
    description: "고객센터의 자주 하는 질문. 노출하면 유저 화면에 바로 보인다.",
    actions: ["read", "write", "delete"],
  },
  notification: {
    label: "알림 템플릿",
    description: "서비스 알림 문구",
    actions: ["read", "write"],
  },
  push: {
    label: "푸시 발송",
    description: "푸시 작성과 발송. 나가면 되돌릴 수 없다.",
    actions: ["read", "write", "delete", "send"],
  },
  legal: {
    label: "법적 고지",
    description: "이용약관 · 개인정보처리방침. 활성 지정은 법적 효력을 갖는다.",
    actions: ["read", "write", "publish"],
    isSensitive: true,
  },
  role: {
    label: "직책 · 권한",
    description: "직책을 만들고 권한을 정한다. 가장 강한 권한이다.",
    actions: ["read", "write", "delete"],
    isSensitive: true,
  },
  manager: {
    label: "관리자 계정",
    description: "관리자를 추가하고 직책을 배정한다.",
    actions: ["read", "write", "delete"],
    isSensitive: true,
  },
  appVersion: {
    label: "앱 버전",
    description: "최소 · 권장 버전과 강제 업데이트",
    actions: ["read", "write"],
  },
  server: {
    label: "서버 상태",
    description: "서버와 외부 의존성 상태",
    actions: ["read"],
  },
  log: {
    /*
      변경된 값이 payload에 그대로 남는다. 즉 이 권한은 "다른 관리자가 무엇을
      어떤 값으로 바꿨는지"를 전부 열어 주는 것과 같아서 민감으로 둔다.
      시스템 이벤트와 한 권한으로 묶으면, 장애를 보려는 사람에게 감사 기록까지
      함께 열어 주게 된다.
    */
    label: "관리자 활동 로그",
    description: "누가 무엇을 어떤 값으로 바꿨는지. 변경 값이 그대로 남는다.",
    actions: ["read"],
    isSensitive: true,
  },
  systemLog: {
    label: "시스템 이벤트",
    description: "조치가 필요한 경고 · 오류. 원본 로그는 관제 도구에 있다.",
    actions: ["read"],
  },
  batch: {
    /*
      조회만 있는 로그와 달리 **수동 실행**이라는 행위가 붙는다.
      배치를 한 번 더 돌리는 일은 되돌릴 수 없는 처리가 섞여 있어 write로 뗀다.
    */
    label: "배치 작업",
    description: "예약 실행 잡의 이력 조회와 수동 재실행",
    actions: ["read", "write"],
  },
};

export const PERMISSION_ACTION_LABEL: Record<PermissionAction, string> = {
  read: "조회",
  write: "등록 · 수정",
  delete: "삭제",
  publish: "게시",
  adjust: "지급 · 차감 · 환불",
  send: "발송",
};

/** 행위별로 무엇을 뜻하는지. 라벨만으로는 '게시'와 '발송'이 구분되지 않는다. */
export const PERMISSION_ACTION_HINT: Record<PermissionAction, string> = {
  read: "목록과 상세를 봅니다.",
  write: "새로 만들고 고칩니다.",
  delete: "지웁니다. 되돌릴 수 없습니다.",
  publish: "앱에 공개합니다. 모든 이용자가 보게 됩니다.",
  adjust:
    "유저 크레딧을 실제로 지급 · 차감하거나 환불을 승인 · 거절합니다. 돈과 잔액이 움직입니다.",
  send: "외부(이용자)에게 내보냅니다.",
};

/* ------------------------------------------------------------------ */
/* 분류                                                                 */
/* ------------------------------------------------------------------ */

/**
 * 자료를 묶는 갈래.
 *
 * **업무 영역(도메인)으로 묶는다.** 사이드바 메뉴와 같은 순서 · 같은 이름이다.
 *
 * 직책을 설정하는 사람은 "이 직책은 결제를 맡는다"처럼 영역으로 생각한다.
 * 행위 구성(지우는 자료 · 발송하는 자료)으로 묶으면 결제 권한이 세 갈래에 흩어져,
 * 결제 담당 직책 하나를 만들려고 카드 여러 장을 오가야 했다.
 *
 * 갈래마다 행위 구성이 달라 **열은 갈래에서 뽑는다**(`categoryActions`).
 * 위험한 자료는 갈래가 아니라 자료 줄의 `민감` 표시로 드러낸다.
 */
export interface PermissionCategoryDef {
  id: string;
  label: string;
  /** 이 갈래가 어떤 업무를 다루는지. 설정 화면에서 그대로 보여 준다. */
  description: string;
  resources: readonly PermissionResource[];
}

export const PERMISSION_CATEGORIES = [
  {
    id: "main",
    label: "대시보드 · 메인 노출",
    description: "운영 지표와 앱 메인 화면에 걸리는 콘텐츠",
    resources: ["dashboard", "mainExposure"],
  },
  {
    id: "universe",
    label: "세계관",
    description: "세계관 · 캐릭터와 이를 둘러싼 태그 · 금지어 · 대화 기록",
    resources: [
      "universe",
      "character",
      "officialAccount",
      "hashtag",
      "bannedWord",
      "chatExport",
    ],
  },
  {
    id: "community",
    label: "커뮤니티",
    description: "댓글과 신고 처리",
    resources: ["comment", "report"],
  },
  {
    id: "user",
    label: "유저",
    description: "유저 계정 조회와 제재",
    resources: ["user"],
  },
  {
    id: "ai",
    label: "AI 운영",
    description: "모델 설정과 시스템 프롬프트. 전체 대화 품질에 바로 반영됩니다.",
    resources: ["aiModel", "systemPrompt"],
  },
  {
    id: "billing",
    label: "결제 · 크레딧",
    description: "상품 · 크레딧 · 결제 · 환불. 돈과 잔액이 움직이는 자료가 모여 있습니다.",
    resources: [
      "billingProduct",
      "creditPolicy",
      "creditAdjustment",
      "payment",
      "refund",
      "refundForce",
      "ledger",
    ],
  },
  {
    id: "communication",
    label: "커뮤니케이션",
    description: "공지 · 문의 · 알림 · 푸시와 법적 고지. 게시 · 발송하면 이용자가 바로 봅니다.",
    resources: ["notice", "qna", "faq", "notification", "push", "legal"],
  },
  {
    id: "ops",
    label: "운영",
    description: "직책 · 관리자 계정과 앱 버전, 서버 · 배치 · 로그",
    resources: [
      "role",
      "manager",
      "appVersion",
      "server",
      "batch",
      "log",
      "systemLog",
    ],
  },
] as const satisfies readonly PermissionCategoryDef[];

/** 열을 세울 순서. 되돌리기 쉬운 것부터 어려운 것 순으로 둔다. */
const ACTION_ORDER: readonly PermissionAction[] = [
  "read",
  "write",
  "delete",
  "publish",
  "adjust",
  "send",
];

/**
 * 이 갈래의 열.
 *
 * 손으로 적지 않고 **자료에서 뽑는다.** 손으로 적으면 자료에 행위를 하나 더한 날
 * 열이 따라오지 않아, 켤 수 없는 권한이 조용히 생긴다.
 */
export const categoryActions = (
  resources: readonly PermissionResource[],
): PermissionAction[] => {
  const actions = new Set(
    resources.flatMap((resource) => PERMISSION_RESOURCES[resource].actions),
  );

  return ACTION_ORDER.filter((action) => actions.has(action));
};

/**
 * 갈래에 넣지 않은 자료가 있으면 **여기서 타입 오류가 난다.**
 *
 * 자료를 새로 만들고 갈래에 넣는 것을 잊으면, 그 자료는 설정 화면에
 * 아예 나타나지 않는다. 아무도 켤 수 없으니 그 기능은 최고관리자만 쓰게 되고,
 * 화면에서는 "권한을 안 준 것"과 구분되지 않아 한참 뒤에야 발견된다.
 */
type CategorizedResource =
  (typeof PERMISSION_CATEGORIES)[number]["resources"][number];

type MustBeNever<T extends never> = T;

/* 쓰이지 않는 것이 목적이다. 존재하는 것만으로 컴파일 때 검사가 된다. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _EveryResourceHasCategory = MustBeNever<
  Exclude<PermissionResource, CategorizedResource>
>;

export const permissionKey = (
  resource: PermissionResource,
  action: PermissionAction,
): PermissionKey => `${resource}:${action}`;

/** 사람이 읽는 권한 이름. 거부 안내에 그대로 쓴다. (`크레딧 수동 조정 > 지급 · 차감`) */
export const permissionLabel = (key: PermissionKey): string => {
  const [resource, action] = key.split(":") as [
    PermissionResource,
    PermissionAction,
  ];

  const def = PERMISSION_RESOURCES[resource];

  return `${def?.label ?? resource} > ${
    def?.actionLabels?.[action] ?? PERMISSION_ACTION_LABEL[action] ?? action
  }`;
};

export const ALL_PERMISSIONS: PermissionKey[] = (
  Object.keys(PERMISSION_RESOURCES) as PermissionResource[]
).flatMap((resource) =>
  PERMISSION_RESOURCES[resource].actions.map((action) =>
    permissionKey(resource, action),
  ),
);

/**
 * 권한을 갖고 있는가.
 *
 * `isSuperAdmin`은 목록을 보지 않고 전부 통과시킨다.
 * 최고관리자에게서 권한을 뺄 수 있으면, 실수 한 번으로 **아무도 권한을 되돌릴 수 없는**
 * 상태가 만들어진다. (권한 설정 권한까지 잃는 경우)
 */
export const hasPermission = (
  granted: PermissionKey[] | undefined,
  required: PermissionKey,
  isSuperAdmin = false,
): boolean => {
  if (isSuperAdmin) return true;

  return Boolean(granted?.includes(required));
};

/**
 * `write`는 `read`를 품는다.
 *
 * 고칠 수는 있는데 볼 수는 없는 상태는 뜻이 없다. 화면을 열지 못하면 고칠 수도 없다.
 * 그래서 저장할 때 한 번 정규화해 두고, 판정하는 쪽은 단순 포함 검사만 하게 한다.
 */
export const normalizePermissions = (
  permissions: PermissionKey[],
): PermissionKey[] => {
  const next = new Set(permissions);

  for (const key of permissions) {
    const [resource, action] = key.split(":") as [
      PermissionResource,
      PermissionAction,
    ];

    if (action !== "read") next.add(permissionKey(resource, "read"));
  }

  return ALL_PERMISSIONS.filter((key) => next.has(key));
};

