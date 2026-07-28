import type { JSX, ReactNode } from "react";
import { SiteHeader } from "./site-header";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps): JSX.Element {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
