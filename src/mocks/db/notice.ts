import type { Notice, NoticeCategory, NoticeStatus } from "@/type/notice";
import { daysAgo, randomInt } from "../utils";

const SEED_NOTICES: {
  category: NoticeCategory;
  title: string;
  content: string;
  status: NoticeStatus;
  isPinned?: boolean;
}[] = [
  {
    category: "MAINTENANCE",
    title: "8월 12일 정기 점검 안내",
    status: "PUBLISHED",
    isPinned: true,
    content: `# 8월 12일 정기 점검 안내

안녕하세요, PLAT입니다.
더 안정적인 서비스 제공을 위해 아래와 같이 정기 점검을 진행합니다.

## 점검 일정

| 구분 | 내용 |
| --- | --- |
| 일시 | 2026년 8월 12일(수) 02:00 ~ 06:00 (4시간) |
| 대상 | 전체 서비스 |

## 점검 중 제한되는 기능

- 캐릭터 대화 및 세계관 이용
- 크레딧 충전 및 결제
- 로그인 / 회원가입

## 보상 안내

점검 완료 후 접속하시는 모든 이용자에게 **크레딧 100**을 지급합니다.
지급된 크레딧은 지급일로부터 30일간 사용 가능합니다.

이용에 불편을 드려 죄송합니다.`,
  },
  {
    category: "UPDATE",
    title: "v2.4.0 업데이트 안내 — 세계관 즐겨찾기 추가",
    status: "PUBLISHED",
    isPinned: true,
    content: `# v2.4.0 업데이트 안내

## 새로운 기능

### 세계관 즐겨찾기
마음에 드는 세계관을 즐겨찾기에 담아두고 홈에서 바로 이어서 대화할 수 있습니다.

### 대화 내보내기
진행한 대화를 텍스트 파일로 저장할 수 있습니다.

## 개선

- 캐릭터 목록 로딩 속도 개선
- 이미지 생성 실패 시 크레딧 자동 환급
- 다크 모드 색상 대비 개선

## 버그 수정

- 특정 상황에서 대화가 중복 저장되던 문제
- 알림 설정이 저장되지 않던 문제`,
  },
  {
    category: "EVENT",
    title: "여름 시즌 세계관 오픈 기념 크레딧 2배 이벤트",
    status: "PUBLISHED",
    content: `# 여름 시즌 세계관 오픈 기념 이벤트

## 이벤트 기간

2026년 8월 1일 ~ 8월 31일

## 이벤트 내용

기간 중 **모든 크레딧 상품을 2배**로 지급합니다.

| 상품 | 기존 | 이벤트 |
| --- | --- | --- |
| 크레딧 100 | 100 CR | **200 CR** |
| 크레딧 300 | 315 CR | **630 CR** |
| 크레딧 550 | 600 CR | **1,200 CR** |

## 유의사항

- 이벤트 기간 종료 후에는 기존 지급량으로 돌아갑니다.
- 이벤트로 지급된 크레딧도 환불 시 회수됩니다.`,
  },
  {
    category: "POLICY",
    title: "이용약관 개정 사전 안내 (2026년 9월 1일 시행)",
    status: "PUBLISHED",
    content: `# 이용약관 개정 사전 안내

## 개정 시행일

2026년 9월 1일

## 주요 개정 내용

### 제12조 (크레딧의 유효기간)
크레딧 유효기간을 기존 **1년**에서 **2년**으로 연장합니다.

### 제18조 (콘텐츠 이용 범위)
이용자가 생성한 세계관의 이용 범위를 명확히 했습니다.

## 이의 제기

개정 내용에 동의하지 않으시는 경우 시행일 전까지 회원 탈퇴를 요청하실 수 있습니다.
별도의 의사 표시가 없으면 개정 약관에 동의한 것으로 봅니다.`,
  },
  {
    category: "SERVICE",
    title: "고객센터 운영 시간 변경 안내",
    status: "PUBLISHED",
    content: `# 고객센터 운영 시간 변경 안내

2026년 8월 1일부터 고객센터 운영 시간이 아래와 같이 변경됩니다.

- **변경 전**: 평일 09:00 ~ 18:00
- **변경 후**: 평일 10:00 ~ 19:00

점심시간(12:00 ~ 13:00)에는 문의 응대가 지연될 수 있습니다.`,
  },
  {
    category: "UPDATE",
    title: "v2.3.2 긴급 패치 안내",
    status: "HIDDEN",
    content: `# v2.3.2 긴급 패치

일부 기기에서 앱이 종료되는 문제를 수정했습니다.
앱 스토어에서 최신 버전으로 업데이트해 주세요.`,
  },
  {
    category: "EVENT",
    title: "가을 신규 캐릭터 사전 예약 (작성 중)",
    status: "DRAFT",
    content: `# 가을 신규 캐릭터 사전 예약

내용 작성 중입니다.`,
  },
];

export const notices: Notice[] = SEED_NOTICES.map((item, index) => {
  const seed = index + 1;

  return {
    noticeId: SEED_NOTICES.length - index,
    category: item.category,
    title: item.title,
    content: item.content,
    status: item.status,
    isPinned: Boolean(item.isPinned),
    startAt: undefined,
    endAt: undefined,
    viewCount:
      item.status === "PUBLISHED" ? randomInt(seed * 3, 120, 24_000) : 0,
    createdBy: "운영자",
    createdAt: daysAgo(index * 4 + 1, 11),
    updatedAt: daysAgo(index * 4, 15),
  };
});
