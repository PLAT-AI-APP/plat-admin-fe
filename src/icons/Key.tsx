import React from "react";
import { IconProps, LineIconWrapper } from ".";

const Key = (props: IconProps) => {
  return (
    <LineIconWrapper {...props}>
      <circle cx="8" cy="16" r="3.4" />
      <path d="M10.4 13.6 20 4" />
      <path d="M16.6 7.4l2.2 2.2" />
      <path d="M14.2 9.8l2.2 2.2" />
    </LineIconWrapper>
  );
};

export default Key;
