import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export type AdminSession = { unlocked?: boolean };

function sessionConfig() {
  const password = process.env["SESSION_SECRET"];
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET is not configured (need 32+ chars).");
  }
  return {
    password,
    name: "nero-admin",
    maxAge: 60 * 60 * 12, // 12h
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function getAdminSession() {
  return useSession<AdminSession>(sessionConfig());
}

export async function isUnlocked(): Promise<boolean> {
  const s = await getAdminSession();
  return Boolean(s.data.unlocked);
}

export async function requireUnlocked(): Promise<void> {
  if (!(await isUnlocked())) {
    throw new Error("Unauthorized");
  }
}

export function passwordMatches(input: string): boolean {
  const expected = process.env["SITE_ADMIN_PASSWORD"];
  if (!expected) return false;
  const a = createHash("sha256").update(String(input), "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}