import type {
  DocsGroupDetail,
  DocsLocales,
  DocsPageDetail,
  DocsTreeNode,
} from "@/type/docs";
import { daysAgo } from "@/mocks/utils";

/**
 * 가이드 문서 목업 씨앗. 계약(`DOCS_API_CONTRACT.md`)의 관리자 응답 모양 그대로다.
 *
 * 그룹 · 페이지는 같은 부모 안에서 `sortOrder` 하나를 함께 쓴다.
 */
export interface MockDocsGroup extends DocsGroupDetail {
  sortOrder: number;
}

export interface MockDocsPage extends DocsPageDetail {
  sortOrder: number;
}

/** 서버 `GET /docs/locales` 와 같은 모양. 실서버에서는 서버 enum 이 정한다. */
export const MOCK_DOCS_LOCALES: DocsLocales = {
  defaultLocale: "ko",
  locales: [
    { code: "ko", name: "한국어" },
    { code: "en", name: "English" },
  ],
};

/** 목업 업로드가 돌려준 이미지. 그룹 응답의 아이콘 · 커버 주소를 여기서 찾는다. */
export const docsImages = new Map<string, string>();

const at = (days: number) => daysAgo(days);

export const docsGroups: MockDocsGroup[] = [
  {
    id: "1",
    parentId: null,
    slug: "user-guide",
    iconFileId: null,
    iconUrl: null,
    coverImageFileId: null,
    coverImageUrl: null,
    status: "VISIBLE",
    translations: [
      { locale: "ko", name: "유저 가이드", description: "캐릭터와 대화하는 유저를 위한 안내" },
      { locale: "en", name: "User Guide", description: "Guides for users chatting with characters" },
    ],
    sortOrder: 0,
    createdAt: at(30),
    updatedAt: at(3),
  },
  {
    id: "2",
    parentId: "1",
    slug: "getting-started",
    iconFileId: null,
    iconUrl: null,
    coverImageFileId: null,
    coverImageUrl: null,
    status: "VISIBLE",
    translations: [
      { locale: "ko", name: "시작하기", description: "가입부터 첫 대화까지" },
      { locale: "en", name: "Getting Started", description: null },
    ],
    sortOrder: 0,
    createdAt: at(30),
    updatedAt: at(10),
  },
  {
    id: "3",
    parentId: "2",
    slug: "account",
    iconFileId: null,
    iconUrl: null,
    coverImageFileId: null,
    coverImageUrl: null,
    status: "HIDDEN",
    translations: [{ locale: "ko", name: "계정", description: null }],
    sortOrder: 1,
    createdAt: at(20),
    updatedAt: at(20),
  },
  {
    id: "4",
    parentId: null,
    slug: "creator-guide",
    iconFileId: null,
    iconUrl: null,
    coverImageFileId: null,
    coverImageUrl: null,
    status: "VISIBLE",
    translations: [
      { locale: "ko", name: "제작자 가이드", description: "캐릭터를 만드는 제작자를 위한 안내" },
    ],
    sortOrder: 1,
    createdAt: at(25),
    updatedAt: at(5),
  },
];

export const docsPages: MockDocsPage[] = [
  {
    id: "10",
    groupId: "2",
    slug: "first-chat",
    status: "PUBLISHED",
    translations: [
      {
        locale: "ko",
        title: "첫 대화하기",
        summary: "캐릭터를 골라 첫 메시지를 보내는 방법",
        content:
          "## 캐릭터 고르기\n\n홈에서 마음에 드는 캐릭터를 누르세요.\n\n## 메시지 보내기\n\n- 입력칸에 하고 싶은 말을 적습니다.\n- **보내기**를 누르면 캐릭터가 답합니다.\n\n> 대화는 언제든 다시 이어서 할 수 있습니다.",
      },
      {
        locale: "en",
        title: "Your first chat",
        summary: "How to pick a character and send your first message",
        content: "## Pick a character\n\nTap a character you like on Home.",
      },
    ],
    sortOrder: 2,
    createdAt: at(28),
    updatedAt: at(2),
  },
  {
    id: "11",
    groupId: "1",
    slug: "faq",
    status: "DRAFT",
    translations: [
      {
        locale: "ko",
        title: "자주 묻는 질문",
        summary: null,
        content: "## 노트는 어떻게 충전하나요?\n\n상점에서 충전할 수 있습니다.",
      },
    ],
    sortOrder: 1,
    createdAt: at(15),
    updatedAt: at(15),
  },
  {
    id: "12",
    groupId: "3",
    slug: "withdrawal",
    status: "HIDDEN",
    translations: [
      { locale: "ko", title: "탈퇴하기", summary: null, content: "설정 › 계정 › 탈퇴에서 진행합니다." },
    ],
    sortOrder: 0,
    createdAt: at(12),
    updatedAt: at(12),
  },
  {
    id: "13",
    groupId: "4",
    slug: "make-character",
    status: "PUBLISHED",
    translations: [
      { locale: "ko", title: "캐릭터 만들기", summary: null, content: "## 기본 정보\n\n이름과 소개를 적습니다." },
      { locale: "en", title: "Create a character", summary: null, content: "## Basics\n\nEnter a name." },
    ],
    sortOrder: 0,
    createdAt: at(10),
    updatedAt: at(1),
  },
];

const nameOf = (translations: { locale: string; name?: string; title?: string }[]) => {
  const pick =
    translations.find((item) => item.locale === MOCK_DOCS_LOCALES.defaultLocale) ?? translations[0];

  return pick?.name ?? pick?.title ?? "";
};

/** 부모 아래 항목을 sortOrder 순으로 섞어 세운다. */
const childrenOf = (parentId: string | null, depth: number): DocsTreeNode[] => {
  const groups = docsGroups
    .filter((group) => group.parentId === parentId)
    .map((group) => ({ sortOrder: group.sortOrder, node: groupNode(group, depth) }));

  const pages =
    parentId === null
      ? []
      : docsPages
          .filter((page) => page.groupId === parentId)
          .map((page) => ({
            sortOrder: page.sortOrder,
            node: {
              type: "PAGE" as const,
              id: page.id,
              depth,
              status: page.status,
              name: nameOf(page.translations),
              locales: page.translations.map((item) => item.locale),
              children: [],
            },
          }));

  return [...groups, ...pages]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => item.node);
};

const groupNode = (group: MockDocsGroup, depth: number): DocsTreeNode => ({
  type: "GROUP",
  id: group.id,
  depth,
  status: group.status,
  name: nameOf(group.translations),
  locales: group.translations.map((item) => item.locale),
  children: childrenOf(group.id, depth + 1),
});

export const buildDocsTree = (): DocsTreeNode[] => childrenOf(null, 1);

export const groupDepth = (groupId: string | null): number => {
  let depth = 0;
  let current = groupId;

  while (current) {
    depth += 1;
    current = docsGroups.find((group) => group.id === current)?.parentId ?? null;
  }

  return depth;
};

/** 부모 안 맨 뒤 순서 */
export const nextSortOrder = (parentId: string | null) =>
  Math.max(
    -1,
    ...docsGroups.filter((group) => group.parentId === parentId).map((group) => group.sortOrder),
    ...docsPages.filter((page) => page.groupId === parentId).map((page) => page.sortOrder),
  ) + 1;

let lastId = 100;

export const nextDocsId = () => String(++lastId);
