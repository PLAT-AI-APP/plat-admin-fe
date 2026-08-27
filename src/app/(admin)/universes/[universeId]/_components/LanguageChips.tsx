"use client";

import { cn } from "@/lib/utils";
import {
  SERVICE_LANGUAGES,
  SERVICE_LANGUAGE_LABEL,
  type ServiceLanguage,
} from "@/type/language";

interface LanguageChipsProps {
  /** 본문이 실제로 채워진 언어. 나머지는 "미입력"으로 그린다. */
  filled: ServiceLanguage[];
  value: ServiceLanguage;
  onChange: (language: ServiceLanguage) => void;
  className?: string;
}

/**
 * 서비스 언어 6종을 **항상 전부** 그리는 선택 칩.
 *
 * 있는 번역만 그리면 **비어 있는 언어가 화면에서 사라진다.** 앱은 번역이 없는
 * 언어를 한국어로 대체해 보여 주므로, 운영자는 "번역이 없다"는 사실 자체를
 * 화면에서 알 수 없게 된다. 미입력 언어도 자리를 차지해야 검수가 성립한다.
 *
 * 미입력 언어도 누를 수 있다. 눌러서 "정말 비어 있다"를 확인하는 것이 검수다.
 */
const LanguageChips = ({
  filled,
  value,
  onChange,
  className,
}: LanguageChipsProps) => (
  <div className={cn("flex flex-wrap gap-1.5", className)}>
    {SERVICE_LANGUAGES.map((language) => {
      const isFilled = filled.includes(language);
      const isActive = language === value;

      return (
        <button
          key={language}
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(language)}
          className={cn(
            "inline-flex items-center gap-1 rounded-chip border px-2.5 py-1 caption-2 transition",
            isActive
              ? "border-brand bg-brand-opacity text-brand"
              : isFilled
                ? "border-border-main text-font-2 hover:bg-surface-hover"
                : "border-dashed border-border-main text-font-disabled hover:bg-surface-hover",
          )}
        >
          {SERVICE_LANGUAGE_LABEL[language]}
          {!isFilled && <span className="caption-3">미입력</span>}
        </button>
      );
    })}
  </div>
);

export default LanguageChips;
