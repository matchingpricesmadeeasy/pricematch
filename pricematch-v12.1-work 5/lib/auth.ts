import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE = "pricematch_session";
const DAYS = 30;

export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}
export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DAYS * 86400000);
  await db.session.create({ data: { token, userId, expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
}
export async function destroySession() {
  const jar = await cookies(); const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { token } });
  jar.delete(COOKIE);
}
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt < new Date()) { await db.session.delete({ where: { id: session.id } }); return null; }
  return session.user;
}
