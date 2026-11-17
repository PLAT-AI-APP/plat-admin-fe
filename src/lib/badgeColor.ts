/**
 * 배너 뱃지 색. 뱃지는 운영이 자유롭게 만드는 라벨이라 정해진 색 표가 없다 — 라벨에서 색상(hue)만 뽑고
 * 밝기·채도는 고정해, 어떤 라벨이 나란히 놓여도 톤이 맞게 한다. 같은 라벨은 언제나 같은 색이다.
 *
 * 앱(plat-fe 의 lib/badgeColor.ts)과 같은 식이어야 미리보기와 실제 화면의 색이 같다.
 */
const HUE_STEPS = 12;

export const badgeHue = (label: string) => {
  let hash = 0;
  for (const char of label.trim()) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  }
  return (hash % HUE_STEPS) * (360 / HUE_STEPS);
};

/** 흰 글자를 얹는 뱃지 바탕색. */
export const badgeColor = (label: string) =>
  `oklch(0.56 0.16 ${badgeHue(label)})`;
