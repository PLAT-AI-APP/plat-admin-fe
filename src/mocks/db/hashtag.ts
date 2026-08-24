import type {
  HashtagCategory,
  HashtagDetail,
  HashtagLanguage,
} from "@/type/hashtag";
import { daysAgo } from "../utils";

/**
 * 목업 해시태그.
 *
 * 해시태그 도메인은 실서버에 연동되어 있어 이 목록은 **전역 검색 목업과 목업
 * 캐릭터의 태그 풀**만 쓴다. 사용 수는 실제 목업 캐릭터에서 세므로 상세 형태에
 * 사용 수만 덧붙인 모양이다.
 */
export interface MockHashtag extends HashtagDetail {
  usageCount: number;
}

/**
 * 실제 서비스에 등록된 해시태그 목록.
 * 앱의 태그 선택 화면에 노출되는 분류·순서를 그대로 따른다.
 */
const SEED_BY_CATEGORY: Record<HashtagCategory, string[]> = {
  GENRE: [
    "판타지", "로맨스", "로판", "현대판타지", "다크판타지", "SF", "호러",
    "무협", "일상", "학원", "이세계", "아포칼립스", "사이버펑크", "코미디",
    "액션", "추리", "헌터", "전쟁", "스포츠", "서바이벌", "시뮬레이션",
    "사극", "범죄", "게임", "RPG", "BL", "GL", "HL",
  ],
  BACKGROUND: [
    "학교", "직장", "이세계", "현대도시", "시골", "우주", "궁정", "던전",
    "무대", "군대", "병원", "카페",
  ],
  RACE: [
    "뱀파이어", "엘프", "드래곤", "수인", "악마", "천사", "요괴", "안드로이드",
    "구미호", "외계인", "몬스터", "서큐버스", "인큐버스", "늑대인간", "유령",
    "인외",
  ],
  CHARACTER: [
    "남자친구", "여자친구", "누나", "여동생", "오빠", "언니", "엄마", "아빠",
    "소꿉친구", "학생", "일진", "오타쿠", "히키코모리", "영애", "악역", "너드",
  ],
  APPEARANCE: [
    "금발", "은발", "흑발", "붉은머리", "안경", "근육", "교복", "문신", "거유",
    "빈유", "슬렌더", "장신", "톰보이", "갸루", "수염", "장발", "창백",
    "눈가점", "단발", "소년", "소녀",
  ],
  PERSONALITY: [
    "츤데레", "얀데레", "쿠데레", "다정", "능글", "철벽", "발랄", "무뚝뚝",
    "걸크러시", "수줍음", "순수", "멘헤라", "소악마", "사이코패스",
    "소시오패스", "집착", "광기", "음침", "도도", "애교", "대형견", "지배적",
    "피폐", "천연", "카리스마", "결핍", "무심", "소심", "플러팅",
  ],
  RELATIONSHIP: [
    "친구", "연인", "비밀연애", "가짜연애", "주인", "라이벌", "룸메이트",
    "상사", "부하", "동거", "부부", "스승", "제자", "선배", "후배", "사내연애",
    "연상", "연하",
  ],
  NARRATIVE: [
    "구원", "복수", "혐관", "재회", "배신", "환생", "회귀", "빙의", "짝사랑",
    "첫사랑", "결혼", "왕따", "감금", "기억상실", "트라우마", "계약", "반전",
    "가스라이팅", "암살", "데이트", "각성", "순애", "육성", "타락", "권태기",
  ],
  OCCUPATION: [
    "의사", "군인", "경찰", "교사", "메이드", "집사", "아이돌", "스트리머",
    "배우", "기사", "용사", "마법사", "암살자", "스파이", "헌터", "탐정",
    "킬러", "마왕", "공주", "여왕", "성녀", "마녀", "CEO", "재벌", "조폭",
    "마피아", "회사원", "과학자", "퇴마사", "히어로", "간호사", "해적",
    "경호원", "빌런",
  ],
  MOOD: [
    "로맨틱", "달콤", "힐링", "따뜻함", "개그", "유쾌", "진지", "어두움",
    "신비", "강렬", "피폐", "설렘",
  ],
  SPECIAL: [
    "하렘", "역하렘", "이중인격", "초능력", "TS", "오메가버스", "세뇌", "최면",
    "상태창", "먼치킨", "변신", "오토코노코", "퍼리",
  ],
};

/**
 * 성인 인증 유저에게만 노출하는 태그.
 * 운영에서 조정 가능하도록 데이터로 둔다.
 */
const ADULT_LABELS = new Set([
  "서큐버스",
  "인큐버스",
  "거유",
  "빈유",
  "오메가버스",
  "세뇌",
  "최면",
  "감금",
  "가스라이팅",
  "타락",
  "퍼리",
  "오토코노코",
]);

