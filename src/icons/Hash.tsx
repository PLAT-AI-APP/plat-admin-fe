import React from "react";
import { IconProps, LineIconWrapper } from ".";

const Hash = (props: IconProps) => {
  return (
    <LineIconWrapper {...props}>
      <path d="M9.5 3.5 7.5 20.5" />
      <path d="M16.5 3.5 14.5 20.5" />
      <path d="M3.5 8.5h17" />
      <path d="M3 15.5h17" />
    </LineIconWrapper>
  );
};

export default Hash;
