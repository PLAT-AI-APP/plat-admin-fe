"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { UniverseTranslationView } from "@/type/character";
import {
  SERVICE_LANGUAGES,
  SERVICE_LANGUAGE_LABEL,
  type ServiceLanguage,
} from "@/type/language";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import CollapsibleText from "./CollapsibleText";
import LanguageChips from "./LanguageChips";
import { filledLanguagesOf, isFilledUniverseTranslation } from "./universeMeta";

interface UniverseTranslationPanelProps {
  translations: UniverseTranslationView[];
}

/** 본문 한 조각. 좌우 비교에서 같은 항목이 같은 높이에 오도록 라벨을 고정한다. */
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="caption-3 text-font-2">{label}</p>
    <div className="mt-1">{children}</div>
  </div>
);

const TranslationBody = ({
  language,
  translation,
  isMuted,
}: {
  language: ServiceLanguage;
  translation?: UniverseTranslationView;
  /** 비교 보기의 기준(한국어) 쪽. 눈이 선택 언어로 가도록 한 단계 죽인다. */
  isMuted?: boolean;
}) => (
  <div className="min-w-0">
    <p
      className={cn(
        "mb-2.5 title-6",
        isMuted ? "text-font-2" : "text-brand",
      )}
    >
      {SERVICE_LANGUAGE_LABEL[language]}
      {isMuted && " (기준)"}
    </p>

    {!translation || !isFilledUniverseTranslation(translation) ? (
      <p className="body-5 text-font-disabled">
        이 언어의 번역이 없습니다. 앱에서는 한국어로 대체되어 보입니다.
      </p>
    ) : (
      <div className="flex flex-col gap-3">
        <Field label="제목">
          <p className="title-5 text-font-1">{translation.title || "-"}</p>
        </Field>

        <Field label="소개">
          <p className="body-5 whitespace-pre-line text-font-2">
            {translation.introduce || "-"}
          </p>
        </Field>

        <Field label="설명">
          <CollapsibleText
            text={translation.description}
            clampClassName="line-clamp-4"
            threshold={240}
          />
        </Field>

        <div className="rounded-field border border-border-main bg-subtle p-3">
          <p className="mb-1 caption-3 text-font-2">상세 설정 (detailSetting)</p>
          <CollapsibleText text={translation.detailSetting} />
        </div>
      </div>
    )}
  </div>
);

/**
 * 언어별 세계관 본문 검수 패널.
 *
 * 세 가지를 한 화면에서 해결한다.
 *
 * 1) **어느 언어가 비었는지.** 6개 언어 칩을 항상 그려 미입력을 드러낸다.
 * 2) **한 언어를 제대로 읽기.** 세로로 늘어놓지 않고 탭으로 전환해, 긴 원문을
 *    스크롤 없이 한 언어씩 본다.
 * 3) **기계 번역이 원문과 맞는지.** 기계 번역은 문장이 매끄러워도 설정이 틀리는
 *    일이 잦다. 한국어를 옆에 붙여 두 열로 대조한다.
 */
const UniverseTranslationPanel = ({
  translations,
}: UniverseTranslationPanelProps) => {
  const filled = filledLanguagesOf(translations, isFilledUniverseTranslation);

  // 선택은 파생 상태 + 폴백이다. 초기값을 state에 굳히면 상세를 다시 불러왔을 때
  // 사라진 언어가 선택된 채로 남는다.
  const [picked, setPicked] = useState<ServiceLanguage | null>(null);
  const language = picked ?? filled[0] ?? "KO";

  const [isComparing, setComparing] = useState(false);

  const translationOf = (code: ServiceLanguage) =>
    translations.find((item) => item.language === code);

  const korean = translationOf("KO");
  // 한국어 자신을 보는 중이거나 한국어가 없으면 대조할 것이 없다.
  const canCompare = Boolean(korean) && language !== "KO";
  const isSideBySide = isComparing && canCompare;

  return (
    <Card
      title={`번역 · ${SERVICE_LANGUAGES.length}개 언어 중 ${filled.length}개`}
      description="detailSetting은 유저에게 보이지 않는 프롬프트성 설정입니다. 검수 시 함께 봅니다."
      action={
        canCompare ? (
          <Button
            size="sm"
            variant={isSideBySide ? "primary" : "secondary"}
            onClick={() => setComparing((prev) => !prev)}
          >
            한국어 대비
          </Button>
        ) : undefined
      }
      bodyClassName="flex flex-col gap-4"
    >
      {translations.length === 0 ? (
        <EmptyState
          title="등록된 번역이 없습니다."
          description="한국어 본문조차 없는 세계관입니다. 앱에서는 제목이 비어 보입니다."
        />
      ) : (
        <>
          <LanguageChips
            filled={filled}
            value={language}
            onChange={(next) => setPicked(next)}
          />

          {filled.length < SERVICE_LANGUAGES.length && (
            <p className="body-6 text-font-2">
              미입력 언어는 앱에서 한국어 본문으로 대체되어 노출됩니다.
            </p>
          )}

          <div
            className={cn(
              isSideBySide && "grid grid-cols-1 gap-5 md:grid-cols-2",
            )}
          >
            {isSideBySide && (
              <TranslationBody
                language="KO"
                translation={korean}
                isMuted
              />
            )}

            <TranslationBody
              language={language}
              translation={translationOf(language)}
            />
          </div>
        </>
      )}
    </Card>
  );
};

export default UniverseTranslationPanel;
