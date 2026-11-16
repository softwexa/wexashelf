import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { db } from "./store";
import { StoreError, check } from "./validation";
export const SESSION_COOKIE = "catalog_admin";
const digest = (v: string) => createHash("sha256").update(v).digest("hex");
export function configurePassword(password: string) {
  check(
    password.length >= 12 && password.length <= 256,
    "Parola 12–256 karakter olmalı.",
  );
  check(
    !db().prepare("SELECT value FROM settings WHERE key=?").get("password"),
    "Yönetici zaten yapılandırılmış.",
  );
  const salt = randomBytes(16).toString("hex");
  db()
    .prepare("INSERT INTO settings VALUES(?,?)")
    .run(
      "password",
      `${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
    );
}
export function configured() {
  if (
    !db().prepare("SELECT value FROM settings WHERE key=?").get("password") &&
    process.env.ADMIN_PASSWORD
  )
    configurePassword(process.env.ADMIN_PASSWORD);
  return Boolean(
    db().prepare("SELECT value FROM settings WHERE key=?").get("password"),
  );
}
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  db().prepare("DELETE FROM limits WHERE expires<?").run(now);
  db()
    .prepare(
      "INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
    )
    .run(key, now + windowMs);
  const row = db().prepare("SELECT count FROM limits WHERE key=?").get(key)!;
  if (Number(row.count) > max)
    throw new StoreError("Çok fazla deneme. Daha sonra tekrar deneyin.", 429);
}
export function login(password: unknown, client: string) {
  rateLimit(`login:${client}`, 8, 15 * 60 * 1000);
  if (!configured())
    throw new StoreError("Yönetici yerel kurulum bekliyor.", 503);
  const stored = db()
    .prepare("SELECT value FROM settings WHERE key=?")
    .get("password")!.value as string;
  const [salt, hash] = stored.split(":");
  check(
    typeof password === "string" && password.length <= 256,
    "Geçersiz parola.",
  );
  if (
    !timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, "hex"))
  )
    throw new StoreError("Geçersiz parola.", 401);
  db().prepare("DELETE FROM limits WHERE key=?").run(`login:${client}`);
  const token = randomBytes(32).toString("hex");
  db().prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db()
    .prepare("INSERT INTO sessions VALUES(?,?)")
    .run(digest(token), Date.now() + 8 * 60 * 60 * 1000);
  return token;
}
export function authenticated(token: string) {
  if (!token) return false;
  const row = db()
    .prepare("SELECT expires FROM sessions WHERE token=?")
    .get(digest(token));
  return Boolean(row && Number(row.expires) > Date.now());
}
export function logout(token: string) {
  db().prepare("DELETE FROM sessions WHERE token=?").run(digest(token));
}
export function cookieToken(request: Request) {
  return (
    request.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1) || ""
  );
}
export function requireAdmin(request: Request) {
  if (!authenticated(cookieToken(request)))
    throw new StoreError("Oturum gerekli.", 401);
}
function expectedOrigin(request: Request) {
  const configuredOrigin = process.env.APP_ORIGIN || process.env.SITE_URL;
  if (configuredOrigin) return new URL(configuredOrigin).origin;
  const requestUrl = new URL(request.url);
  const url = new URL(
    `${requestUrl.protocol}//${request.headers.get("host") || requestUrl.host}`,
  );
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    throw new StoreError(
      "Kamuya açık kullanım için APP_ORIGIN yapılandırılmalı.",
      403,
    );
  return url.origin;
}
export function sameOrigin(request: Request) {
  const expected = expectedOrigin(request);
  if (request.headers.get("origin") !== expected)
    throw new StoreError("İstek kaynağı doğrulanamadı.", 403);
}
export function sessionCookie(request: Request, token: string) {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 28800 : 0}${new URL(expectedOrigin(request)).protocol === "https:" ? "; Secure" : ""}`;
}
