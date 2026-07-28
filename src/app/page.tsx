import { AppShell } from "@/components/ui/app-shell";
import type { JSX } from "react";

export default function HomePage(): JSX.Element {
  return (
    <AppShell>
      <section aria-labelledby="today-heading">
        <h1 id="today-heading">Today</h1>
        <p>Your next guided English reading will appear here.</p>
      </section>
    </AppShell>
  );
}
