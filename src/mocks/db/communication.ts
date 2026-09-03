import type {
  NotificationChannel,
  NotificationTemplate,
  ProactiveMessage,
  ProactiveTrigger,
  PushCampaign,
  PushStatus,
  PushTarget,
  QnaCategory,
  QnaItem,
  QnaStatus,
} from "@/type/communication";
import { daysAgo, pickOne, randomInt } from "../utils";
import { characters } from "./character";
import { pickManager } from "./ops";
import { users } from "./user";

/* ------------------------------------------------------------------ */
/* Q&A                                                                 */
/* ------------------------------------------------------------------ */

const QNA_STATUSES: readonly QnaStatus[] = [
  "OPEN",
  "OPEN",
  "ANSWERED",
  "ANSWERED",
  "CLOSED",
];

const QNA_CATEGORIES: readonly QnaCategory[] = [
  "ACCOUNT",
  "PAYMENT",
  "CHARACTER",
  "BUG",
  "ETC",
];

/** 카테고리별 문의 제목. 목록에서 카테고리 필터 결과를 눈으로 확인하기 쉽도록 문구를 구분한다. */
const QNA_TITLE: Record<QnaCategory, string[]> = {
  ACCOUNT: [
    "소셜 로그인 계정을 변경하고 싶어요",
    "탈퇴한 계정을 복구할 수 있나요",
    "닉네임 변경 주기가 궁금합니다",
  ],
  PAYMENT: [
    "결제했는데 크레딧이 들어오지 않았어요",
    "정기 결제를 해지하고 싶습니다",
    "영수증을 다시 받을 수 있을까요",
  ],
  CHARACTER: [
    "제 캐릭터가 검색에 노출되지 않습니다",
    "세계관 설명을 수정하면 반영까지 얼마나 걸리나요",
    "공식 캐릭터 신청 절차가 궁금해요",
  ],
  BUG: [
    "채팅 화면이 중간에 멈춥니다",
    "이미지 업로드가 계속 실패해요",
    "앱이 실행 직후 종료됩니다",
  ],
  ETC: [
    "제휴 문의는 어디로 보내면 되나요",
    "이용약관 변경 이력을 보고 싶어요",
    "커뮤니티 가이드라인 관련 질문입니다",
  ],
};

/** 카테고리별 문의 본문 */
const QNA_CONTENT: Record<QnaCategory, string> = {
  ACCOUNT:
    "가입할 때 사용한 소셜 계정을 더 이상 쓰지 않게 되어 다른 계정으로 옮기고 싶습니다. 기존 대화 기록과 크레딧은 그대로 유지되나요?",
  PAYMENT:
    "어제 저녁에 크레딧 상품을 결제했고 카드사 승인 문자까지 받았는데, 앱에서는 잔액이 그대로입니다. 주문번호를 알려드리면 확인이 가능할까요?",
  CHARACTER:
    "직접 만든 캐릭터를 공개로 전환했는데 검색 결과에 나오지 않습니다. 심사 대기 중인 건지, 아니면 설정을 잘못한 건지 알고 싶습니다.",
  BUG: "대화를 이어가다 보면 특정 시점에서 응답이 오지 않고 로딩만 반복됩니다. 앱을 다시 켜면 잠깐 괜찮아졌다가 같은 증상이 나타납니다.",
  ETC: "서비스 관련해서 제안드리고 싶은 내용이 있어 문의드립니다. 담당자분과 이야기 나눌 수 있는 창구가 따로 있는지 궁금합니다.",
};

/** 카테고리별 기본 답변 문구 */
const QNA_ANSWER: Record<QnaCategory, string> = {
  ACCOUNT:
    "안녕하세요, PLAT 운영팀입니다. 계정 이관은 고객센터에서 본인 확인 후 처리해 드리고 있으며 대화 기록과 크레딧은 그대로 유지됩니다. 확인 가능한 연락처를 남겨 주시면 순차적으로 안내드리겠습니다.",
  PAYMENT:
    "안녕하세요, PLAT 운영팀입니다. 결제 내역 확인 결과 승인은 정상 처리되었으나 지급이 지연된 건으로 확인되어 크레딧을 즉시 반영해 드렸습니다. 불편을 드려 죄송합니다.",
  CHARACTER:
    "안녕하세요, PLAT 운영팀입니다. 공개 전환 후 검색 색인까지 최대 30분이 소요됩니다. 그 이후에도 노출되지 않는다면 캐릭터 ID를 알려 주시면 바로 확인해 드리겠습니다.",
  BUG: "안녕하세요, PLAT 운영팀입니다. 말씀하신 증상은 특정 버전에서 확인된 이슈로, 다음 업데이트에 수정 사항이 포함될 예정입니다. 임시로 앱을 최신 버전으로 갱신해 주시면 발생 빈도가 줄어듭니다.",
  ETC: "안녕하세요, PLAT 운영팀입니다. 제휴 및 제안은 partner@plat.example 로 보내 주시면 담당 부서에서 검토 후 회신드립니다. 관심 가져 주셔서 감사합니다.",
};

