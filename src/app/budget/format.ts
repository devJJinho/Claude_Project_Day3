// 원화 표시 포매팅 — 천 단위 구분자만 붙인다(다중 통화/환산 불필요, CLAUDE.md 지침).
export function formatWon(amount: number): string {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

export function clampPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  const pct = (numerator / denominator) * 100;
  return Math.min(100, Math.max(0, pct));
}
