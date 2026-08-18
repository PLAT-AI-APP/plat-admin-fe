import PageHeader from "@/components/layout/PageHeader";
import RoleManager from "./_components/RoleManager";

export default function RolePage() {
  return (
    <>
      <PageHeader
        title="직책 · 권한"
        description="직책마다 할 수 있는 일을 정합니다. 관리자는 직책에 배정되고, 권한은 직책에서 가져옵니다."
      />

      <RoleManager />
    </>
  );
}
