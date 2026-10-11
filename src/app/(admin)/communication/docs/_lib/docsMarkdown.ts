import { DOCS_SLUG_PATTERN } from "@/schema/docs.schema";

/**
 * 제목에서 slug 를 제안한다. 영문 소문자 · 숫자만 남기고 나머지는 하이픈으로 잇는다.
 * 한글 제목처럼 남는 글자가 없으면 빈 값 — 사람이 직접 적거나 임시 slug 를 쓰게 둔다.
 */
export const slugify = (text: string): string =>
  text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

/** 제목으로 만들 수 없을 때 쓰는 임시 slug. 나중에 바꿔도 주소는 ID 로 찾는다. */
export const fallbackSlug = (prefix: "page" | "group", seed = Date.now()) =>
  `${prefix}-${seed}`;

export const isValidSlug = (slug: string) => DOCS_SLUG_PATTERN.test(slug);

export interface ParsedMarkdown {
  title: string;
  summary: string;
  slug: string;
  content: string;
  /** 업로드 없이는 깨질 상대경로 이미지 */
  relativeImages: string[];
}

/** front-matter 값의 감싼 따옴표를 벗긴다. */
const unquote = (value: string) => value.trim().replace(/^(['"])(.*)\1$/, "$2");

/** 단순 `key: value` 줄만 읽는다. 문서에 필요한 값은 title · summary · slug 뿐이다. */
const parseFrontMatter = (block: string): Record<string, string> =>
  Object.fromEntries(
    block
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => [match[1].toLowerCase(), unquote(match[2])]),
  );

const IMAGE_PATTERN = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

/** http(s) · data · blob · 절대경로(/) 가 아닌 이미지 주소 */
export const findRelativeImages = (content: string): string[] =>
  Array.from(content.matchAll(IMAGE_PATTERN), (match) => match[1]).filter(
    (src) => !/^(https?:|data:|blob:|\/)/i.test(src),
  );

/**
 * `.md` 파일 한 개를 문서 값으로 바꾼다.
 *
 * front-matter(`---` 로 감싼 머리)의 title · summary · slug 를 먼저 쓰고,
 * title 이 없으면 본문 첫 `# 제목` 줄을 제목으로 쓰고 본문에서 그 줄을 지운다 —
 * 사용자 사이트가 제목을 따로 그리므로 본문에 남기면 두 번 보인다.
 */
export const parseMarkdownFile = (raw: string): ParsedMarkdown => {
  let body = raw.replace(/^﻿/, "");
  let meta: Record<string, string> = {};

  const frontMatter = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (frontMatter) {
    meta = parseFrontMatter(frontMatter[1]);
    body = body.slice(frontMatter[0].length);
  }

  let title = meta.title ?? "";

  if (!title) {
    const heading = body.match(/^[ \t]*#[ \t]+(.+?)[ \t#]*$/m);

    if (heading) {
      title = heading[1].trim();
      body = body.replace(heading[0], "");
    }
  }

  const content = body.replace(/^\s*\n/, "").trimEnd();

  return {
    title: title.slice(0, 100),
    summary: (meta.summary ?? meta.description ?? "").slice(0, 300),
    slug: meta.slug && isValidSlug(meta.slug) ? meta.slug : "",
    content,
    relativeImages: findRelativeImages(content),
  };
};

export const readTextFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });

/** 파일 이름(확장자 제외)에서 만든 slug. front-matter 에도 제목에도 쓸 것이 없을 때 쓴다. */
export const slugFromFileName = (fileName: string) =>
  slugify(fileName.replace(/\.(md|markdown)$/i, ""));
