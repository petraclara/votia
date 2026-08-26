import assert from "node:assert/strict";
import { test } from "node:test";
import { canAccessAdminFinance, canManageOrganizerEvent } from "../authz";
import { normalizeMpesaPhone } from "./phone";
import { mapDarajaResultToState } from "./daraja-utils";

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

test("cancelled STK results never look like COMPLETE", () => {
  assert.notEqual(mapDarajaResultToState(1032), "COMPLETE");
  assert.equal(normalizeMpesaPhone("0712345678")?.startsWith("254"), true);
});
