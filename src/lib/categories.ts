// 개발요청서 B: 추천 카테고리 제공 + 사용자가 직접 새 카테고리 추가도 가능(workspaces.category는 자유 text).
export const RECOMMENDED_CATEGORIES = [
  "결혼식장",
  "스튜디오",
  "메이크업",
  "드레스",
  "신혼여행",
] as const;

export type RecommendedCategory = (typeof RECOMMENDED_CATEGORIES)[number];
