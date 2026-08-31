/**
 * 공식 계정.
 *
 * **공식 여부는 콘텐츠가 아니라 계정에 붙는다.**
 * 서버는 세계관 한 건 한 건에 "공식" 값을 저장하지 않고,
 * 공식으로 지정된 유저의 크리에이터가 만든 세계관을 공식으로 판정한다.
 * (`official_accounts` 표의 유저 ID → 크리에이터 ID로 변환해 비교)
 *
 * 그래서 관리자가 등록하는 것은 캐릭터나 세계관이 아니라 **유저 ID**다.
 * 계정을 등록·해제하면 그 계정이 가진 세계관 전부의 공식 표시가 함께 바뀐다.
 */
export interface OfficialAccount {
  /**
   * 등록한 유저 ID.
   *
   * 서버 ID는 Snowflake라 API 경계에서 **문자열**로 오간다.
   * 숫자로 다루면 2^53을 넘는 값의 뒷자리가 조용히 깎여, 등록은 성공했지만
   * 아무 계정도 가리키지 않는 상태가 만들어진다.
   */
  userId: string;
  /** 유저가 사라진 극단적인 경우에도 지정 자체는 남는다. 그 자리는 ID로 채운다. */
  nickname: string;
  /** 관리자 서버는 FileId → URL을 해석하지 못한다. `resolveImageUrl`로 만들어 쓴다. */
  profileImageFileId?: string;
  profileImageUrl?: string;
  /**
   * 이 유저의 크리에이터 ID.
   *
   * **크리에이터 전환을 한 계정만 값이 있다.** 값이 없으면 서버가 공식 판정에
   * 쓸 대상이 없어 등록해 둔 의미가 없다. 서버도 이 경우 경고 로그만 남기고
   * 조용히 건너뛰므로, 화면에서 먼저 눈에 보이게 한다.
   */
  creatorId?: string;
  /** 이 계정이 소유한 세계관 수. 그대로 공식 세계관 수가 된다. */
  universeCount: number;
  /** 이 계정이 소유한 캐릭터 수 */
  characterCount: number;
  /** 등록한 관리자 이름. 그 시점 스냅샷이라 계정이 지워져도 남는다. */
  registeredBy: string;
  /** 등록한 관리자 ID. 계정이 지워졌으면 비어 있다. */
  registeredById?: number;
  registeredAt: string;
}

/** 공식 계정이 실제로 공식 판정에 쓰이는지. 크리에이터가 없으면 목록에만 남는다. */
export const isEffectiveOfficialAccount = (account: OfficialAccount) =>
  Boolean(account.creatorId);
