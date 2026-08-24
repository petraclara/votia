import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageOrganizerEvent } from "@/lib/authz";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function requireOrganizer() {
  const user = await requireUser();
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  if (user.role === "ADMIN") {
    return { user, organizer: null as Awaited<ReturnType<typeof getOrganizerProfile>> };
  }

  const organizer = await getOrganizerProfile(user.id);
  if (!organizer) {
    throw new Error("Organizer profile missing");
  }
  return { user, organizer };
}

export async function requireApprovedOrganizer() {
  const result = await requireOrganizer();
  if (result.user.role !== "ADMIN" && result.organizer?.status !== "APPROVED") {
    throw new Error("Organizer account is not approved.");
  }
  return result;
}

export async function getOrganizerProfile(userId: string) {
  return prisma.organizer.findUnique({
    where: { userId },
  });
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}

export function assertEventOwnership(
  user: { role: string },
  organizerId: string | null,
  eventOrganizerId: string,
) {
  if (!canManageOrganizerEvent({ role: user.role, organizerId, eventOrganizerId })) {
    throw new Error("Forbidden");
  }
}
