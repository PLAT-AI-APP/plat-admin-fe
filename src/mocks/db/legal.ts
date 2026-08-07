import type { LegalDocument, LegalDocumentType } from "@/type/legal";
import { daysAgo, pickOne } from "../utils";

const DOCUMENT_AUTHORS = ["운영자", "법무담당", "최고관리자"] as const;

/** 이용약관 본문. 실제 문서처럼 장·조 구조를 갖춘 마크다운으로 만든다. */
const buildTermsContent = (version: string, effectiveDate: string) => `# 서비스 이용약관

**버전 ${version} · 시행일 ${effectiveDate}**

## 제1장 총칙

### 제1조 (목적)

이 약관은 PLAT(이하 "회사")이 제공하는 AI 캐릭터 대화 서비스(이하 "서비스")의
이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.

### 제2조 (용어의 정의)

| 용어 | 정의 |
| --- | --- |
| 회원 | 이 약관에 동의하고 서비스 이용 계약을 체결한 자 |
| 크레딧 | 서비스 내 유료 기능을 이용하기 위해 사용하는 재화 |
| 캐릭터 | 회원 또는 회사가 생성한 대화 상대 |
| 세계관 | 캐릭터에 부여되는 배경 설정 단위 |

### 제3조 (약관의 게시와 개정)

1. 회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
2. 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
3. 약관을 개정할 경우 시행일 7일 전부터 공지하며, 회원에게 불리한 개정은 30일 전에 공지합니다.

## 제2장 이용 계약

### 제4조 (이용 계약의 성립)

이용 계약은 회원이 되고자 하는 자가 약관에 동의한 뒤 가입을 신청하고,
회사가 이를 승낙함으로써 성립합니다.

### 제5조 (회원 정보의 관리)

- 회원은 자신의 계정 정보를 제3자에게 양도하거나 대여할 수 없습니다.
- 회원 정보에 변경이 있는 경우 즉시 수정해야 합니다.

## 제3장 크레딧

### 제6조 (크레딧의 구매와 사용)

1. 회원은 회사가 정한 상품을 결제해 크레딧을 충전할 수 있습니다.
2. 크레딧은 대화, 이미지 생성 등 서비스 내 유료 기능에 사용됩니다.
3. 회사는 정책에 따라 크레딧을 무상으로 지급하거나 회수할 수 있습니다.

### 제7조 (청약 철회 및 환불)

- 결제 후 7일 이내이며 크레딧을 사용하지 않은 경우 전액 환불이 가능합니다.
- 무상으로 지급된 크레딧은 환불 대상에서 제외됩니다.

## 제4장 회원의 의무

### 제8조 (금지 행위)

회원은 다음 각 호의 행위를 하여서는 안 됩니다.

1. 타인의 개인정보를 도용하는 행위
2. 서비스의 정상적인 운영을 방해하는 행위
3. 미성년자에 대한 성적 묘사 등 법령에 위반되는 콘텐츠를 생성하는 행위
4. 자동화된 수단으로 서비스에 접근하는 행위

### 제9조 (이용 제한)

회사는 회원이 제8조를 위반한 경우 사전 통지 없이 서비스 이용을 제한할 수 있습니다.

## 제5장 기타

### 제10조 (책임의 제한)

회사는 천재지변 또는 이에 준하는 불가항력으로 인해 서비스를 제공할 수 없는 경우
서비스 제공에 관한 책임이 면제됩니다.

### 제11조 (준거법 및 관할)

이 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련한 분쟁은
회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.

> 부칙 — 이 약관은 ${effectiveDate}부터 시행합니다.
`;

