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
  | "nsfwKeyword"
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
  | "notice"
  | "qna"
  | "notification"
  | "push"
  | "legal"
  | "role"
  | "manager"
  | "appVersion"
  | "server"
  | "log";

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
  nsfwKeyword: {
    label: "NSFW 키워드",
    description: "캐릭터 · 대화 검수에 쓰는 차단 키워드",
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
    description: "캐릭터 · 댓글 · 유저 신고 처리",
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
    description: "프롬프트 버전 작성과 활성화. 전체 대화 품질에 바로 반영된다.",
    actions: ["read", "write"],
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
    label: "운영 로그",
    description: "누가 무엇을 바꿨는지",
    actions: ["read"],
  },
};

export const PERMISSION_ACTION_LABEL: Record<PermissionAction, string> = {
  read: "조회",
  write: "등록 · 수정",
  delete: "삭제",
  publish: "게시",
  adjust: "지급 · 차감",
  send: "발송",
};

/** 행위별로 무엇을 뜻하는지. 라벨만으로는 '게시'와 '발송'이 구분되지 않는다. */
export const PERMISSION_ACTION_HINT: Record<PermissionAction, string> = {
  read: "목록과 상세를 봅니다.",
  write: "새로 만들고 고칩니다.",
  delete: "지웁니다. 되돌릴 수 없습니다.",
  publish: "앱에 공개합니다. 모든 이용자가 보게 됩니다.",
  adjust: "유저 크레딧을 실제로 지급하거나 차감합니다.",
  send: "외부(이용자)에게 내보냅니다.",
};

/* ------------------------------------------------------------------ */
/* 분류                                                                 */
/* ------------------------------------------------------------------ */

/**
 * 자료를 묶는 갈래.
 *
 * **행위 구성이 같은 자료끼리 묶는다.** 업무 영역(캐릭터 · 유저 · 결제)이 아니다.
 *
 * 이 표는 자료(행) × 행위(열)인데, 자료마다 할 수 있는 행위가 다르다.
 * 스물일곱 개를 한 표에 넣으면 행위 여섯 개를 전부 열로 세워야 하고,
 * 그러면 `지급 · 차감` 열은 스물일곱 칸 중 스물여섯 칸이 빈칸이 된다.
 * 크레딧에만 있는 행위가 캐릭터 줄에도 자리를 차지하는 셈이다.
 *
 * 갈래를 행위 구성으로 나누면 **갈래마다 열 이름이 달라진다.**
 * 돈 갈래의 열은 `조회 · 지급 · 차감`이고, 거기에만 있다.
 * 빈칸이 사라지고, 갈래 이름이 곧 "이 자료들로 무엇을 할 수 있는가"가 된다.
 */
export interface PermissionCategoryDef {
  id: string;
  label: string;
  /** 이 갈래의 행위 구성이 왜 이런지. 설정 화면에서 그대로 보여 준다. */
  description: string;
  resources: readonly PermissionResource[];
}

export const PERMISSION_CATEGORIES = [
  {
    id: "general",
    label: "만들고 고치고 지우는 자료",
    description: "조회 · 등록 · 삭제. 대부분의 자료가 여기에 해당합니다.",
    resources: [
      "mainExposure",
      "character",
      "officialAccount",
      "hashtag",
      "nsfwKeyword",
      "billingProduct",
      "role",
      "manager",
    ],
  },
  {
    id: "keep",
    label: "지우지 않는 자료",
    description:
      "상태만 바꾸거나 기준이 되는 자료라 삭제가 없습니다. 숨기거나 새로 받습니다.",
    resources: [
      "comment",
      "report",
      "user",
      "chatExport",
      "aiModel",
      "systemPrompt",
      "creditPolicy",
      "notification",
      "appVersion",
      "universe",
    ],
  },
  {
    id: "publish",
    label: "앱에 공개하는 자료",
    description:
      "게시하면 모든 이용자가 봅니다. 되돌리기 어려워 '게시'를 따로 뗐습니다.",
    resources: ["notice", "legal"],
  },
  {
    id: "outbound",
    label: "밖으로 나가는 자료",
    description:
      "이용자에게 발송합니다. 나가면 되돌릴 수 없어 '발송'을 따로 뗐습니다.",
    resources: ["push", "qna"],
  },
  {
    id: "money",
    label: "돈이 오가는 자료",
    description:
      "유저 잔액에 곧바로 반영됩니다. 되돌릴 수 없어 따로 뗐습니다.",
    resources: ["creditAdjustment"],
  },
  {
    id: "record",
    label: "보기만 하는 자료",
    description:
      "지표와 기록입니다. 고칠 수 있으면 기록이 아니라 조회만 둡니다.",
    resources: ["dashboard", "ledger", "server", "log"],
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

  return `${PERMISSION_RESOURCES[resource]?.label ?? resource} > ${
    PERMISSION_ACTION_LABEL[action] ?? action
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

/** 자료 하나에 걸린 권한만 추린다. 설정 화면에서 줄 단위로 쓴다. */
export const permissionsOfResource = (
  permissions: PermissionKey[],
  resource: PermissionResource,
): PermissionAction[] =>
  PERMISSION_RESOURCES[resource].actions.filter((action) =>
    permissions.includes(permissionKey(resource, action)),
  );
