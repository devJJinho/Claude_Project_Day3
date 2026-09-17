import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "대시보드" },
  { href: "/workspaces", label: "항목" },
  { href: "/checklist", label: "체크리스트" },
  { href: "/budget", label: "예산" },
  { href: "/settings/wedding-date", label: "결혼식 날짜" },
];

/** T-053: 전역 내비게이션 — 이전까지는 만들어둔 화면들로 갈 방법이 없었다. */
export function NavBar() {
  return (
    <nav className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4 py-3 sm:px-6">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted hover:bg-accent-soft hover:text-accent"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
