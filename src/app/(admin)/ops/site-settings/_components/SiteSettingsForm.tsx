"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  useSiteSettingsMutation,
  useSiteSettingsQuery,
} from "@/api/ops/siteSettings";
import { formatDateTime } from "@/lib/dayjs";
import {
  BETA_BANNER_MESSAGE_MAX,
  siteSettingsSchema,
  type SiteSettingsSchema,
} from "@/schema/siteSettings.schema";
import { useHasPermission } from "@/store/useAdminStore";
import { SERVICE_LANGUAGES, SERVICE_LANGUAGE_LABEL } from "@/type/language";
import type { SiteSettings } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import Switch from "@/components/ui/Switch";

type TextFieldName = Exclude<
  keyof SiteSettingsSchema,
  "betaBannerEnabled" | "betaBannerMessages"
>;

interface TextFieldDef {
  name: TextFieldName;
  label: string;
  placeholder: string;
  maxLength: number;
}

/** 입력 묶음. 푸터에 실리는 순서와 같다. */
const SECTIONS: {
  title: string;
  description: string;
  fields: TextFieldDef[];
}[] = [
  {
    title: "사업자 정보",
    description:
      "전자상거래법상 푸터에 표시해야 하는 정보입니다. PG 심사 때 그대로 확인합니다.",
    fields: [
      {
        name: "companyName",
        label: "상호",
        placeholder: "주식회사 플랫",
        maxLength: 100,
      },
      {
        name: "representative",
        label: "대표자",
        placeholder: "홍길동",
        maxLength: 50,
      },
      {
        name: "businessNumber",
        label: "사업자등록번호",
        placeholder: "123-45-67890",
        maxLength: 20,
      },
      {
        name: "mailOrderNumber",
        label: "통신판매업 신고번호",
        placeholder: "제2026-서울강남-0000호 (신고 전이면 비워 둡니다)",
        maxLength: 50,
      },
      {
        name: "address",
        label: "사업장 주소",
        placeholder: "서울특별시 강남구 ...",
        maxLength: 200,
      },
    ],
  },
  {
    title: "고객센터",
    description: "유저가 문의할 수 있는 연락처입니다.",
    fields: [
      {
        name: "phone",
        label: "전화",
        placeholder: "02-0000-0000",
        maxLength: 30,
      },
      {
        name: "email",
        label: "이메일",
        placeholder: "support@example.com",
        maxLength: 100,
      },
      {
        name: "supportHours",
        label: "운영 시간",
        placeholder: "평일 10:00 - 18:00 (점심 12:00 - 13:00)",
        maxLength: 100,
      },
    ],
  },
  {
    title: "개인정보보호책임자 · 호스팅",
    description: "개인정보처리방침과 같은 값이어야 합니다.",
    fields: [
      {
        name: "privacyOfficer",
        label: "개인정보보호책임자",
        placeholder: "홍길동",
        maxLength: 50,
      },
      {
        name: "privacyOfficerContact",
        label: "책임자 연락처",
        placeholder: "privacy@example.com",
        maxLength: 100,
      },
      {
        name: "hostingProvider",
        label: "호스팅 서비스 제공자",
        placeholder: "Amazon Web Services",
        maxLength: 100,
      },
    ],
  },
];

const EMPTY_MESSAGES = Object.fromEntries(
  SERVICE_LANGUAGES.map((language) => [language, ""]),
) as SiteSettingsSchema["betaBannerMessages"];

const EMPTY_VALUES: SiteSettingsSchema = {
  companyName: "",
  representative: "",
  businessNumber: "",
  mailOrderNumber: "",
  address: "",
  phone: "",
  email: "",
  supportHours: "",
  privacyOfficer: "",
  privacyOfficerContact: "",
  hostingProvider: "",
  betaBannerEnabled: false,
  betaBannerMessages: EMPTY_MESSAGES,
};

const toFormValues = (settings: SiteSettings): SiteSettingsSchema => ({
  companyName: settings.companyName ?? "",
  representative: settings.representative ?? "",
  businessNumber: settings.businessNumber ?? "",
  mailOrderNumber: settings.mailOrderNumber ?? "",
  address: settings.address ?? "",
  phone: settings.phone ?? "",
  email: settings.email ?? "",
  supportHours: settings.supportHours ?? "",
  privacyOfficer: settings.privacyOfficer ?? "",
  privacyOfficerContact: settings.privacyOfficerContact ?? "",
  hostingProvider: settings.hostingProvider ?? "",
  betaBannerEnabled: settings.betaBannerEnabled,
  betaBannerMessages: {
    ...EMPTY_MESSAGES,
    ...Object.fromEntries(
      Object.entries(settings.betaBannerMessages ?? {}).map(([key, value]) => [
        key,
        value ?? "",
      ]),
    ),
  },
});

/** 카드 머리. 배치 · 유저 상세와 같은 모양이다. */
const SectionHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
    <div className="flex flex-col">
      <p className="body-4 font-semibold text-font-1">{title}</p>
      <p className="body-6 text-font-2">{description}</p>
    </div>
    {action}
  </div>
);

/**
 * 사이트 설정.
 *
 * 사용자 사이트 푸터의 사업자 정보와 베타 배너를 한 번에 저장한다. 비운 칸은 푸터에서 감춘다.
 * 저장 권한(`siteSetting:write`)이 없으면 읽기만 한다.
 */
