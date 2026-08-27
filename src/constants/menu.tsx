import { ReactNode } from "react";
import type { PermissionKey } from "@/type/permission";
import {
  Bell,
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
  ImageIcon,
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
} from "@/icons";
import type { PendingCounts } from "@/type/ops";

export interface AdminMenuItem {
  label: string;
  href: string;
  icon?: ReactNode;
  /** 이 메뉴를 보려면 필요한 권한. 없으면 누구나 본다. */
  permission?: PermissionKey;
  /** MVP 범위에서 제외된 기능. 메뉴에 배지로 표시한다. */
  isExcludedFromMvp?: boolean;
  /**
   * 화면만 만들어 둔 MOCK 기능.
   *
   * **지금은 다른 도구로 운영 중이라 MVP에서 구현하지 않는다.**
   * 메뉴에서 지우면 나중에 왜 없는지 아무도 모르고, 배지 없이 두면
   * 저장한 값이 실제로 반영되는 줄 안다.
   */
  isMock?: boolean;
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
 * 좌측 네비게이션 정의.
 *
 * 분류 기준
 * 1) 1뎁스는 운영 대상 도메인 단위로 묶는다. (화면 수 기준이 아니다)
 * 2) 2뎁스는 도메인 내부의 업무 단위(목록/관리 · 정책 · 이력)다.
 * 3) 하위가 1개뿐인 도메인은 2뎁스를 만들지 않고 단독 메뉴로 둔다.
 *
 * 자세한 근거는 docs/ADMIN_PLAN.md 2장 참고.
 */
