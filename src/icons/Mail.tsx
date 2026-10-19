import { IconProps, LineIconWrapper } from ".";

const Mail = (props: IconProps) => {
  return (
    <LineIconWrapper {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </LineIconWrapper>
  );
};

export default Mail;
