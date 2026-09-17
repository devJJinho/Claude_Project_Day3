// T-046: D-day 카운트다운 표시 컴포넌트.
// couples.wedding_date(date, "YYYY-MM-DD")를 받아 오늘 기준 D-N / D-DAY / D+N 배지를 렌더링한다.
// 다른 화면(대시보드 헤더 등)에 그대로 얹을 수 있도록 독립적인 컴포넌트로 유지한다.

function formatDday(weddingDate: string): string {
  // 날짜만 비교하도록 자정 기준 UTC로 파싱한다(타임존에 따른 하루 오차 방지).
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  const [year, month, day] = weddingDate.split("-").map(Number);
  const weddingUtc = Date.UTC(year, month - 1, day);

  const diffDays = Math.round((weddingUtc - todayUtc) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "D-DAY";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

export default function DdayCountdown({ weddingDate }: { weddingDate: string | null }) {
  if (!weddingDate) {
    return (
      <div className="inline-flex flex-col items-center gap-0.5 rounded-full bg-accent px-4 py-1.5 text-white">
        <span className="text-xs">결혼식까지</span>
        <span className="font-display text-sm font-bold">날짜 미설정</span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center gap-0.5 rounded-full bg-accent px-4 py-1.5 text-white">
      <span className="text-xs">결혼식까지</span>
      <span className="font-display text-lg font-bold">{formatDday(weddingDate)}</span>
    </div>
  );
}
