import { createAdminSession, verifyAdminPassword } from "@/lib/auth/admin-session";

export async function POST(request: Request) {
  const body = await request.json() as { password?: string };
  if (typeof body.password !== "string" || !(await verifyAdminPassword(body.password))) return Response.json({ error: "Invalid credentials" }, { status: 401 });
  const session = await createAdminSession();
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `${session.name}=${session.value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${session.options.maxAge}${session.options.secure ? "; Secure" : ""}`);
  return response;
}
