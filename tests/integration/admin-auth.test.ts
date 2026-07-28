import { describe, expect, it } from "vitest";

import { createAdminSession, requireAdmin } from "@/lib/auth/admin-session";

describe("admin session guard", () => {
  const env = { ADMIN_PASSWORD: "correct horse battery staple", ADMIN_SESSION_SECRET: "test-secret", NODE_ENV: "test" };

  it("rejects anonymous requests and accepts a signed httpOnly-session value", async () => {
    await expect(requireAdmin(new Request("http://localhost/api/admin/articles"), env)).rejects.toThrow("Unauthorized");
    const session = await createAdminSession(env);
    const request = new Request("http://localhost/api/admin/articles", { headers: { cookie: `xreader_admin=${session.value}` } });
    await expect(requireAdmin(request, env)).resolves.toMatchObject({ role: "admin" });
    expect(session.options).toMatchObject({ httpOnly: true, sameSite: "lax", secure: false });
  });
});
