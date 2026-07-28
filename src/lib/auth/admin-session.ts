import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "xreader_admin";
const maxAgeSeconds = 60 * 60 * 12;
type SessionEnv = { ADMIN_PASSWORD?: string; ADMIN_SESSION_SECRET?: string; NODE_ENV?: string };

export type AdminSession = { role: "admin" };
export type AdminCookie = { name: string; value: string; options: { httpOnly: true; sameSite: "lax"; secure: boolean; path: "/"; maxAge: number } };

function secret(env: SessionEnv) {
  const password = env.ADMIN_PASSWORD?.trim();
  if (!password) throw new Error("ADMIN_PASSWORD must be configured");
  return env.ADMIN_SESSION_SECRET?.trim() || password;
}

function signature(payload: string, env: SessionEnv) { return createHmac("sha256", secret(env)).update(payload).digest("base64url"); }

function cookieOptions(env: SessionEnv): AdminCookie["options"] { return { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", path: "/", maxAge: maxAgeSeconds }; }

export async function createAdminSession(env: SessionEnv = process.env): Promise<AdminCookie> {
  const payload = Buffer.from(JSON.stringify({ role: "admin", expiresAt: Date.now() + maxAgeSeconds * 1000 })).toString("base64url");
  return { name: cookieName, value: `${payload}.${signature(payload, env)}`, options: cookieOptions(env) };
}

function readCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
}

export async function requireAdmin(request: Request, env: SessionEnv = process.env): Promise<AdminSession> {
  const value = readCookie(request);
  if (!value) throw new Error("Unauthorized");
  const [payload, providedSignature] = value.split(".");
  if (!payload || !providedSignature) throw new Error("Unauthorized");
  const expected = signature(payload, env);
  const receivedBytes = Buffer.from(providedSignature);
  const expectedBytes = Buffer.from(expected);
  if (receivedBytes.length !== expectedBytes.length || !timingSafeEqual(receivedBytes, expectedBytes)) throw new Error("Unauthorized");
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: string; expiresAt?: number };
    if (data.role !== "admin" || !data.expiresAt || data.expiresAt < Date.now()) throw new Error("Unauthorized");
    return { role: "admin" };
  } catch { throw new Error("Unauthorized"); }
}

export async function verifyAdminPassword(password: string, env: SessionEnv = process.env) {
  const configured = env.ADMIN_PASSWORD?.trim();
  if (!configured) throw new Error("ADMIN_PASSWORD must be configured");
  const input = Buffer.from(password);
  const expected = Buffer.from(configured);
  return input.length === expected.length && timingSafeEqual(input, expected);
}
