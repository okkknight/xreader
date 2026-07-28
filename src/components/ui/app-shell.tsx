import type { JSX, ReactNode } from "react";
import Link from "next/link";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps): JSX.Element {
  return (
    <div className="app-shell">
      <header aria-label="XReader"><Link className="wordmark" href="/">XReader</Link><nav aria-label="主导航"><Link href="/">Today</Link><Link href="/archive">Archive</Link><Link href="/admin">后台</Link></nav></header>
      <main>{children}</main>
    </div>
  );
}
