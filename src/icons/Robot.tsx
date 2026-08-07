import React from "react";
import { IconProps, LineIconWrapper } from ".";

const Robot = (props: IconProps) => {
  return (
    <LineIconWrapper {...props}>
      <rect x="3.5" y="7" width="17" height="12" rx="3" />
      <circle cx="9.25" cy="13" r="1.2" />
      <circle cx="14.75" cy="13" r="1.2" />
      <path d="M12 7V3.5" />
      <path d="M2 11.5v3" />
      <path d="M22 11.5v3" />
    </LineIconWrapper>
  );
};

export default Robot;
