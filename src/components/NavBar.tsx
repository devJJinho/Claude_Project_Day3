import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

const NAV_LINKS = [
  { href: "/", label: "대시보드" },
  { href: "/workspaces", label: "항목" },
  { href: "/checklist", label: "체크리스트" },
  { href: "/budget", label: "예산" },
  { href: "/settings/wedding-date", label: "결혼식 날짜" },
  { href: "/invite", label: "참여자" },
];

/** T-053: 전역 내비게이션. T-016: 로그인 상태에 따라 로그인/로그아웃 표시. */
export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto">
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
        {user ? (
          <form action={signOut}>
            <button type="submit" className="shrink-0 whitespace-nowrap text-xs text-muted underline">
              로그아웃
            </button>
          </form>
        ) : (
          <Link href="/login" className="shrink-0 whitespace-nowrap text-xs text-accent underline">
            로그인
          </Link>
        )}
      </div>
    </nav>
  );
}
