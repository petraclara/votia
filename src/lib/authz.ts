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
