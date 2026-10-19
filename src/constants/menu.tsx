import { ReactNode } from "react";
import type { PermissionKey } from "@/type/permission";
import { IS_MOCKING } from "@/api/baseUri";
import {
  Activity,
  Bell,
  Calendar,
  Coin,
  Cpu,
  CreditCard,
  Crown,
  Dashboard,
  Download,
  FileText,
  Flag,
  Globe,
  Hash,
  Key,
  Layers,
  ListLines,
  Megaphone,
  MessageSquare,
  Package,
  QuestionCircle,
  Receipt,
  Robot,
  Scale,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Smartphone,
  Star,
  UserPlus,
  Users,
  Warning,
} from "@/icons";
import type { PendingCounts } from "@/type/ops";

export interface AdminMenuItem {
  label: string;
  href: string;
  icon?: ReactNode;
  /** 이 메뉴를 보려면 필요한 권한. 없으면 누구나 본다. */
  permission?: PermissionKey;
  /**
   * 화면만 만들어 둔 MOCK 기능.
   *
   * **아직 실서버에 붙지 않았거나 다른 도구로 운영 중이라 구현하지 않는다.**
   * 메뉴에서 지우면 나중에 왜 없는지 아무도 모르고, 배지 없이 두면
   * 저장한 값이 실제로 반영되는 줄 안다.
   */
  isMock?: boolean;
  /**
   * 화면에서 감출 항목.
   *
   * **화면이 내려가 편성해도 아무 데도 안 나가는 경우에 쓴다.** 지우지 않는 이유는 지금 없는 것이
   * 폐기가 아니라 대기이기 때문이다 — 섹션이 돌아오면 이 줄만 지우면 된다. 경로로 직접 들어가면
   * 화면 자체는 여전히 열린다(상단 제목도 그대로 잡힌다).
   */
  hidden?: boolean;
  /**
   * 처리 대기 건수를 뱃지로 붙일 항목.
   *
   * 운영자가 매일 여는 화면은 정해져 있다. **밀린 일이 있는 화면만** 표시해
   * 사이드바가 숫자로 뒤덮이지 않게 한다.
   */
  pendingKey?: keyof PendingCounts;
}

export interface AdminMenuGroup {
  /** 메뉴 펼침 상태를 저장할 키 */
  key: string;
  /** 사이드바 구역. 쓰는 사람 기준(운영 · 개발 · 관리)이다. */
  section: AdminMenuSectionKey;
  label: string;
  icon: ReactNode;
  /** 하위가 없는 단독 메뉴는 href를 갖는다. */
  href?: string;
  /** 단독 메뉴일 때 필요한 권한. 그룹은 하위 중 하나라도 보이면 열린다. */
  permission?: PermissionKey;
  /** 단독 메뉴일 때의 MOCK 표시 */
  isMock?: boolean;
  children?: AdminMenuItem[];
}

const ICON_SIZE = 19;
const SUB_ICON_SIZE = 17;

/**
 * 사이드바 구역.
 *
 * **구역은 화면을 쓰는 사람으로 나눈다.** 기능을 누가 만들었는지가 아니라 누가 매일 여는지가 기준이다
 * (서비스 점검은 개발이 만들었지만 운영이 건다). 구역 안의 그룹이 하나도 보이지 않으면 구역 제목도 숨겨,
 * 운영 직책에는 개발 구역이 통째로 사라진다.
 */
export const ADMIN_MENU_SECTIONS = [
  { key: "operate", label: "운영" },
  { key: "develop", label: "개발" },
  { key: "manage", label: "관리" },
] as const;

export type AdminMenuSectionKey = (typeof ADMIN_MENU_SECTIONS)[number]["key"];

/**
 * 좌측 네비게이션 정의.
 *
 * 분류 기준
 * 1) 구역(`section`)은 쓰는 사람 기준이다 — 운영 · 개발 · 관리.
 * 2) 1뎁스는 운영 대상 도메인 단위로 묶는다. (화면 수 기준이 아니다)
 * 3) 2뎁스는 도메인 내부의 업무 단위(목록/관리 · 정책 · 이력)다. 같은 대상을 다루는 화면은 탭으로 합친다.
 * 4) 하위가 1개뿐인 도메인은 2뎁스를 만들지 않고 단독 메뉴로 둔다.
 *
 * 배열은 구역 순서대로 평평하게 둔다. 경로 판정 · ⌘K · 브레드크럼은 그룹만 보고, 구역은 사이드바만 쓴다.
 * 자세한 근거는 docs/ADMIN_PLAN.md 2장 참고.
 */
