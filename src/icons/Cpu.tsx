import React from "react";
import { IconProps, LineIconWrapper } from ".";

const Cpu = (props: IconProps) => {
  return (
    <LineIconWrapper {...props}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
      <rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1" />
      <path d="M9 3v3.5" />
      <path d="M15 3v3.5" />
      <path d="M9 17.5V21" />
      <path d="M15 17.5V21" />
      <path d="M3 9h3.5" />
      <path d="M3 15h3.5" />
      <path d="M17.5 9H21" />
      <path d="M17.5 15H21" />
    </LineIconWrapper>
  );
};

export default Cpu;
