import Link from "next/link";

export function SiteHeader({ active }: { active?: "today" | "archive" }) {
  return <header className="site-header" aria-label="XReader">
    <Link className="site-wordmark" href="/">XReader</Link>
    <nav className="site-nav" aria-label="主导航">
      <Link className={active === "today" ? "is-active" : ""} href="/">Today</Link>
      <Link className={active === "archive" ? "is-active" : ""} href="/archive">Archive</Link>
    </nav>
  </header>;
}
