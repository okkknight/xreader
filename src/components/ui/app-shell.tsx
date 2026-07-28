import type { JSX, ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps): JSX.Element {
  return (
    <div>
      <header aria-label="XReader">XReader</header>
      <main>{children}</main>
    </div>
  );
}