/** 개인정보처리방침 본문 */
const buildPrivacyContent = (version: string, effectiveDate: string) => `# 개인정보처리방침

**버전 ${version} · 시행일 ${effectiveDate}**

PLAT(이하 "회사")은 이용자의 개인정보를 중요하게 생각하며,
「개인정보 보호법」 등 관련 법령을 준수하고 있습니다.

## 1. 수집하는 개인정보 항목

| 구분 | 항목 | 수집 방법 |
| --- | --- | --- |
| 필수 | 이메일, 닉네임, 소셜 로그인 식별자 | 회원 가입 시 |
| 선택 | 프로필 이미지, 생년 | 프로필 설정 시 |
| 자동 | 접속 IP, 기기 정보, 이용 기록 | 서비스 이용 과정에서 자동 생성 |

## 2. 개인정보의 수집 및 이용 목적

1. 회원 식별 및 로그인 등 서비스 제공
2. 크레딧 결제, 환불 및 정산 처리
3. 부정 이용 방지와 서비스 품질 개선
4. 법령상 의무 이행

## 3. 개인정보의 보유 및 이용 기간

- 회원 탈퇴 시 지체 없이 파기합니다.
- 다만 다음 정보는 관련 법령에 따라 아래 기간 동안 보관합니다.

| 보관 정보 | 근거 법령 | 보관 기간 |
| --- | --- | --- |
| 계약 및 청약 철회 기록 | 전자상거래법 | 5년 |
| 대금 결제 및 재화 공급 기록 | 전자상거래법 | 5년 |
| 접속 로그 | 통신비밀보호법 | 3개월 |

## 4. 개인정보의 제3자 제공

회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
다만 법령에 근거해 수사기관의 요구가 있는 경우는 예외로 합니다.

## 5. 개인정보 처리의 위탁

| 수탁자 | 위탁 업무 |
| --- | --- |
| 클라우드 인프라 제공사 | 서비스 운영을 위한 데이터 보관 |
| 결제 대행사 | 결제 및 환불 처리 |
| AI 모델 제공사 | 대화 응답 생성 |

## 6. 이용자의 권리와 행사 방법

이용자는 언제든지 자신의 개인정보를 조회·수정할 수 있으며,
회원 탈퇴를 통해 개인정보 수집·이용 동의를 철회할 수 있습니다.

## 7. 개인정보 보호책임자

- 담당 부서: PLAT 운영팀
- 문의: privacy@plat.io

> 이 개인정보처리방침은 ${effectiveDate}부터 적용됩니다.
`;

interface LegalSeed {
  documentType: LegalDocumentType;
  version: string;
  /** 시행일까지 남은 일수를 음수로 표현한다. (며칠 전 시행) */
  daysBefore: number;
  isActive: boolean;
}

/** 타입별로 활성 문서는 최신 1건만 둔다. */
const LEGAL_SEEDS: LegalSeed[] = [
  { documentType: "TERMS_OF_SERVICE", version: "1.0.0", daysBefore: 420, isActive: false },
  { documentType: "TERMS_OF_SERVICE", version: "1.1.0", daysBefore: 180, isActive: false },
  { documentType: "TERMS_OF_SERVICE", version: "2.0.0", daysBefore: 30, isActive: true },
  { documentType: "PRIVACY_POLICY", version: "1.0.0", daysBefore: 420, isActive: false },
  { documentType: "PRIVACY_POLICY", version: "1.1.0", daysBefore: 45, isActive: true },
];

/** 마크다운 본문에 박아 넣을 시행일 문자열 */
const toEffectiveLabel = (isoDate: string) => isoDate.slice(0, 10).replace(/-/g, ".");

export const legalDocuments: LegalDocument[] = LEGAL_SEEDS.map((seed, index) => {
  const effectiveAt = daysAgo(seed.daysBefore, 0);
  const effectiveLabel = toEffectiveLabel(effectiveAt);
  const content =
    seed.documentType === "TERMS_OF_SERVICE"
      ? buildTermsContent(seed.version, effectiveLabel)
      : buildPrivacyContent(seed.version, effectiveLabel);

  return {
    documentId: index + 1,
    documentType: seed.documentType,
    version: seed.version,
    content,
    isActive: seed.isActive,
    effectiveAt,
    // 문서는 시행일보다 며칠 앞서 등록한다.
    createdAt: daysAgo(seed.daysBefore + 7, 14),
    createdBy: pickOne(index + 1, DOCUMENT_AUTHORS),
  };
});
