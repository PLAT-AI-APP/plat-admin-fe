"use client";

import Tabs from "@/components/ui/Tabs";
import {
  SERVICE_LANGUAGES,
  SERVICE_LANGUAGE_LABEL,
  type ServiceLanguage,
} from "@/type/language";
import type { LanguageCount } from "@/type/mainExposure";

interface LanguageScopeTabsProps {
  value: ServiceLanguage;
  onChange: (language: ServiceLanguage) => void;
  /**
   * 언어별 등록 건수. 아직 못 받았으면 숫자 없이 그린다.
   *
   * 숫자가 없으면 **어느 언어가 비어 있는지 눌러 보기 전에는 알 수 없다.**
   * 언어를 나눈 뒤 가장 흔한 사고가 "영어만 아무도 안 채웠다"라서 탭에 붙인다.
   */
  counts?: LanguageCount[];
  className?: string;
}

/**
 * 메인 노출 화면의 언어 탭.
 *
 * 배너 · 오늘의 PICK · 공식 캐릭터 맛보기 · 에셋 추천은 **언어마다 다른 목록**을
 * 가진다. 영어 번역이 없는 세계관이 영어 유저에게 나갈 수 없으므로, 후보도
 * 순서도 언어별로 따로 관리한다. 네 화면이 같은 탭을 써서 "지금 어느 언어를
 * 편집하고 있는지"가 화면마다 다르게 보이지 않게 한다.
 */
const LanguageScopeTabs = ({
  value,
  onChange,
  counts,
  className,
}: LanguageScopeTabsProps) => (
  <Tabs
    items={SERVICE_LANGUAGES.map((language) => ({
      label: SERVICE_LANGUAGE_LABEL[language],
      value: language,
      count: counts?.find((item) => item.language === language)?.count,
    }))}
    value={value}
    onChange={onChange}
    className={className}
  />
);

export default LanguageScopeTabs;
