import React from "react";
// 1. 방향 및 화살표
export { default as ArrowDown } from "./ArrowDown";
export { default as ArrowUp } from "./ArrowUp";
export { default as ChevronDown } from "./ChevronDown";
export { default as ChevronLeft } from "./ChevronLeft";
export { default as ChevronRight } from "./ChevronRight";
export { default as ExternalLink } from "./ExternalLink";

// 2. 메뉴 (좌측 네비게이션 전용)
export { default as Activity } from "./Activity";
export { default as Bell } from "./Bell";
export { default as Coin } from "./Coin";
export { default as CreditCard } from "./CreditCard";
export { default as Cpu } from "./Cpu";
export { default as Crown } from "./Crown";
export { default as Dashboard } from "./Dashboard";
export { default as Download } from "./Download";
export { default as FileText } from "./FileText";
export { default as Flag } from "./Flag";
export { default as Globe } from "./Globe";
export { default as Hash } from "./Hash";
export { default as ImageIcon } from "./ImageIcon";
export { default as Layers } from "./Layers";
export { default as ListLines } from "./ListLines";
export { default as Megaphone } from "./Megaphone";
export { default as MessageSquare } from "./MessageSquare";
export { default as Package } from "./Package";
export { default as QuestionCircle } from "./QuestionCircle";
export { default as Receipt } from "./Receipt";
export { default as Robot } from "./Robot";
export { default as Scale } from "./Scale";
export { default as Server } from "./Server";
export { default as ShieldAlert } from "./ShieldAlert";
export { default as ShieldCheck } from "./ShieldCheck";
export { default as Sliders } from "./Sliders";
export { default as Smartphone } from "./Smartphone";
export { default as Star } from "./Star";
export { default as UserPlus } from "./UserPlus";
export { default as Users } from "./Users";

// 3. 액션
export { default as Check } from "./Check";
export { default as CheckCircle } from "./CheckCircle";
export { default as Close } from "./Close";
export { default as Copy } from "./Copy";
export { default as Dots } from "./Dots";
export { default as Edit } from "./Edit";
export { default as Filter } from "./Filter";
export { default as Grip } from "./Grip";
export { default as Key } from "./Key";
export { default as Logout } from "./Logout";
export { default as Plus } from "./Plus";
export { default as Refresh } from "./Refresh";
export { default as Search } from "./Search";
export { default as Trash } from "./Trash";
export { default as Unlock } from "./Unlock";
export { default as Upload } from "./Upload";

// 4. 상태 및 기타 UI 요소
export { default as Ban } from "./Ban";
export { default as Calendar } from "./Calendar";
export { default as Eye } from "./Eye";
export { default as EyeOff } from "./EyeOff";
export { default as Gear } from "./Gear";
export { default as Info } from "./Info";
export { default as Moon } from "./Moon";
export { default as Sun } from "./Sun";
export { default as Warning } from "./Warning";

// 모든 아이콘이 공유할 타입
export interface IconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number | string;
}

// 아이콘의 틀만 담당하는 컴포넌트
export const IconWrapper = ({
  size = 24,
  className = "",
  children,
  ...props
}: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className}`}
    fill="currentColor"
    stroke="none"
    {...props}
  >
    {children}
  </svg>
);

/**
 * 관리자 아이콘은 라인(스트로크) 스타일로 통일한다.
 * plat-fe의 솔리드 아이콘과 구분되므로 별도 래퍼를 둔다.
 */
export const LineIconWrapper = ({
  children,
  ...props
}: IconProps & { children: React.ReactNode }) => (
  <IconWrapper
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </IconWrapper>
);