/** 번역 예시가 있는 태그. 나머지는 번역 미완료 상태로 두어 운영 대상이 드러나게 한다. */
const TRANSLATIONS: Record<string, { en: string; ja: string }> = {
  판타지: { en: "Fantasy", ja: "ファンタジー" },
  로맨스: { en: "Romance", ja: "ロマンス" },
  로판: { en: "Romance Fantasy", ja: "ロマンスファンタジー" },
  SF: { en: "Sci-Fi", ja: "SF" },
  호러: { en: "Horror", ja: "ホラー" },
  무협: { en: "Wuxia", ja: "武侠" },
  일상: { en: "Slice of Life", ja: "日常" },
  학원: { en: "School", ja: "学園" },
  이세계: { en: "Isekai", ja: "異世界" },
  코미디: { en: "Comedy", ja: "コメディ" },
  액션: { en: "Action", ja: "アクション" },
  뱀파이어: { en: "Vampire", ja: "ヴァンパイア" },
  엘프: { en: "Elf", ja: "エルフ" },
  드래곤: { en: "Dragon", ja: "ドラゴン" },
  수인: { en: "Beastkin", ja: "獣人" },
  악마: { en: "Demon", ja: "悪魔" },
  천사: { en: "Angel", ja: "天使" },
  츤데레: { en: "Tsundere", ja: "ツンデレ" },
  얀데레: { en: "Yandere", ja: "ヤンデレ" },
  쿠데레: { en: "Kuudere", ja: "クーデレ" },
  친구: { en: "Friend", ja: "友達" },
  연인: { en: "Lover", ja: "恋人" },
  라이벌: { en: "Rival", ja: "ライバル" },
  첫사랑: { en: "First Love", ja: "初恋" },
  회귀: { en: "Regression", ja: "回帰" },
  환생: { en: "Reincarnation", ja: "転生" },
  의사: { en: "Doctor", ja: "医者" },
  메이드: { en: "Maid", ja: "メイド" },
  집사: { en: "Butler", ja: "執事" },
  아이돌: { en: "Idol", ja: "アイドル" },
  마법사: { en: "Mage", ja: "魔法使い" },
  하렘: { en: "Harem", ja: "ハーレム" },
};

/** 번역이 없는 언어는 빈 문자열로 둔다. 화면에서 "번역 n/6"으로 노출된다. */
const buildLabels = (ko: string): Record<HashtagLanguage, string> => ({
  KO: ko,
  EN: TRANSLATIONS[ko]?.en ?? "",
  JA: TRANSLATIONS[ko]?.ja ?? "",
  ZH: "",
  TH: "",
  VI: "",
});

/** 분류 순서대로 펼쳐 목록을 만든다. */
const flatten = () =>
  (Object.keys(SEED_BY_CATEGORY) as HashtagCategory[]).flatMap((category) =>
    SEED_BY_CATEGORY[category].map((label) => ({ category, label })),
  );

/**
 * usageCount는 여기서 정하지 않는다.
 * "이 태그를 쓰는 캐릭터·세계관 수"이므로 db/character가 실제 사용 수로 채운다.
 * (난수를 뿌리면 사용 중이라던 태그가 실제로는 어디에도 안 붙어 있는 상태가 된다)
 */
export const hashtags: MockHashtag[] = flatten().map((item, index) => ({
  hashtagId: index + 1,
  labels: buildLabels(item.label),
  category: item.category,
  isAdult: ADULT_LABELS.has(item.label),
  // 일부는 비활성으로 두어 노출 토글을 확인할 수 있게 한다.
  isActive: index % 23 !== 7,
  usageCount: 0,
  createdAt: daysAgo(Math.floor(index / 6) + 1, 10),
}));

/**
 * 캐릭터·세계관이 붙일 수 있는 태그 풀.
 *
 * 사용자는 등록된 해시태그 중에서만 고를 수 있으므로, 목업 캐릭터의 태그도
 * 반드시 이 목록에서 나와야 한다. 전체 200여 개를 다 쓰면 태그가 너무 흩어져
 * 사용 수가 대부분 1이 되므로, 분류별 대표 태그만 추려 쓴다.
 */
export const CHARACTER_TAG_POOL: string[] = [
  ...SEED_BY_CATEGORY.GENRE.slice(0, 10),
  ...SEED_BY_CATEGORY.RACE.slice(0, 5),
  ...SEED_BY_CATEGORY.PERSONALITY.slice(0, 6),
  ...SEED_BY_CATEGORY.RELATIONSHIP.slice(0, 5),
  ...SEED_BY_CATEGORY.NARRATIVE.slice(0, 4),
];