export const ADMIN_MENU: AdminMenuGroup[] = [
  /* ───────────── 운영 ───────────── */
  {
    key: "dashboard",
    section: "operate",
    label: "대시보드",
    icon: <Dashboard size={ICON_SIZE} />,
    href: "/",
    permission: "dashboard:read",
  },
  {
    /*
      1뎁스는 "콘텐츠"다. 세계관이 콘텐츠의 단위이고, 캐릭터는 그 안에 존재한다.
      홈 편성도 세계관을 고르는 일이라 같은 그룹에 둔다.
    */
    key: "content",
    section: "operate",
    label: "콘텐츠",
    icon: <Globe size={ICON_SIZE} />,
    children: [
      {
        label: "세계관",
        href: "/universes",
        permission: "universe:read",
        icon: <Globe size={SUB_ICON_SIZE} />,
      },
      {
        label: "해시태그",
        href: "/universes/hashtags",
        permission: "hashtag:read",
        icon: <Hash size={SUB_ICON_SIZE} />,
      },
      {
        /* 배너와 오늘의 PICK 을 탭으로 합쳤다. 감춘 두 편성(공식 캐릭터 맛보기 · 에셋 추천)은 섹션이 돌아오면 탭으로 붙인다. */
        label: "홈 편성",
        href: "/main-exposure",
        permission: "mainExposure:read",
        icon: <Star size={SUB_ICON_SIZE} />,
      },
      /*
       * 아래 둘은 MVP 에서 홈 섹션이 내려가 편성 결과가 어디에도 나가지 않는다. 편성 화면을 열어 두면
       * 운영자가 담아 놓고 왜 안 보이는지 찾게 되므로 메뉴에서만 감춘다. 자세한 배경은
       * plat-be `docs/decisions/004-mvp-home-section-scope.md` 참고.
       */
      {
        label: "공식 캐릭터 맛보기",
        href: "/main-exposure/official-pick",
        permission: "mainExposure:read",
        icon: <Crown size={SUB_ICON_SIZE} />,
        hidden: true,
      },
      {
        label: "에셋 추천",
        href: "/main-exposure/asset-pick",
        permission: "mainExposure:read",
        icon: <Layers size={SUB_ICON_SIZE} />,
        hidden: true,
      },
      {
        label: "캐릭터",
        href: "/universes/characters",
        permission: "character:read",
        icon: <Robot size={SUB_ICON_SIZE} />,
        isMock: true,
      },
    ],
  },
  {
    /* 밀린 일이 쌓이는 검수 큐를 한곳에 모은다. 운영자가 아침에 여는 그룹이다. */
    key: "moderation",
    section: "operate",
    label: "검수·신고",
    icon: <Flag size={ICON_SIZE} />,
    children: [
      {
        label: "신고",
        href: "/community/reports",
        pendingKey: "report",
        permission: "report:read",
        icon: <Flag size={SUB_ICON_SIZE} />,
      },
      {
        label: "댓글",
        href: "/community/comments",
        pendingKey: "comment",
        permission: "comment:read",
        icon: <MessageSquare size={SUB_ICON_SIZE} />,
      },
      {
        label: "금지어",
        href: "/universes/banned-words",
        permission: "bannedWord:read",
        icon: <ShieldAlert size={SUB_ICON_SIZE} />,
      },
      {
        /* 탈퇴한 크리에이터가 남긴 캐릭터. 승인하면 공식 계정이 인수하고, 반려하면 삭제된다. */
        label: "인수 심사",
        href: "/universes/handovers",
        pendingKey: "handover",
        permission: "universeHandover:read",
        icon: <UserPlus size={SUB_ICON_SIZE} />,
      },
      {
        label: "채팅 내보내기",
        href: "/universes/chat-exports",
        permission: "chatExport:read",
        icon: <Download size={SUB_ICON_SIZE} />,
        isMock: true,
      },
    ],
  },
  {
    key: "users",
    section: "operate",
    label: "유저",
    icon: <Users size={ICON_SIZE} />,
    children: [
      {
        label: "유저",
        href: "/users",
        permission: "user:read",
        icon: <Users size={SUB_ICON_SIZE} />,
      },
      {
        /*
          세계관이 아니라 유저 아래에 둔다. 지정하는 대상이 세계관이 아니라 **유저 계정**이고,
          세계관의 공식 표시는 그 계정에서 계산되어 따라올 뿐이다.
        */
        label: "공식 계정",
        href: "/users/official",
        permission: "officialAccount:read",
        icon: <Crown size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    key: "support",
    section: "operate",
    label: "고객센터",
    icon: <QuestionCircle size={ICON_SIZE} />,
    children: [
      {
        label: "Q&A",
        href: "/communication/qna",
        pendingKey: "qna",
        permission: "qna:read",
        icon: <QuestionCircle size={SUB_ICON_SIZE} />,
      },
      {
        label: "공지사항",
        href: "/communication/notices",
        permission: "notice:read",
        icon: <FileText size={SUB_ICON_SIZE} />,
      },
      {
        label: "FAQ",
        href: "/communication/faq",
        permission: "faq:read",
        icon: <ListLines size={SUB_ICON_SIZE} />,
      },
      {
        label: "문서 관리",
        href: "/communication/docs",
        permission: "docs:read",
        icon: <Layers size={SUB_ICON_SIZE} />,
      },
      {
        /* 약관 버전은 여기서 관리한다. 본문 원문은 아직 Notion 에 두고 버전·시행일·동의 대상을 서버가 판정한다. */
        label: "약관",
        href: "/legal",
        permission: "legal:read",
        icon: <Scale size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    /* 유저에게 먼저 보내는 것들. 지금은 모두 다른 도구(Discord)로 운영해 실서버에서는 그룹째 숨는다. */
    key: "messaging",
    section: "operate",
    label: "메시지 발송",
    icon: <Megaphone size={ICON_SIZE} />,
    children: [
      {
        label: "알림 템플릿",
        href: "/communication/notifications",
        permission: "notification:read",
        icon: <Bell size={SUB_ICON_SIZE} />,
        isMock: true,
      },
      {
        label: "푸시",
        href: "/communication/push",
        permission: "push:read",
        icon: <Megaphone size={SUB_ICON_SIZE} />,
        isMock: true,
      },
      {
        label: "선제 메시지",
        href: "/communication/proactive-messages",
        permission: "notification:read",
        icon: <MessageSquare size={SUB_ICON_SIZE} />,
        isMock: true,
      },
    ],
  },
  {
    key: "billing",
    section: "operate",
    label: "결제·노트",
    icon: <CreditCard size={ICON_SIZE} />,
    children: [
      {
        /*
          결제 장부 · 환불 관리 · 결제 보존 원장을 결제 한 건 기준으로 합쳤다.
          환불 승인 · 이상 조치 · 5년 보존 열람이 모두 여기서 끝난다. 결제와 무관한
          노트 흐름(사용 · 만료 · 조정)은 유저 상세의 노트 원장에서 본다.
        */
        label: "결제 내역",
        href: "/billing/payments",
        permission: "payment:read",
        icon: <CreditCard size={SUB_ICON_SIZE} />,
        pendingKey: "refund",
      },
      {
        label: "상품·가격",
        href: "/billing/products",
        permission: "billingProduct:read",
        icon: <Package size={SUB_ICON_SIZE} />,
      },
      {
        /* 채팅 요금 · 모델별 요금 · 고정 지급·차감을 탭으로 합쳤다. 노트 가격을 정하는 일은 여기서 끝난다. */
        label: "노트 요금",
        href: "/billing/pricing",
        permission: "creditPolicy:read",
        icon: <Coin size={SUB_ICON_SIZE} />,
      },
      {
        /* 형식이 곧 그 턴의 가격대라 요금 옆에 둔다. 경로는 예전 그대로다. */
        label: "응답 형식",
        href: "/ai/response-formats",
        permission: "creditPolicy:read",
        icon: <MessageSquare size={SUB_ICON_SIZE} />,
      },
      {
        label: "노트 수동 조정",
        href: "/billing/credit-adjustments",
        permission: "creditAdjustment:read",
        icon: <Sliders size={SUB_ICON_SIZE} />,
      },
      {
        label: "AI 원가·매출",
        href: "/ai/costs",
        permission: "aiCost:read",
        icon: <Receipt size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    /* 크리에이터 수익(plat-earning). 대화 수익 포인트와 상품권 · 노트 교환을 관리한다. */
    key: "earnings",
    section: "operate",
    label: "크리에이터 수익",
    icon: <Crown size={ICON_SIZE} />,
    children: [
      {
        label: "크리에이터 수익",
        href: "/earnings/creators",
        icon: <Users size={SUB_ICON_SIZE} />,
        permission: "earning:read",
      },
      {
        label: "크리에이터 등급",
        href: "/earnings/tiers",
        icon: <Star size={SUB_ICON_SIZE} />,
        permission: "earning:read",
      },
      {
        label: "교환 요청",
        href: "/earnings/redemptions",
        icon: <Package size={SUB_ICON_SIZE} />,
        permission: "earning:read",
        pendingKey: "redemption",
      },
      {
        label: "수익 정책·교환 상품",
        href: "/earnings/policy",
        icon: <Sliders size={SUB_ICON_SIZE} />,
        permission: "earning:read",
      },
    ],
  },
  {
    /* 기능은 개발이 만들었지만 거는 사람은 운영이다. 유저 화면에 바로 보이는 중단 · 업데이트 안내를 모은다. */
    key: "service",
    section: "operate",
    label: "점검·업데이트",
    icon: <Warning size={ICON_SIZE} />,
    children: [
      {
        label: "서비스 점검",
        href: "/ops/maintenance",
        permission: "maintenance:read",
        icon: <Warning size={SUB_ICON_SIZE} />,
      },
      {
        /* 푸터 사업자 정보 · 베타 배너. 유저 화면 전체에 바로 보여 점검과 함께 둔다. */
        label: "사이트 설정",
        href: "/ops/site-settings",
        permission: "siteSetting:read",
        icon: <Globe size={SUB_ICON_SIZE} />,
      },
      {
        label: "앱 버전",
        href: "/ops/app-versions",
        permission: "appVersion:read",
        icon: <Smartphone size={SUB_ICON_SIZE} />,
        /* 강제 업데이트 정책을 아직 앱이 읽지 않는다. 화면은 붙일 때를 위해 남겨 둔다. */
        isMock: true,
      },
    ],
  },

  /* ───────────── 개발 ───────────── */
  {
    key: "ai",
    section: "develop",
    label: "AI 엔진",
    icon: <Cpu size={ICON_SIZE} />,
    children: [
      {
        /* 운영 설정과 카탈로그(테스트 호출)를 탭으로 합쳤다. 요금은 결제·노트 > 노트 요금에서 고친다. */
        label: "모델",
        href: "/ai/models",
        permission: "aiModel:read",
        icon: <Cpu size={SUB_ICON_SIZE} />,
      },
      {
        /* 캐릭터마다 다른 내용이 아니라 모든 대화에 공통으로 붙는 규칙(대화 기본 · 안전 · 추천)이라 개발 구역에 둔다. */
        label: "시스템 프롬프트",
        href: "/ai/prompts",
        permission: "systemPrompt:read",
        icon: <FileText size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    key: "infra",
    section: "develop",
    label: "인프라",
    icon: <Server size={ICON_SIZE} />,
    children: [
      {
        label: "서버 상태",
        href: "/ops/server",
        permission: "server:read",
        icon: <Server size={SUB_ICON_SIZE} />,
      },
      {
        label: "배치",
        href: "/ops/batch",
        permission: "batch:read",
        icon: <Calendar size={SUB_ICON_SIZE} />,
      },
      {
        /* 어긋나도 운영이 화면에서 할 조치가 없고 개발이 원인을 본다. 배치 결과와 같은 권한이다. */
        label: "대사 결과",
        href: "/earnings/reconciliation",
        permission: "batch:read",
        icon: <Scale size={SUB_ICON_SIZE} />,
      },
      {
        label: "시스템 로그",
        href: "/ops/logs",
        permission: "systemLog:read",
        icon: <ListLines size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    /* 서버 시크릿과 AI 제공사 키를 탭으로 합쳤다. 둘 다 server:write 로 바꾼다. */
    key: "keys",
    section: "develop",
    label: "키·시크릿",
    icon: <Key size={ICON_SIZE} />,
    href: "/ops/secrets",
    permission: "server:read",
  },

  /* ───────────── 관리 ───────────── */
  {
    key: "operators",
    section: "manage",
    label: "운영자",
    icon: <ShieldCheck size={ICON_SIZE} />,
    children: [
      {
        label: "운영자 계정",
        href: "/ops/managers",
        permission: "manager:read",
        icon: <UserPlus size={SUB_ICON_SIZE} />,
      },
      {
        label: "직책·권한",
        href: "/ops/roles",
        permission: "role:read",
        icon: <ShieldCheck size={SUB_ICON_SIZE} />,
      },
      {
        /*
          운영자 콘솔 계정이 아니라 **서비스 계정**에 주는 관리자 역할이다.
          누구에게 무슨 힘을 주는 일이라 유저 관리가 아니라 권한 관리 쪽에 둔다.
        */
        label: "서비스 관리자",
        href: "/users/service-admins",
        permission: "serviceAdmin:read",
        icon: <ShieldCheck size={SUB_ICON_SIZE} />,
      },
      {
        /* 누가 무엇을 바꿨는지 되짚는 감사 기록. 장애를 보는 시스템 로그와 볼 사람이 달라 떼어 냈다. */
        label: "운영자 활동 기록",
        href: "/ops/admin-activity",
        permission: "log:read",
        icon: <Activity size={SUB_ICON_SIZE} />,
      },
    ],
  },
];

/**
 * 사이드바·메뉴 검색에 보일 항목인지.
 *
 * MOCK 화면은 목업 서버가 켜진 환경에서만 보인다. 실서버 환경에서는 붙을 API 가 없어
 * 열면 오류만 나므로 메뉴에서 뺀다.
 */
export const isMenuShown = (entry: { isMock?: boolean; hidden?: boolean }) =>
  !entry.hidden && (IS_MOCKING || !entry.isMock);

/** 현재 경로가 속한 1뎁스 그룹 키를 찾는다. */
export const findActiveGroupKey = (pathname: string): string | undefined => {
  const matched = ADMIN_MENU.find((group) => {
    // 단독 메뉴는 상세 경로(/legal/1)도 같은 메뉴로 취급한다.
    if (group.href) {
      return (
        group.href === pathname ||
        (group.href !== "/" && pathname.startsWith(`${group.href}/`))
      );
    }

    return group.children?.some((child) => isMenuItemActive(child, pathname));
  });

  return matched?.key;
};

/**
 * 2뎁스 활성 판정.
 *
 * 목록 경로(`/users`)가 다른 하위 경로(`/users/official`)를
 * 함께 활성화하지 않도록 상세 경로만 prefix 매칭을 허용한다.
 * 더 깊은 형제 메뉴가 현재 경로를 담당하면(`/universes/characters/1`) 그쪽에 양보한다.
 */
export const isMenuItemActive = (
  item: AdminMenuItem,
  pathname: string,
): boolean => {
  if (pathname === item.href) return true;
  if (!pathname.startsWith(`${item.href}/`)) return false;

  const hasDeeperSibling = ADMIN_MENU.some((group) =>
    group.children?.some(
      (child) =>
        child.href !== item.href &&
        child.href.startsWith(`${item.href}/`) &&
        (child.href === pathname || pathname.startsWith(`${child.href}/`)),
    ),
  );

  return !hasDeeperSibling;
};

/** 이 경로를 담당하는 메뉴 항목(단독 메뉴 또는 하위 메뉴). */
const findRouteMenu = (
  pathname: string,
): { permission?: PermissionKey; isMock?: boolean } | undefined => {
  for (const group of ADMIN_MENU) {
    if (group.href) {
      const isMatched =
        group.href === pathname ||
        (group.href !== "/" && pathname.startsWith(`${group.href}/`));

      if (isMatched) return group;
    }

    const child = group.children?.find((item) => isMenuItemActive(item, pathname));

    if (child) return child;
  }

  return undefined;
};

/**
 * 이 경로를 보려면 필요한 권한.
 *
 * 메뉴를 감추는 것만으로는 부족하다. 주소를 직접 치면 그대로 열리고,
 * 목록이 비어 보이는 것과 "볼 권한이 없는 것"을 운영자가 구분할 수 없다.
 * 메뉴 정의가 이미 화면별 권한을 알고 있으므로 여기서 되찾아 쓴다.
 */
export const findRoutePermission = (
  pathname: string,
): PermissionKey | undefined => findRouteMenu(pathname)?.permission;

/**
 * 실서버 환경에서 열 수 없는 MOCK 화면인지.
 *
 * 메뉴에서 뺀 MOCK 화면도 주소를 직접 치면 열린다. 붙을 API 가 없어 오류만 나므로
 * 본문을 안내로 바꾼다. 대시보드(`/`)는 화면이 직접 첫 메뉴로 넘기므로 여기서 빼 둔다.
 */
export const isUnavailableMockRoute = (pathname: string): boolean =>
  !IS_MOCKING && pathname !== "/" && !!findRouteMenu(pathname)?.isMock;
