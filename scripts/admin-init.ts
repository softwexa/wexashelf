import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { configurePassword, configured } from "../src/lib/server/auth";
if (configured()) {
  console.log("Yönetici zaten yapılandırılmış.");
  process.exit(0);
}
const password = randomBytes(24).toString("base64url");
const path = resolve(".local/admin-password.txt");
mkdirSync(resolve(".local"), { recursive: true, mode: 0o700 });
writeFileSync(path, password + "\n", { mode: 0o600, flag: "wx" });
configurePassword(password);
console.log(path);
