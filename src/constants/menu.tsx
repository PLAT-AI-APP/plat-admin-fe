import { ReactNode } from "react";
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

export interface AdminMenuItem {
  label: string;
  href: string;
  icon?: ReactNode;
  /** MVP 범위에서 제외된 기능. 메뉴에 배지로 표시한다. */
  isExcludedFromMvp?: boolean;
}

export interface AdminMenuGroup {
  /** 메뉴 펼침 상태를 저장할 키 */
  key: string;
  label: string;
  icon: ReactNode;
  /** 하위가 없는 단독 메뉴는 href를 갖는다. */
  href?: string;
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
  },
  {
    key: "main-exposure",
    label: "메인 노출 관리",
    icon: <Star size={ICON_SIZE} />,
    children: [
      {
        label: "배너 관리",
        href: "/main-exposure/banners",
        icon: <ImageIcon size={SUB_ICON_SIZE} />,
      },
      {
        label: "오늘의 PICK",
        href: "/main-exposure/today-pick",
        icon: <Star size={SUB_ICON_SIZE} />,
      },
      {
        label: "공식 캐릭터 맛보기",
        href: "/main-exposure/official-pick",
        icon: <Crown size={SUB_ICON_SIZE} />,
      },
      {
        label: "에셋 추천",
        href: "/main-exposure/asset-pick",
        icon: <Layers size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    key: "characters",
    label: "캐릭터",
    icon: <Robot size={ICON_SIZE} />,
    children: [
      {
        label: "전체 캐릭터",
        href: "/characters",
        icon: <Robot size={SUB_ICON_SIZE} />,
      },
      {
        label: "공식 캐릭터",
        href: "/characters/official",
        icon: <Crown size={SUB_ICON_SIZE} />,
      },
      {
        label: "세계관",
        href: "/characters/scenarios",
        icon: <Globe size={SUB_ICON_SIZE} />,
      },
      {
        label: "해시태그 관리",
        href: "/characters/hashtags",
        icon: <Hash size={SUB_ICON_SIZE} />,
      },
      {
        label: "NSFW 키워드",
        href: "/characters/nsfw-keywords",
        icon: <ShieldAlert size={SUB_ICON_SIZE} />,
      },
      {
        label: "채팅 내보내기",
        href: "/characters/chat-exports",
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
        icon: <MessageSquare size={SUB_ICON_SIZE} />,
      },
      {
        label: "신고 관리",
        href: "/community/reports",
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
        icon: <Users size={SUB_ICON_SIZE} />,
      },
      {
        label: "더미 크리에이터",
        href: "/users/dummy-creators",
        icon: <UserPlus size={SUB_ICON_SIZE} />,
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
        icon: <Cpu size={SUB_ICON_SIZE} />,
      },
      {
        label: "AI 모델 관리",
        href: "/ai/models",
        icon: <Sliders size={SUB_ICON_SIZE} />,
      },
      {
        label: "시스템 프롬프트",
        href: "/ai/prompts",
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
        icon: <Package size={SUB_ICON_SIZE} />,
      },
      {
        label: "크레딧 정책 관리",
        href: "/billing/credit-policies",
        icon: <Sliders size={SUB_ICON_SIZE} />,
      },
      {
        label: "크레딧 수동 조정",
        href: "/billing/credit-adjustments",
        icon: <Coin size={SUB_ICON_SIZE} />,
      },
      {
        label: "결제 장부",
        href: "/billing/ledger",
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
        icon: <FileText size={SUB_ICON_SIZE} />,
      },
      {
        label: "Q&A 관리",
        href: "/communication/qna",
        icon: <QuestionCircle size={SUB_ICON_SIZE} />,
      },
      {
        label: "알림 관리",
        href: "/communication/notifications",
        icon: <Bell size={SUB_ICON_SIZE} />,
        isExcludedFromMvp: true,
      },
      {
        label: "선제 메시지",
        href: "/communication/proactive-messages",
        icon: <MessageSquare size={SUB_ICON_SIZE} />,
        isExcludedFromMvp: true,
      },
      {
        label: "푸시 발송",
        href: "/communication/push",
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
  },
  {
    key: "ops",
    label: "운영",
    icon: <ShieldCheck size={ICON_SIZE} />,
    children: [
      {
        label: "관리자 관리",
        href: "/ops/managers",
        icon: <ShieldCheck size={SUB_ICON_SIZE} />,
      },
      {
        label: "앱 버전 관리",
        href: "/ops/app-versions",
        icon: <Smartphone size={SUB_ICON_SIZE} />,
      },
      {
        label: "서버 상태",
        href: "/ops/server",
        icon: <Server size={SUB_ICON_SIZE} />,
      },
      {
        label: "로그",
        href: "/ops/logs",
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
 * 목록 경로(`/characters`)가 다른 하위 경로(`/characters/official`)를
 * 함께 활성화하지 않도록 상세 경로만 prefix 매칭을 허용한다.
 */
export const isMenuItemActive = (
  item: AdminMenuItem,
  pathname: string,
): boolean => {
  if (pathname === item.href) return true;

  const isSiblingRoute = ADMIN_MENU.some((group) =>
    group.children?.some(
      (child) => child.href !== item.href && child.href === pathname,
    ),
  );

  return !isSiblingRoute && pathname.startsWith(`${item.href}/`);
};
