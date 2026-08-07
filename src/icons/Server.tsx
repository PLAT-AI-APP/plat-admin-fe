import React from "react";
import { IconProps, LineIconWrapper } from ".";

const Server = (props: IconProps) => {
  return (
    <LineIconWrapper {...props}>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01" />
      <path d="M7 16.5h.01" />
    </LineIconWrapper>
  );
};

export default Server;
