import assert from "node:assert/strict";
import { test } from "node:test";
import { webhookChallengeValid } from "./webhook";
import { canAccessAdminFinance, canManageOrganizerEvent } from "../authz";

test("webhook challenge must match exactly", () => {
  assert.equal(webhookChallengeValid("secret", "secret"), true);
  assert.equal(webhookChallengeValid("secret", "other"), false);
  assert.equal(webhookChallengeValid("secret", undefined), false);
  assert.equal(webhookChallengeValid(null, "secret"), false);
});

test("organizers cannot manage another organizer event by id", () => {
  assert.equal(
    canManageOrganizerEvent({
      role: "ORGANIZER",
      organizerId: "org_a",
      eventOrganizerId: "org_b",
    }),
    false,
  );
  assert.equal(
    canManageOrganizerEvent({
      role: "ORGANIZER",
      organizerId: "org_a",
      eventOrganizerId: "org_a",
    }),
    true,
  );
});

test("financial data is admin-only", () => {
  assert.equal(canAccessAdminFinance("ORGANIZER"), false);
  assert.equal(canAccessAdminFinance("ADMIN"), true);
  assert.equal(canAccessAdminFinance("USER"), false);
});
