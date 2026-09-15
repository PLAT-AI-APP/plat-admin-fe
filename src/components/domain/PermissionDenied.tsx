"use client";

import { ShieldAlert } from "@/icons";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/store/useAdminStore";
import { permissionLabel, type PermissionKey } from "@/type/permission";
import Card from "@/components/ui/Card";

interface PermissionDeniedProps {
  required: PermissionKey;
  /** 카드 안에 넣지 않고 문단만 쓸 때 */
  bare?: boolean;
  className?: string;
}

/**
 * 권한이 없을 때 보여 주는 안내.
 *
 * **무엇이 없어서 막혔는지를 이름으로 말해 준다.**
 * "권한이 없습니다"만 띄우면 운영자는 무엇을 요청해야 하는지 몰라
 * 결국 최고관리자에게 "그냥 다 열어 달라"고 하게 되고, 그러면 권한을 나눈 의미가 사라진다.
 *
 * 그래서 필요한 권한 이름(`크레딧 수동 조정 > 지급 · 차감`)과 지금 직책을 함께 적는다.
 * 그대로 복사해 요청할 수 있어야 한다.
 */
const PermissionDenied = ({
  required,
  bare = false,
  className,
}: PermissionDeniedProps) => {
  const admin = useAdminStore((state) => state.admin);

  const body = (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-bg text-danger">
        <ShieldAlert size={24} />
      </span>

      <div className="flex flex-col gap-1">
        <p className="body-3 font-semibold text-font-0">
          이 화면을 볼 권한이 없습니다.
        </p>
        <p className="body-5 text-font-2">
          현재 직책은 <b className="text-font-1">{admin?.roleName ?? "-"}</b>
          입니다.
        </p>
      </div>

      {/* 요청할 때 그대로 복사할 수 있게 코드 형태로 둔다. */}
      <div className="flex flex-col items-center gap-1 rounded-field border border-border-main bg-subtle px-4 py-3">
        <span className="body-6 text-font-2">필요한 권한</span>
        <code className="body-5 font-semibold text-font-1">
          {permissionLabel(required)}
        </code>
      </div>

      <p className="body-6 text-font-2">
        최고관리자에게 위 권한을 요청하세요. (운영 &gt; 직책 · 권한)
      </p>
    </div>
  );

  return bare ? body : <Card noPadding>{body}</Card>;
};

export default PermissionDenied;
