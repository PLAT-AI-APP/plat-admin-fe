import React from "react";
import { IconProps, LineIconWrapper } from ".";

const Smartphone = (props: IconProps) => {
  return (
    <LineIconWrapper {...props}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </LineIconWrapper>
  );
};

export default Smartphone;
