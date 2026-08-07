import React from "react";
import { IconProps, LineIconWrapper } from ".";

const QuestionCircle = (props: IconProps) => {
  return (
    <LineIconWrapper {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.6a2.6 2.6 0 0 1 5 .8c0 1.7-2.5 2.1-2.5 3.6" />
      <path d="M12 17.2h.01" />
    </LineIconWrapper>
  );
};

export default QuestionCircle;
