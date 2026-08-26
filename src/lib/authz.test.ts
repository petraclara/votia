import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAccessAdminFinance,
  canApproveOrganizer,
  canCreateEvent,
  canManageOrganizerEvent,
  canUploadEventMedia,
  validateImageUploadFile,
} from "./authz";

test("pending organizer cannot create events or upload media", () => {
  assert.equal(canCreateEvent({ role: "ORGANIZER", organizerStatus: "PENDING" }), false);
  assert.equal(canUploadEventMedia({ role: "ORGANIZER", organizerStatus: "PENDING" }), false);
  assert.equal(canCreateEvent({ role: "ORGANIZER", organizerStatus: "SUSPENDED" }), false);
});

test("approved organizer can create events and upload media", () => {
  assert.equal(canCreateEvent({ role: "ORGANIZER", organizerStatus: "APPROVED" }), true);
  assert.equal(canUploadEventMedia({ role: "ORGANIZER", organizerStatus: "APPROVED" }), true);
  assert.equal(canCreateEvent({ role: "ADMIN", organizerStatus: null }), true);
});

test("only admins can approve organizers; organizers cannot approve themselves", () => {
  assert.equal(canApproveOrganizer("ADMIN"), true);
  assert.equal(canApproveOrganizer("ORGANIZER"), false);
  assert.equal(canApproveOrganizer("USER"), false);
});

test("organizers cannot manage another organizer event", () => {
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
  assert.equal(
    canManageOrganizerEvent({
      role: "ADMIN",
      organizerId: null,
      eventOrganizerId: "org_b",
    }),
    true,
  );
});

test("financial data is admin-only", () => {
  assert.equal(canAccessAdminFinance("ORGANIZER"), false);
  assert.equal(canAccessAdminFinance("ADMIN"), true);
  assert.equal(canAccessAdminFinance("USER"), false);
});

test("image upload rejects invalid type, extension, and oversized files", () => {
  assert.equal(
    validateImageUploadFile({ size: 100, type: "application/pdf", name: "a.pdf" }).ok,
    false,
  );
  assert.equal(
    validateImageUploadFile({ size: 100, type: "image/gif", name: "a.gif" }).ok,
    false,
  );
  assert.equal(
    validateImageUploadFile({ size: 5_000_000, type: "image/png", name: "a.png" }).ok,
    false,
  );
  assert.deepEqual(
    validateImageUploadFile({ size: 100, type: "image/png", name: "poster.png" }),
    { ok: true, ext: "png" },
  );
});

test("missing image name extension fails validation", () => {
  const result = validateImageUploadFile({ size: 10, type: "image/jpeg", name: "noext" });
  assert.equal(result.ok, false);
});
