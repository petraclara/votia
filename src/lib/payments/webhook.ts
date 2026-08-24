import { timingSafeEqual } from "crypto";

export function webhookChallengeValid(received: unknown, expected: string | undefined) {
  if (!expected) return false;
  if (typeof received !== "string") return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
