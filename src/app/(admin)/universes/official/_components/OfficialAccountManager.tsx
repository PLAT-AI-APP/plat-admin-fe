"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useOfficialAccountListQuery } from "@/api/official/getOfficialAccountList";
import { useOfficialAccountMutation } from "@/api/official/mutateOfficialAccount";
import { Crown, Plus, Trash } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { resolveImageUrl } from "@/lib/imageUrl";
import { showErrorToast } from "@/lib/toast";
import { cn, formatWithCommas } from "@/lib/utils";
import {
  officialAccountSchema,
  type OfficialAccountSchema,
} from "@/schema/officialAccount.schema";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import type { OfficialAccount } from "@/type/official";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EntityImage from "@/components/ui/EntityImage";
import FormField from "@/components/ui/FormField";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";
import Table, { type TableColumn } from "@/components/ui/Table";
import OfficialUniversePanel from "./OfficialUniversePanel";

/**
 * 공식 계정 관리.
 *
 * 서버는 세계관마다 공식 값을 저장하지 않고, **공식으로 지정된 유저의 세계관을
 * 공식으로 판정한다.** 그래서 이 화면에서 등록하는 것은 콘텐츠가 아니라 유저 ID다.
 * 계정을 등록·해제하면 그 계정이 가진 세계관 전부의 공식 표시가 함께 바뀐다.
 */
