import React, { useId } from "react";

interface AppIconProps {
  className?: string;
}

/**
 * 앱 아이콘(64x64 시안, plat-fe 와 같은 그림). 로그인 화면처럼 "PLAT 이라는 앱"을 그림으로 보여 주는 자리에 쓴다.
 *
 * 라이트·다크 시안은 바탕색만 달라 바탕을 --app-icon-bg 토큰으로 칠한다.
 * 그라데이션 id 는 한 화면에 여러 개 그려도 겹치지 않게 인스턴스마다 만든다.
 */
const AppIcon = ({ className }: AppIconProps) => {
  const gradientId = useId();

  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="64" height="64" style={{ fill: "var(--app-icon-bg)" }} />
      <path
        d="M32 52.1602H24V44.1602H32V52.1602Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M40.2066 12.1629C44.5294 12.2725 48 15.811 48 20.1602V52.1602H40V44.1602H32V36.1602H40V21.7602C40 20.8765 39.2837 20.1602 38.4 20.1602H24V12.1602H40L40.2066 12.1629Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M24 44.1602H16V20.1602H24V44.1602Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="26.4453"
          y1="47.644"
          x2="22.4824"
          y2="58.9562"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF5A1D" />
          <stop offset="1" stopColor="#FF5A1D" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default AppIcon;
