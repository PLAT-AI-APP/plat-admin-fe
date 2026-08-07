import React from "react";
import { IconProps, LineIconWrapper } from ".";

const Scale = (props: IconProps) => {
  return (
    <LineIconWrapper {...props}>
      <path d="M12 4.5V21" />
      <path d="M7.5 21h9" />
      <path d="M4 7.5h16" />
      <path d="M4 7.5 1.6 14h4.8z" />
      <path d="M20 7.5 17.6 14h4.8z" />
      <circle cx="12" cy="4" r="1.4" />
    </LineIconWrapper>
  );
};

export default Scale;
