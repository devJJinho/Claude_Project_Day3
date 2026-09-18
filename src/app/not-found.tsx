import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-muted">우리의 결혼 준비</p>
      <h1 className="font-display text-3xl">페이지를 찾을 수 없어요</h1>
      <p className="max-w-md text-sm text-muted">주소가 바뀌었거나 존재하지 않는 페이지입니다.</p>
      <Link href="/" className="rounded-lg bg-accent px-4 py-2 text-sm text-white">
        대시보드로 돌아가기
      </Link>
    </main>
  );
}
