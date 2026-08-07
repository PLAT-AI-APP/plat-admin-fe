import React from "react";
import { IconProps, LineIconWrapper } from ".";

const Crown = (props: IconProps) => {
  return (
    <LineIconWrapper {...props}>
      <path d="m3 7 3.5 3.2L12 4l5.5 6.2L21 7l-1.6 10.7a1 1 0 0 1-1 .8H5.6a1 1 0 0 1-1-.8z" />
    </LineIconWrapper>
  );
};

export default Crown;
