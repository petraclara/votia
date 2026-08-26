export function canManageOrganizerEvent(input: {
  role: string;
  organizerId: string | null;
  eventOrganizerId: string;
}) {
  if (input.role === "ADMIN") return true;
  return Boolean(input.organizerId && input.organizerId === input.eventOrganizerId);
}

export function canAccessAdminFinance(role: string) {
  return role === "ADMIN";
}

export function isApprovedOrganizer(status: string | null | undefined) {
  return status === "APPROVED";
}

/** Only admins can approve / suspend organizers. Organizers cannot approve themselves. */
export function canApproveOrganizer(actorRole: string) {
  return actorRole === "ADMIN";
}

export function canCreateEvent(input: {
  role: string;
  organizerStatus?: string | null;
}) {
  if (input.role === "ADMIN") return true;
  return input.role === "ORGANIZER" && isApprovedOrganizer(input.organizerStatus);
}

export function canUploadEventMedia(input: {
  role: string;
  organizerStatus?: string | null;
}) {
  return canCreateEvent(input);
}

export type ImageUploadValidation =
  | { ok: true; ext: string }
  | { ok: false; status: 400; error: string };

export function validateImageUploadFile(input: {
  size: number;
  type: string;
  name: string;
  maxBytes?: number;
}) {
  const maxBytes = input.maxBytes ?? 4_000_000;
  if (!input.type.startsWith("image/")) {
    return { ok: false as const, status: 400 as const, error: "Images only" };
  }
  if (input.size > maxBytes) {
    return { ok: false as const, status: 400 as const, error: "File too large" };
  }
  const ext = input.name.split(".").pop()?.toLowerCase() ?? "";
  const allowed = ["jpg", "jpeg", "png", "webp"];
  if (!allowed.includes(ext)) {
    return { ok: false as const, status: 400 as const, error: "Unsupported image type" };
  }
  return { ok: true as const, ext };
}
