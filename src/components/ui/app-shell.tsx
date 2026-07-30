import type { CSSProperties, JSX, ReactNode } from "react";
import { SiteHeader } from "./site-header";

type AppShellProps = {
  children: ReactNode;
  style?: CSSProperties;
};

export function AppShell({ children, style }: AppShellProps): JSX.Element {
  return (
    <div className="app-shell" style={style}>
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
