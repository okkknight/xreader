import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AdminLoginForm } from "@/components/admin/login-form";
import { requireAdmin } from "@/lib/auth/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookie = (await cookies()).toString();
  let authenticated = true;
  try { await requireAdmin(new Request("http://localhost/admin", { headers: { cookie } })); } catch { authenticated = false; }
  return authenticated ? <div className="admin-shell">{children}</div> : <main className="admin-login-wrap"><AdminLoginForm /></main>;
}
