import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  /** 다음에 무엇을 하면 되는지 안내한다. */
  description?: string;
  action?: ReactNode;
  className?: string;
}

const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && <span className="text-font-disabled">{icon}</span>}

      <p className="body-4 font-medium text-font-1">{title}</p>
      {description && <p className="body-5 text-font-2">{description}</p>}

      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};

export default EmptyState;
