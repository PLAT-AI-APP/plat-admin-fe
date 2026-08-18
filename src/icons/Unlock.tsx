import React from "react";
import { IconProps, LineIconWrapper } from ".";

const Unlock = (props: IconProps) => {
  return (
    <LineIconWrapper {...props}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
      {/* 열린 자물쇠라 고리가 한쪽만 내려온다. */}
      <path d="M8.2 10.5V7.6a3.8 3.8 0 0 1 7.4-1.2" />
    </LineIconWrapper>
  );
};

export default Unlock;