const SiteSettingsForm = () => {
  const canWrite = useHasPermission("siteSetting:write");
  const { data, isLoading, isError, error } = useSiteSettingsQuery();
  const saveMutation = useSiteSettingsMutation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SiteSettingsSchema>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 서버 값이 바뀔 때(처음 읽기 · 저장 직후)만 폼을 맞춘다.
  useEffect(() => {
    if (data) reset(toFormValues(data));
  }, [data, reset]);

  const values = useWatch({ control });

  const submit = handleSubmit((formValues) => {
    saveMutation.mutate({
      ...formValues,
      /* 비운 언어는 보내지 않는다. 사용자 화면이 기본 문구를 쓴다. */
      betaBannerMessages: Object.fromEntries(
        Object.entries(formValues.betaBannerMessages).filter(
          ([, message]) => message.trim() !== "",
        ),
      ),
    });
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-64 w-full rounded-card" />
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <EmptyState
          title="사이트 설정을 불러오지 못했습니다."
          description={error?.message}
        />
      </Card>
    );
  }

  /* 미리보기는 지금 입력값으로 그린다. 빈 칸은 실제 푸터처럼 감춘다. */
  const previewLines = [
    [
      values.companyName,
      values.representative && `대표 ${values.representative}`,
      values.businessNumber && `사업자등록번호 ${values.businessNumber}`,
      values.mailOrderNumber && `통신판매업 신고 ${values.mailOrderNumber}`,
    ],
    [values.address],
    [
      values.phone && `고객센터 ${values.phone}`,
      values.email,
      values.supportHours,
    ],
    [
      values.privacyOfficer &&
        `개인정보보호책임자 ${values.privacyOfficer}${values.privacyOfficerContact ? ` (${values.privacyOfficerContact})` : ""}`,
      values.hostingProvider && `호스팅 ${values.hostingProvider}`,
    ],
  ]
    .map((line) =>
      line
        .map((item) => item?.trim())
        .filter(Boolean)
        .join(" · "),
    )
    .filter(Boolean);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {!values.mailOrderNumber?.trim() && (
        <Alert tone="warning" title="통신판매업 신고번호가 비어 있습니다.">
          PG 심사 전에 채워야 합니다. 신고를 마치면 번호를 입력해 저장해 주세요.
          비어 있는 동안은 푸터에서 이 항목이 빠집니다.
        </Alert>
      )}

      {!canWrite && (
        <Alert tone="info" title="읽기 전용입니다.">
          사이트 설정을 바꾸려면 &apos;사이트 설정 &gt; 등록 · 수정&apos; 권한이
          필요합니다.
        </Alert>
      )}

      {SECTIONS.map((section) => (
        <Card key={section.title} noPadding>
          <SectionHeader
            title={section.title}
            description={section.description}
          />
          <div className="grid grid-cols-2 gap-x-4 px-5 pt-4 pb-1">
            {section.fields.map((field) => (
              <FormField
                key={field.name}
                label={field.label}
                htmlFor={`site-${field.name}`}
                error={errors[field.name]?.message}
                className={field.name === "address" ? "col-span-2" : undefined}
              >
                <Input
                  id={`site-${field.name}`}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  readOnly={!canWrite}
                  disabled={!canWrite}
                  hasError={Boolean(errors[field.name])}
                  {...register(field.name)}
                />
              </FormField>
            ))}
          </div>
        </Card>
      ))}

      <Card noPadding>
        <SectionHeader
          title="베타 배너"
          description={
            values.betaBannerEnabled
              ? "사용자 사이트 상단에 베타 안내가 뜹니다. 비운 언어는 기본 문구를 씁니다."
              : "꺼져 있습니다. 켜면 사용자 사이트 상단에 베타 안내가 뜹니다. 비운 언어는 기본 문구를 씁니다."
          }
          action={
            <Controller
              control={control}
              name="betaBannerEnabled"
              render={({ field }) => (
                <Switch
                  label="베타 배너 켜기"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={!canWrite}
                />
              )}
            />
          }
        />
        <div className="grid grid-cols-2 gap-x-4 px-5 pt-4 pb-1">
          {SERVICE_LANGUAGES.map((language) => (
            <FormField
              key={language}
              label={`${SERVICE_LANGUAGE_LABEL[language]} (${language})`}
              htmlFor={`site-banner-${language}`}
              hint={`${values.betaBannerMessages?.[language]?.length ?? 0}/${BETA_BANNER_MESSAGE_MAX}`}
              error={errors.betaBannerMessages?.[language]?.message}
            >
              <Input
                id={`site-banner-${language}`}
                placeholder="비우면 기본 문구"
                maxLength={BETA_BANNER_MESSAGE_MAX}
                readOnly={!canWrite}
                disabled={!canWrite}
                hasError={Boolean(errors.betaBannerMessages?.[language])}
                {...register(`betaBannerMessages.${language}`)}
              />
            </FormField>
          ))}
        </div>
      </Card>

      <Card noPadding>
        <SectionHeader
          title="푸터 미리보기"
          description="지금 입력한 값으로 그린 푸터입니다. 빈 칸은 실제 화면처럼 감춥니다."
        />
        <div className="flex flex-col gap-1 px-5 py-4">
          {previewLines.length > 0 ? (
            previewLines.map((line) => (
              <p key={line} className="body-6 text-font-2">
                {line}
              </p>
            ))
          ) : (
            <p className="body-6 text-font-disabled">표시할 정보가 없습니다.</p>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="body-6 text-font-2">
          {data?.updatedAt
            ? `마지막 수정 ${formatDateTime(data.updatedAt)} · ${data.updatedByName ?? "-"}`
            : "아직 저장한 적이 없습니다."}
        </p>

        {canWrite && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => data && reset(toFormValues(data))}
              disabled={!isDirty || saveMutation.isPending}
            >
              되돌리기
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isDirty}
              isLoading={saveMutation.isPending}
            >
              저장
            </Button>
          </div>
        )}
      </div>
    </form>
  );
};

export default SiteSettingsForm;
