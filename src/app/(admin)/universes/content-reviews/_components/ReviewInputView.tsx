"use client";

import { useMemo, useState } from "react";
import type { ContentReviewInput } from "@/type/contentReview";
import { SERVICE_LANGUAGE_LABEL, type ServiceLanguage } from "@/type/language";
import Badge from "@/components/ui/Badge";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import { buildReviewFieldView } from "../_lib/reviewFields";

interface ReviewInputViewProps {
  input: ContentReviewInput;
}

/**
 * 검수 시점의 문구. 관리자가 AI 사유만 보고 판정하지 않도록 실제로 검수된 내용을 그대로 보여 준다.
 * 언어마다 문구가 따로 검수되므로 한 번에 한 언어씩 본다.
 */
const ReviewInputView = ({ input }: ReviewInputViewProps) => {
  const view = useMemo(() => buildReviewFieldView(input), [input]);
  const [language, setLanguage] = useState<ServiceLanguage | undefined>(view.languages[0]);

  const tabs: TabItem<ServiceLanguage>[] = view.languages.map((each) => ({
    label: SERVICE_LANGUAGE_LABEL[each],
    value: each,
  }));
  const sections = view.sections
    .map((section) => ({
      ...section,
      rows: section.rows.filter((row) => row.language === null || row.language === language),
    }))
    .filter((section) => section.rows.length > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="body-6 text-font-2">검수 내용</span>
          {view.adult !== null && (
            <Badge tone={view.adult ? "danger" : "neutral"}>
              {view.adult ? "성인 세계관" : "일반 세계관"}
            </Badge>
          )}
        </span>
        {language && tabs.length > 1 && <Tabs items={tabs} value={language} onChange={setLanguage} />}
      </div>

      {sections.map((section) => (
        <section key={section.key} className="flex flex-col gap-1.5 rounded-card border border-border-main p-3">
          <h4 className="body-5 font-medium text-font-1">{section.title}</h4>
          <dl className="flex flex-col gap-1.5">
            {section.rows.map((row, index) => (
              <div key={`${row.label}-${index}`} className="flex gap-3">
                <dt className="body-6 w-24 shrink-0 text-font-2">{row.label}</dt>
                {/* 상세 설정 · 시나리오 본문은 수천 자라 칸 안에서 스크롤한다. */}
                <dd className="body-5 max-h-48 min-w-0 flex-1 overflow-y-auto whitespace-pre-wrap wrap-anywhere text-font-1">
                  {row.value || <span className="text-font-disabled">-</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
};

export default ReviewInputView;