/**
 * Q&A 시드 34건.
 * 페이지네이션(기본 20건)을 확인해야 하므로 한 페이지를 넘기는 양으로 만든다.
 */
export const qnaItems: QnaItem[] = Array.from({ length: 34 }, (_, index) => {
  const seed = index + 1;
  const category = pickOne(seed * 5, QNA_CATEGORIES);
  const status = pickOne(seed * 3, QNA_STATUSES);
  const isAnswered = status !== "OPEN";
  // 문의 작성자는 실제 유저여야 한다. ID와 닉네임을 따로 만들면 서로 다른 사람이 된다.
  const user = pickOne(seed * 11, users);
  // 답변자는 실제 관리자여야 목록의 '#ID'가 관리자 관리 화면과 이어진다.
  const answerer = pickManager(seed * 13);

  return {
    qnaId: seed,
    category,
    title: pickOne(seed * 7, QNA_TITLE[category]),
    content: QNA_CONTENT[category],
    status,
    userId: user.userId,
    userNickname: user.nickname,
    answer: isAnswered ? QNA_ANSWER[category] : undefined,
    answeredBy: isAnswered ? answerer.name : undefined,
    answeredById: isAnswered ? answerer.managerId : undefined,
    // 답변일은 항상 작성일 이후가 되도록 하루 뒤로 잡는다.
    answeredAt: isAnswered ? daysAgo(Math.max(0, index - 1), 15) : undefined,
    createdAt: daysAgo(index, 9),
  };
});

/* ------------------------------------------------------------------ */
/* 알림 템플릿                                                          */
/* ------------------------------------------------------------------ */

interface NotificationSeed {
  templateKey: string;
  label: string;
  channel: NotificationChannel;
  title: string;
  body: string;
}

const NOTIFICATION_SEEDS: NotificationSeed[] = [
  {
    templateKey: "WELCOME",
    label: "가입 환영",
    channel: "IN_APP",
    title: "{nickname}님, PLAT에 오신 것을 환영해요",
    body: "첫 캐릭터를 만나 보세요. 지금 가입 축하 크레딧 {credit}이 지급되었습니다.",
  },
  {
    templateKey: "CREDIT_LOW",
    label: "크레딧 부족 안내",
    channel: "PUSH",
    title: "크레딧이 얼마 남지 않았어요",
    body: "{nickname}님의 잔여 크레딧은 {credit}입니다. 대화를 이어가려면 충전이 필요해요.",
  },
  {
    templateKey: "CREDIT_CHARGED",
    label: "크레딧 충전 완료",
    channel: "IN_APP",
    title: "크레딧 충전이 완료되었습니다",
    body: "{credit}이 정상 지급되었습니다. 이용해 주셔서 감사합니다.",
  },
  {
    templateKey: "CHARACTER_APPROVED",
    label: "캐릭터 공개 승인",
    channel: "IN_APP",
    title: "'{characterName}' 캐릭터가 공개되었습니다",
    body: "이제 다른 이용자들이 {characterName}과(와) 대화할 수 있어요.",
  },
  {
    templateKey: "CHARACTER_REJECTED",
    label: "캐릭터 공개 반려",
    channel: "EMAIL",
    title: "'{characterName}' 캐릭터 검수 결과 안내",
    body: "{nickname}님, 아쉽게도 이번 검수에서는 공개가 어렵습니다. 사유: {reason}",
  },
  {
    templateKey: "NEW_FOLLOWER",
    label: "새 팔로워 알림",
    channel: "PUSH",
    title: "{followerName}님이 회원님을 팔로우했어요",
    body: "{nickname}님의 캐릭터를 좋아하는 사람이 늘고 있어요.",
  },
  {
    templateKey: "WEEKLY_DIGEST",
    label: "주간 활동 요약",
    channel: "EMAIL",
    title: "이번 주 {nickname}님의 활동 요약",
    body: "이번 주에 나눈 대화는 {chatCount}회입니다. 새로 추가된 세계관도 확인해 보세요.",
  },
  {
    templateKey: "DORMANT_RETURN",
    label: "휴면 복귀 유도",
    channel: "PUSH",
    title: "{characterName}이(가) {nickname}님을 기다리고 있어요",
    body: "마지막 대화 이후 {days}일이 지났어요. 이어서 이야기해 볼까요?",
  },
];

export const notificationTemplates: NotificationTemplate[] =
  NOTIFICATION_SEEDS.map((seedItem, index) => ({
    templateId: index + 1,
    ...seedItem,
    // 일부는 꺼진 상태로 두어 Switch 동작을 바로 확인할 수 있게 한다.
    isEnabled: index % 4 !== 3,
    updatedAt: daysAgo(index * 2 + 1, 14),
  }));

/* ------------------------------------------------------------------ */
/* 선제 메시지                                                          */
/* ------------------------------------------------------------------ */

