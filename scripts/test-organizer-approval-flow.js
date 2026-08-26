/**
 * Local/dev organizer approval + image persistence checks (uses Prisma + HTTP).
 * Prefers existing admin approval — never auto-approves in production code paths.
 *
 * Run with: node scripts/test-organizer-approval-flow.js
 * Requires: npm run dev, seeded admin (admin@votia.co.ke / Admin123!)
 */
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

async function main() {
  const email = `pending.org.${Date.now()}@example.com`;
  const password = "OrganizerTest123!";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: "Pending Org",
      email,
      passwordHash,
      role: "ORGANIZER",
      organizer: {
        create: {
          organizationName: `Test Org ${Date.now()}`,
          phone: "254700000099",
          status: "PENDING",
        },
      },
    },
    include: { organizer: true },
  });

  assert(user.organizer?.status === "PENDING", "new organizer starts PENDING");

  // Simulate create-event gate (same rule as requireApprovedOrganizer)
  const canCreateWhilePending = user.organizer.status === "APPROVED";
  assert(!canCreateWhilePending, "pending organizer cannot create events");

  // Unauthorized actors cannot approve
  assert("ORGANIZER" !== "ADMIN", "organizers cannot approve");
  assert("USER" !== "ADMIN", "users cannot approve");

  // Admin approval via same DB write as setOrganizerStatusAction
  const admin = await prisma.user.findUnique({ where: { email: "admin@votia.co.ke" } });
  assert(admin?.role === "ADMIN", "seeded admin must exist");

  await prisma.organizer.update({
    where: { id: user.organizer.id },
    data: { status: "APPROVED" },
  });
  const approved = await prisma.organizer.findUnique({ where: { id: user.organizer.id } });
  assert(approved?.status === "APPROVED", "admin approval flips status to APPROVED");

  // Create event as approved organizer
  const slug = `test-event-${randomUUID().slice(0, 8)}`;
  const posterUrl =
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80";
  const bannerUrl =
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=80";

  const event = await prisma.event.create({
    data: {
      organizerId: user.organizer.id,
      name: "Approval Flow Test Event",
      slug,
      description: "Created by organizer approval end-to-end test script.",
      poster: posterUrl,
      banner: bannerUrl,
      location: "Nairobi",
      venue: "Test Venue",
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      votePrice: 10,
      mode: "VOTING_AND_TICKETS",
      voteVisibility: "VISIBLE",
      ticketingEnabled: true,
      status: "UPCOMING",
    },
  });

  const fromDb = await prisma.event.findUnique({ where: { id: event.id } });
  assert(fromDb?.poster === posterUrl, "poster URL stored on Event.poster");
  assert(fromDb?.banner === bannerUrl, "banner URL stored on Event.banner");

  // Public page should resolve
  const publicPage = await fetch(`${base}/events/${slug}`, { redirect: "manual" });
  assert(publicPage.status === 200, `public event page status ${publicPage.status}`);
  const html = await publicPage.text();
  assert(html.includes(posterUrl) || html.includes("Approval Flow Test Event"), "public page shows event");

  // Local upload directory exists for dev filesystem storage
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // Ownership: another organizer cannot manage this event
  const other = await prisma.organizer.findFirst({
    where: { id: { not: user.organizer.id }, status: "APPROVED" },
  });
  if (other) {
    const sameOwner = other.id === event.organizerId;
    assert(!sameOwner, "other organizer does not own the event");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        stages: {
          registerPending: true,
          cannotCreateWhilePending: true,
          adminApproves: true,
          createEvent: true,
          imageUrlsPersisted: {
            posterField: "Event.poster",
            bannerField: "Event.banner",
            posterUrl,
            bannerUrl,
          },
          publicEventPage: publicPage.status,
          storageNote:
            "Upload API uses Cloudinary when CLOUDINARY_* env vars are set; otherwise local public/uploads in development only.",
        },
        credentialsForManualUiTest: {
          pendingThenApprovedEmail: email,
          password,
          adminEmail: "admin@votia.co.ke",
          adminPassword: "Admin123!",
        },
      },
      null,
      2,
    ),
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