const OfficialAccountManager = () => {
  const router = useRouter();
  const canWrite = useHasPermission("officialAccount:write");
  const canDelete = useHasPermission("officialAccount:delete");
  const { data, isLoading } = useOfficialAccountListQuery();
  const { registerMutation, releaseMutation } = useOfficialAccountMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OfficialAccountSchema>({
    resolver: zodResolver(officialAccountSchema),
    defaultValues: { userId: "" },
  });

  const accounts = data ?? [];
  // 크리에이터가 없어 실제로는 공식 판정에 쓰이지 않는 계정
  const idleAccounts = accounts.filter((account) => !account.creatorId);

  const handleRegister = (values: OfficialAccountSchema) => {
    registerMutation.mutate(values.userId, {
      onSuccess: () => reset(),
      // 유저를 못 찾거나 이미 등록된 경우를 입력 자리에서 바로 알려 준다.
      onError: (error) => showErrorToast(error),
    });
  };

  const handleRelease = (account: OfficialAccount) => {
    openConfirm({
      title: "공식 지정을 해제할까요?",
      description: `'${account.nickname}'의 세계관 ${account.universeCount}건에서 공식 표시가 사라집니다.`,
      warning:
        "메인 노출의 '공식 캐릭터 맛보기' 후보에서도 함께 빠집니다. 세계관 자체는 삭제되지 않습니다.",
      confirmText: "해제",
      tone: "danger",
      onConfirm: () => releaseMutation.mutateAsync(account.userId),
    });
  };

  const actionColumn: TableColumn<OfficialAccount> = {
    key: "actions",
    header: "",
    width: "56px",
    align: "center",
    render: (row) => (
      // 행 클릭(유저 상세 이동)과 겹치지 않도록 액션 영역의 클릭은 여기서 멈춘다.
      <div
        className="flex items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <IconButton
          label="공식 지정 해제"
          icon={<Trash size={16} />}
          tone="danger"
          onClick={() => handleRelease(row)}
        />
      </div>
    ),
  };

  const columns: TableColumn<OfficialAccount>[] = [
    {
      key: "account",
      header: "계정",
      width: "240px",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          {/* 관리자 서버는 FileId → URL을 해석하지 못한다. 빈 src를 받는 자리라 EntityImage가 자리표시를 그린다. */}
          <EntityImage
            src={resolveImageUrl(
              row.profileImageUrl,
              row.profileImageFileId,
              "USER_PROFILE",
              "SQ80",
            )}
            alt={row.nickname}
            ratio="square"
            shape="circle"
            fileId={row.profileImageFileId}
            className="w-9 shrink-0"
          />

          <div className="min-w-0">
            <p className="truncate body-4 font-medium text-font-1">
              {row.nickname}
            </p>
            <p className="mt-0.5 body-6 text-font-2 tabular-nums">
              #{row.userId}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "creator",
      header: "크리에이터",
      align: "center",
      render: (row) =>
        row.creatorId ? (
          <Badge tone="success">연결됨</Badge>
        ) : (
          <Badge tone="warning">없음</Badge>
        ),
    },
    {
      key: "universeCount",
      header: "공식 세계관",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.universeCount),
    },
    {
      key: "characterCount",
      header: "캐릭터",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.characterCount),
    },
    {
      key: "registeredBy",
      header: "등록자",
      render: (row) => (
        <span className="body-5 text-font-2">{row.registeredBy}</span>
      ),
    },
    {
      key: "registeredAt",
      header: "등록일",
      align: "right",
      numeric: true,
      render: (row) => (
        <span className="body-5 text-font-2">
          {formatDate(row.registeredAt)}
        </span>
      ),
    },
    // 해제 권한이 없으면 열 자체를 그리지 않는다. 못 누르는 버튼을 남겨 두지 않는다.
    ...(canDelete ? [actionColumn] : []),
  ];

  return (
    <>
      <Alert tone="info" title="공식 여부는 캐릭터가 아니라 계정에 붙습니다.">
        여기에 등록한 유저의 크리에이터가 만든 세계관이 <b>공식</b>으로 표시되고,
        메인 &apos;공식 캐릭터 맛보기&apos; 후보가 됩니다. 서버는 조회할 때마다 이
        목록으로 다시 판정하므로, 계정을 해제하면 해당 세계관의 공식 표시가 즉시
        사라집니다. (배포 없이 이 화면에서 바로 반영됩니다.)
      </Alert>

      {idleAccounts.length > 0 && (
        <Alert tone="warning" title="크리에이터가 없어 노출되지 않는 계정이 있습니다.">
          {idleAccounts.map((account) => account.nickname).join(", ")} —
          크리에이터 전환을 하지 않은 계정은 공식 판정 대상이 없어 목록에만
          남습니다. 서버도 이 경우 경고 로그만 남기고 건너뜁니다.
        </Alert>
      )}

      <Card
        title="공식으로 지정된 계정"
        description="유저 ID로 등록합니다. 등록·해제 이력은 운영 로그에 남습니다."
        noPadding
      >
        <form
          onSubmit={handleSubmit(handleRegister)}
          className={cn(
            "flex items-start gap-2 border-b border-border-main px-5 py-4",
            !canWrite && "hidden",
          )}
        >
          <FormField
            label="유저 ID"
            htmlFor="official-user-id"
            required
            error={errors.userId?.message}
            className="w-72"
          >
            <Input
              id="official-user-id"
              // Snowflake ID는 문자열로 다룬다. number 입력은 뒷자리를 깎을 수 있다.
              inputMode="numeric"
              placeholder="예) 1948372910293847561"
              hasError={Boolean(errors.userId)}
              {...register("userId")}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            leftIcon={<Plus size={15} />}
            isLoading={registerMutation.isPending}
            className="mt-[26px]"
          >
            공식 계정 등록
          </Button>
        </form>

        <Table
          columns={columns}
          rows={accounts}
          getRowKey={(row) => row.userId}
          isLoading={isLoading}
          skeletonRows={3}
          onRowClick={(row) => router.push(`/users/${row.userId}`)}
          emptyTitle="공식으로 지정된 계정이 없습니다."
          emptyDescription="유저 ID를 등록하면 그 계정의 세계관이 공식으로 표시됩니다."
          emptyAction={
            <span className="inline-flex items-center gap-1.5 body-5 text-font-2">
              <Crown size={15} />
              PLAT이 직접 운영하는 크리에이터 계정을 등록합니다.
            </span>
          }
        />
      </Card>

      <OfficialUniversePanel />
    </>
  );
};

export default OfficialAccountManager;