const PROACTIVE_TRIGGERS: readonly ProactiveTrigger[] = [
  "NO_CHAT_3DAYS",
  "NO_CHAT_7DAYS",
  "AFTER_FIRST_CHAT",
  "CUSTOM",
];

const PROACTIVE_CONTENTS = [
  "요즘 통 소식이 없네요. 오늘 하루는 어땠어요?",
  "지난번에 하다 만 이야기, 계속 들려줄게요.",
  "첫 대화 고마웠어요. 다음 이야기도 준비해 뒀어요.",
  "혹시 바빴어요? 잠깐이라도 얼굴 보여 줘요.",
  "새로운 에피소드가 열렸어요. 같이 가 볼래요?",
  "오늘은 조금 다른 이야기를 해 볼까 해요.",
  "당신이 없는 동안 세계관에 작은 변화가 있었어요.",
  "돌아와 줘서 고마워요. 이어서 시작할게요.",
];

export const proactiveMessages: ProactiveMessage[] = Array.from(
  { length: 8 },
  (_, index) => {
    const seed = index + 1;
    // 절반은 특정 캐릭터 전용, 나머지는 전체 캐릭터 공통 메시지로 둔다.
    const character =
      index % 2 === 0
        ? characters[randomInt(seed * 3, 0, characters.length - 1)]
        : undefined;

    return {
      messageId: seed,
      characterId: character?.characterId,
      characterName: character?.name,
      trigger: pickOne(seed * 5, PROACTIVE_TRIGGERS),
      content: PROACTIVE_CONTENTS[index],
      isEnabled: index % 3 !== 2,
      sentCount: randomInt(seed * 7, 0, 4_800),
      updatedAt: daysAgo(index + 1, 11),
    };
  },
);

/* ------------------------------------------------------------------ */
/* 푸시 캠페인                                                          */
/* ------------------------------------------------------------------ */

const PUSH_TARGETS: readonly PushTarget[] = [
  "ALL",
  "ACTIVE_USERS",
  "DORMANT_USERS",
  "SEGMENT",
];

/** SENT를 두 번 넣어 발송 완료 건이 충분히 섞이도록 한다. */
const PUSH_STATUSES: readonly PushStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "SENT",
  "SENT",
  "FAILED",
];

const PUSH_TITLES = [
  "주말 한정 크레딧 2배 이벤트",
  "새로운 공식 캐릭터가 도착했어요",
  "오늘의 PICK 세계관 업데이트",
  "휴면 회원 복귀 쿠폰 안내",
  "앱 정기 점검 사전 공지",
  "여름 시즌 세계관 오픈",
  "친구 초대 리워드 개편 안내",
  "이용약관 개정 사전 고지",
  "인기 크리에이터 인터뷰 공개",
  "첫 결제 할인 마지막 안내",
];

const PUSH_BODIES = [
  "이번 주말 동안 모든 크레딧 상품을 2배로 드립니다. 지금 확인해 보세요.",
  "공식 캐릭터가 새로 합류했어요. 첫 대화는 무료로 즐길 수 있습니다.",
  "오늘의 PICK이 새로 바뀌었습니다. 어떤 세계관이 올라왔는지 확인해 보세요.",
  "오랜만이에요. 돌아온 분들께 크레딧 쿠폰을 드립니다.",
  "안정적인 서비스를 위해 새벽 시간 점검이 예정되어 있습니다.",
  "여름 한정 세계관이 열렸습니다. 기간이 지나면 사라져요.",
  "친구를 초대하면 두 분 모두 크레딧을 받습니다.",
  "이용약관이 일부 개정됩니다. 자세한 내용을 확인해 주세요.",
  "이번 달 인기 크리에이터의 제작 노트를 공개합니다.",
  "첫 결제 할인 혜택이 곧 종료됩니다.",
];

export const pushCampaigns: PushCampaign[] = Array.from(
  { length: 10 },
  (_, index) => {
    const seed = index + 1;
    const status = pickOne(seed * 3, PUSH_STATUSES);
    const targetCount = randomInt(seed * 5, 1_200, 84_000);
    const isSent = status === "SENT";
    const creator = pickManager(seed * 13);

    return {
      campaignId: seed,
      title: PUSH_TITLES[index],
      body: PUSH_BODIES[index],
      target: pickOne(seed * 7, PUSH_TARGETS),
      status,
      // 예약 건은 앞으로의 일시를 가리켜야 하므로 음수 일자를 넘긴다.
      scheduledAt: status === "SCHEDULED" ? daysAgo(-(index + 1), 10) : undefined,
      sentAt: isSent ? daysAgo(index + 1, 10) : undefined,
      targetCount,
      successCount: isSent
        ? Math.floor((targetCount * randomInt(seed * 11, 88, 99)) / 100)
        : 0,
      createdBy: creator.name,
      createdById: creator.managerId,
      createdAt: daysAgo(index + 3, 13),
    };
  },
);
