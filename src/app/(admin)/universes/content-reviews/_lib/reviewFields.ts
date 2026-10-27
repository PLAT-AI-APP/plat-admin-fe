import { SERVICE_LANGUAGES, type ServiceLanguage } from "@/type/language";
import type { ContentReviewInput } from "@/type/contentReview";

/**
 * 검수 입력 스냅샷을 화면에 그릴 묶음으로 바꾼다.
 *
 * 세계관 검수는 문구를 `universe.KO.title` · `character.{id}.KO.name` 같은 경로로 펼쳐 보낸다.
 * 관리자는 세계관 · 캐릭터 · 시나리오 · 에셋 단위로 읽어야 판단할 수 있어 경로를 다시 묶는다.
 * 캐릭터 단독 검수는 `texts`로 오므로 같은 모양으로 맞춘다.
 */

export interface ReviewFieldRow {
  label: string;
  value: string;
  /** 에셋처럼 언어가 없는 문구는 null. 어느 언어를 골라도 보인다. */
  language: ServiceLanguage | null;
}

export interface ReviewFieldSection {
  key: string;
  title: string;
  rows: ReviewFieldRow[];
}

export interface ReviewFieldView {
  /** 세계관의 성인 설정. 세계관이 아니면 null */
  adult: boolean | null;
  /** 문구가 있는 언어. 앱 노출 순서를 따른다. */
  languages: ServiceLanguage[];
  sections: ReviewFieldSection[];
}

const UNIVERSE_LABEL: Record<string, string> = {
  title: "제목",
  introduce: "한 줄 소개",
  description: "소개",
  detailSetting: "상세 설정",
};

const CHARACTER_LABEL: Record<string, string> = {
  name: "이름",
  description: "소개",
  detailSetting: "상세 설정",
};

const SCENARIO_LABEL: Record<string, string> = {
  title: "제목",
  description: "설명",
  content: "본문",
};

const toLanguage = (value: string | undefined): ServiceLanguage | null =>
  SERVICE_LANGUAGES.includes(value as ServiceLanguage) ? (value as ServiceLanguage) : null;

export const buildReviewFieldView = (input: ContentReviewInput): ReviewFieldView => {
  const sections = new Map<string, ReviewFieldSection>();
  let adult: boolean | null = null;
  let characterCount = 0;
  let scenarioCount = 0;

  /** 서버가 보낸 순서(세계관 → 캐릭터 → 시나리오 → 에셋)대로 묶음을 만든다. */
  const sectionOf = (key: string, title: () => string) => {
    let section = sections.get(key);
    if (!section) {
      section = { key, title: title(), rows: [] };
      sections.set(key, section);
    }
    return section;
  };

  input.fields.forEach(({ path, value }) => {
    const parts = path.split(".");
    const [kind] = parts;

    if (path === "adult") {
      adult = value === "true";
      return;
    }
    if (kind === "universe" && parts.length === 3) {
      const [, language, key] = parts;
      sectionOf("universe", () => "세계관").rows.push({
        label: UNIVERSE_LABEL[key] ?? key,
        value,
        language: toLanguage(language),
      });
      return;
    }
    if (kind === "character" && parts.length === 4) {
      const [, id, language, key] = parts;
      sectionOf(`character.${id}`, () => `캐릭터 ${++characterCount}`).rows.push({
        label: CHARACTER_LABEL[key] ?? key,
        value,
        language: toLanguage(language),
      });
      return;
    }
    if (kind === "scenario" && parts.length === 4) {
      const [, order, language, key] = parts;
      sectionOf(`scenario.${order}`, () => `시나리오 ${++scenarioCount}`).rows.push({
        label: SCENARIO_LABEL[key] ?? key,
        value,
        language: toLanguage(language),
      });
      return;
    }
    if (kind === "asset" && parts.length >= 3) {
      // 에셋 이름에 점이 들어갈 수 있어 마지막 조각만 항목으로 본다. 이름은 사용 상황의 라벨로 쓴다.
      const key = parts[parts.length - 1];
      if (key !== "situation") return;
      sectionOf("asset", () => "에셋").rows.push({
        label: parts.slice(1, -1).join("."),
        value,
        language: null,
      });
      return;
    }
    // 서버가 새 항목을 보내도 빠뜨리지 않고 경로째 보여 준다.
    sectionOf("etc", () => "기타").rows.push({ label: path, value, language: null });
  });

  input.texts.forEach(({ language, name, description, detailSetting }) => {
    const rows = sectionOf("character", () => "캐릭터").rows;
    rows.push(
      { label: CHARACTER_LABEL.name, value: name, language },
      { label: CHARACTER_LABEL.description, value: description, language },
      { label: CHARACTER_LABEL.detailSetting, value: detailSetting, language },
    );
  });

  const sectionList = [...sections.values()];
  const present = new Set(sectionList.flatMap((section) => section.rows.map((row) => row.language)));

  return {
    adult,
    languages: SERVICE_LANGUAGES.filter((language) => present.has(language)),
    sections: sectionList,
  };
};

/** 세계관 이름. 한국어 제목을 먼저 쓰고, 없으면 아무 언어의 제목을 쓴다. */
export const findUniverseTitle = (input: ContentReviewInput) =>
  input.fields.find((field) => field.path === "universe.KO.title")?.value ||
  input.fields.find((field) => /^universe\.[A-Z]+\.title$/.test(field.path))?.value;