export const ADMIN_MENU: AdminMenuGroup[] = [
  {
    key: "dashboard",
    label: "대시보드",
    icon: <Dashboard size={ICON_SIZE} />,
    href: "/",
    permission: "dashboard:read",
  },
  {
    key: "main-exposure",
    label: "메인 노출 관리",
    icon: <Star size={ICON_SIZE} />,
    children: [
      {
        label: "배너 관리",
        href: "/main-exposure/banners",
        permission: "mainExposure:read",
        icon: <ImageIcon size={SUB_ICON_SIZE} />,
      },
      {
        label: "오늘의 PICK",
        href: "/main-exposure/today-pick",
        permission: "mainExposure:read",
        icon: <Star size={SUB_ICON_SIZE} />,
      },
      {
        label: "공식 캐릭터 맛보기",
        href: "/main-exposure/official-pick",
        permission: "mainExposure:read",
        icon: <Crown size={SUB_ICON_SIZE} />,
      },
      {
        label: "에셋 추천",
        href: "/main-exposure/asset-pick",
        permission: "mainExposure:read",
        icon: <Layers size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    /*
      1뎁스는 "세계관"이다. 세계관이 콘텐츠의 단위이고, 캐릭터는 그 안에 존재한다.
      캐릭터를 1뎁스로 두면 실제 구조와 반대라, 운영자가 캐릭터에서 세계관을
      찾으려 하게 된다.
    */
    key: "universes",
    label: "세계관",
    icon: <Globe size={ICON_SIZE} />,
    children: [
      {
        label: "전체 세계관",
        href: "/universes",
        permission: "universe:read",
        icon: <Globe size={SUB_ICON_SIZE} />,
      },
      {
        label: "캐릭터",
        href: "/universes/characters",
        permission: "character:read",
        icon: <Robot size={SUB_ICON_SIZE} />,
      },
      {
        label: "공식 계정",
        href: "/universes/official",
        permission: "officialAccount:read",
        icon: <Crown size={SUB_ICON_SIZE} />,
      },
      {
        label: "해시태그 관리",
        href: "/universes/hashtags",
        permission: "hashtag:read",
        icon: <Hash size={SUB_ICON_SIZE} />,
      },
      {
        label: "NSFW 키워드",
        href: "/universes/nsfw-keywords",
        permission: "nsfwKeyword:read",
        icon: <ShieldAlert size={SUB_ICON_SIZE} />,
      },
      {
        label: "채팅 내보내기",
        href: "/universes/chat-exports",
        permission: "chatExport:read",
        icon: <Download size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    key: "community",
    label: "커뮤니티",
    icon: <MessageSquare size={ICON_SIZE} />,
    children: [
      {
        label: "댓글 관리",
        href: "/community/comments",
        pendingKey: "comment",
        permission: "comment:read",
        icon: <MessageSquare size={SUB_ICON_SIZE} />,
      },
      {
        label: "신고 관리",
        href: "/community/reports",
        pendingKey: "report",
        permission: "report:read",
        icon: <Flag size={SUB_ICON_SIZE} />,
        isExcludedFromMvp: true,
      },
    ],
  },
  {
    key: "users",
    label: "유저/크리에이터",
    icon: <Users size={ICON_SIZE} />,
    children: [
      {
        label: "유저 관리",
        href: "/users",
        permission: "user:read",
        icon: <Users size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    key: "ai",
    label: "AI 운영",
    icon: <Cpu size={ICON_SIZE} />,
    children: [
      {
        label: "모델 카탈로그",
        href: "/ai/catalog",
        permission: "aiModel:read",
        icon: <Cpu size={SUB_ICON_SIZE} />,
      },
      {
        label: "AI 모델 관리",
        href: "/ai/models",
        permission: "aiModel:read",
        icon: <Sliders size={SUB_ICON_SIZE} />,
      },
      {
        label: "시스템 프롬프트",
        href: "/ai/prompts",
        permission: "systemPrompt:read",
        icon: <FileText size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    key: "billing",
    label: "결제/크레딧",
    icon: <CreditCard size={ICON_SIZE} />,
    children: [
      {
        label: "상품/결제금액 관리",
        href: "/billing/products",
        permission: "billingProduct:read",
        icon: <Package size={SUB_ICON_SIZE} />,
      },
      {
        label: "크레딧 정책 관리",
        href: "/billing/credit-policies",
        permission: "creditPolicy:read",
        icon: <Sliders size={SUB_ICON_SIZE} />,
      },
      {
        label: "크레딧 수동 조정",
        href: "/billing/credit-adjustments",
        permission: "creditAdjustment:read",
        icon: <Coin size={SUB_ICON_SIZE} />,
      },
      {
        label: "결제 장부",
        href: "/billing/ledger",
        permission: "ledger:read",
        icon: <Receipt size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    key: "communication",
    label: "커뮤니케이션",
    icon: <Megaphone size={ICON_SIZE} />,
    children: [
      {
        label: "공지사항 관리",
        href: "/communication/notices",
        permission: "notice:read",
        icon: <FileText size={SUB_ICON_SIZE} />,
      },
      {
        label: "Q&A 관리",
        href: "/communication/qna",
        pendingKey: "qna",
        permission: "qna:read",
        icon: <QuestionCircle size={SUB_ICON_SIZE} />,
      },
      {
        label: "알림 관리",
        href: "/communication/notifications",
        permission: "notification:read",
        icon: <Bell size={SUB_ICON_SIZE} />,
        isExcludedFromMvp: true,
      },
      {
        label: "선제 메시지",
        href: "/communication/proactive-messages",
        permission: "notification:read",
        icon: <MessageSquare size={SUB_ICON_SIZE} />,
        isExcludedFromMvp: true,
      },
      {
        label: "푸시 발송",
        href: "/communication/push",
        permission: "push:read",
        icon: <Megaphone size={SUB_ICON_SIZE} />,
        isExcludedFromMvp: true,
      },
    ],
  },
  {
    key: "legal",
    label: "법적 고지",
    icon: <Scale size={ICON_SIZE} />,
    href: "/legal",
    permission: "legal:read",
    /* 약관·운영 규정은 현재 Notion으로 관리한다. 화면은 이후 전환용으로 남겨 둔다. */
    isMock: true,
  },
  {
    key: "ops",
    label: "운영",
    icon: <ShieldCheck size={ICON_SIZE} />,
    children: [
      {
        label: "직책 · 권한",
        href: "/ops/roles",
        permission: "role:read",
        icon: <ShieldCheck size={SUB_ICON_SIZE} />,
      },
      {
        label: "관리자 관리",
        href: "/ops/managers",
        permission: "manager:read",
        icon: <UserPlus size={SUB_ICON_SIZE} />,
      },
      {
        label: "앱 버전 관리",
        href: "/ops/app-versions",
        permission: "appVersion:read",
        icon: <Smartphone size={SUB_ICON_SIZE} />,
        /* 강제 업데이트 정책을 아직 앱이 읽지 않는다. 화면은 붙일 때를 위해 남겨 둔다. */
        isMock: true,
      },
      {
        label: "서버 상태",
        href: "/ops/server",
        permission: "server:read",
        icon: <Server size={SUB_ICON_SIZE} />,
      },
      {
        label: "로그",
        href: "/ops/logs",
        permission: "log:read",
        icon: <ListLines size={SUB_ICON_SIZE} />,
      },
    ],
  },
];

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
 * 목록 경로(`/universes`)가 다른 하위 경로(`/universes/official`)를
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

/**
 * 이 경로를 보려면 필요한 권한.
 *
 * 메뉴를 감추는 것만으로는 부족하다. 주소를 직접 치면 그대로 열리고,
 * 목록이 비어 보이는 것과 "볼 권한이 없는 것"을 운영자가 구분할 수 없다.
 * 메뉴 정의가 이미 화면별 권한을 알고 있으므로 여기서 되찾아 쓴다.
 */
export const findRoutePermission = (
  pathname: string,
): PermissionKey | undefined => {
  for (const group of ADMIN_MENU) {
    if (group.href) {
      const isMatched =
        group.href === pathname ||
        (group.href !== "/" && pathname.startsWith(`${group.href}/`));

      if (isMatched) return group.permission;
    }

    const child = group.children?.find((item) => isMenuItemActive(item, pathname));

    if (child) return child.permission;
  }

  return undefined;
};
