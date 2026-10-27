import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  hasError?: boolean;
}

const Textarea = ({
  hasError,
  className,
  rows = 4,
  ref,
  ...props
}: TextareaProps) => {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full rounded-field border bg-surface px-3 py-2.5 body-4 text-font-1 transition outline-none",
        "placeholder:text-font-disabled",
        "focus:border-brand focus:ring-2 focus:ring-brand-opacity",
        "disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60",
        hasError ? "border-danger" : "border-border-main",
        className,
      )}
      {...props}
    />
  );
};

export default Textarea;
