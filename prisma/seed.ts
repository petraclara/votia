import { PrismaClient, EventMode, EventStatus, VoteVisibility } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const portraits = [
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
];

async function main() {
  await prisma.webhookEvent.deleteMany();
  await prisma.voteTransaction.deleteMany();
  await prisma.ticketOrder.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.contestant.deleteMany();
  await prisma.event.deleteMany();
  await prisma.organizer.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const organizerPassword = await bcrypt.hash("Organizer123!", 12);

  await prisma.user.create({
    data: {
      name: "Votia Admin",
      email: "admin@votia.co.ke",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const organizerUser = await prisma.user.create({
    data: {
      name: "Amina Otieno",
      email: "organizer@votia.co.ke",
      passwordHash: organizerPassword,
      role: "ORGANIZER",
      organizer: {
        create: {
          organizationName: "Horizon Events Kenya",
          phone: "+254711000111",
          status: "APPROVED",
        },
      },
    },
    include: { organizer: true },
  });

  const organizerId = organizerUser.organizer!.id;

  const missNairobi = await prisma.event.create({
    data: {
      organizerId,
      name: "Miss Nairobi 2026",
      slug: "miss-nairobi-2026",
      description:
        "Miss Nairobi 2026 celebrates poise, purpose and community leadership. Vote for the contestant who represents the city with confidence.",
      poster:
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
      banner:
        "https://images.unsplash.com/photo-1492684223066-81342eea52d3?auto=format&fit=crop&w=1800&q=80",
      location: "Nairobi",
      venue: "KICC Grand Ballroom",
      eventDate: new Date("2026-09-27T18:00:00+03:00"),
      votingStart: new Date("2026-08-01T08:00:00+03:00"),
      votingEnd: new Date("2026-09-26T23:59:00+03:00"),
      status: EventStatus.LIVE,
      mode: EventMode.VOTING_AND_TICKETS,
      votePrice: 10,
      ticketingEnabled: true,
      voteVisibility: VoteVisibility.AFTER_CLOSE,
    },
  });

  const fashion = await prisma.event.create({
    data: {
      organizerId,
      name: "East Africa Fashion Awards",
      slug: "east-africa-fashion-awards",
      description:
        "A runway celebration of designers, models and creative directors shaping East African fashion.",
      poster:
        "https://images.unsplash.com/photo-1469334031218-e4a394c2b19e?auto=format&fit=crop&w=1200&q=80",
      banner:
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1800&q=80",
      location: "Nairobi",
      venue: "The Sarit Centre",
      eventDate: new Date("2026-10-18T17:00:00+03:00"),
      votingStart: new Date("2026-08-10T08:00:00+03:00"),
      votingEnd: new Date("2026-10-17T22:00:00+03:00"),
      status: EventStatus.LIVE,
      mode: EventMode.VOTING_ONLY,
      votePrice: 10,
      ticketingEnabled: false,
      voteVisibility: VoteVisibility.HIDDEN,
    },
  });

  const campus = await prisma.event.create({
    data: {
      organizerId,
      name: "Campus King & Queen 2026",
      slug: "campus-king-queen-2026",
      description:
        "Universities across Kenya compete for campus royalty. Voting opens closer to the grand finale.",
      poster:
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80",
      banner:
        "https://images.unsplash.com/photo-1541339902988-6ccde585e99b?auto=format&fit=crop&w=1800&q=80",
      location: "Eldoret",
      venue: "University Pavilion",
      eventDate: new Date("2026-11-14T16:00:00+03:00"),
      votingStart: new Date("2026-10-01T08:00:00+03:00"),
      votingEnd: new Date("2026-11-13T22:00:00+03:00"),
      status: EventStatus.UPCOMING,
      mode: EventMode.VOTING_AND_TICKETS,
      votePrice: 10,
      ticketingEnabled: true,
      voteVisibility: VoteVisibility.VISIBLE,
    },
  });

  const talent = await prisma.event.create({
    data: {
      organizerId,
      name: "Kenya Talent Awards",
      slug: "kenya-talent-awards",
      description:
        "Singers, dancers, poets and comedians battled for the 2026 Kenya Talent Awards.",
      poster:
        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
      banner:
        "https://images.unsplash.com/photo-1501281668745-f2f0c15b32d2?auto=format&fit=crop&w=1800&q=80",
      location: "Mombasa",
      venue: "Mama Ngina Waterfront",
      eventDate: new Date("2026-07-12T18:00:00+03:00"),
      votingStart: new Date("2026-06-01T08:00:00+03:00"),
      votingEnd: new Date("2026-07-11T22:00:00+03:00"),
      status: EventStatus.COMPLETED,
      mode: EventMode.VOTING_ONLY,
      votePrice: 10,
      ticketingEnabled: false,
      voteVisibility: VoteVisibility.VISIBLE,
    },
  });

  const missContestants = [
    ["Sarah Mwangi", "08", "Miss Nairobi 2026", "A community mentor from Westlands who champions girls’ education."],
    ["Aisha Hassan", "03", "Miss Nairobi 2026", "A designer and volunteer from Eastleigh with a focus on sustainable fashion."],
    ["Wanjiku Njoroge", "11", "Miss Nairobi 2026", "A medical student and youth advocate representing Lang’ata."],
    ["Faith Atieno", "15", "Miss Nairobi 2026", "A spoken-word artist working with community theatre groups in Kibra."],
  ];

  for (const [index, [name, number, category, bio]] of missContestants.entries()) {
    await prisma.contestant.create({
      data: {
        eventId: missNairobi.id,
        name,
        slug: name.toLowerCase().replace(/ /g, "-"),
        contestantNumber: number,
        category,
        bio,
        image: portraits[index],
        instagram: "https://instagram.com",
      },
    });
  }

  const fashionContestants = [
    ["Brian Kimani", "01", "Designer of the Year", "Known for contemporary suiting with Kenyan textile details."],
    ["Lulu Wekesa", "04", "Model of the Year", "A runway regular across Nairobi Fashion Week and Kampala shows."],
    ["Noelle Achieng", "07", "Creative Director", "Builds brand worlds for emerging East African labels."],
  ];
  for (const [index, [name, number, category, bio]] of fashionContestants.entries()) {
    await prisma.contestant.create({
      data: {
        eventId: fashion.id,
        name,
        slug: name.toLowerCase().replace(/ /g, "-"),
        contestantNumber: number,
        category,
        bio,
        image: portraits[index + 2],
      },
    });
  }

  const campusContestants = [
    ["Daniel Kipchoge", "02", "Campus King", "Sports captain and peer mentor at a Rift Valley university."],
    ["Mercy Chebet", "06", "Campus Queen", "Student leader focused on mental health clubs and campus radio."],
  ];
  for (const [index, [name, number, category, bio]] of campusContestants.entries()) {
    await prisma.contestant.create({
      data: {
        eventId: campus.id,
        name,
        slug: name.toLowerCase().replace(/ /g, "-"),
        contestantNumber: number,
        category,
        bio,
        image: portraits[index + 4],
      },
    });
  }

  const talentContestants = [
    ["Kevin Otieno", "09", "Vocalist", "A gospel and afro-soul vocalist from Kisumu."],
    ["Zawadi Muthoni", "12", "Dance", "Contemporary dancer blending traditional and urban movement."],
  ];
  for (const [index, [name, number, category, bio]] of talentContestants.entries()) {
    await prisma.contestant.create({
      data: {
        eventId: talent.id,
        name,
        slug: name.toLowerCase().replace(/ /g, "-"),
        contestantNumber: number,
        category,
        bio,
        image: portraits[index],
        voteCount: 1200 + index * 340,
      },
    });
  }

  await prisma.ticket.createMany({
    data: [
      { eventId: missNairobi.id, name: "Regular", price: 500, quantity: 400 },
      { eventId: missNairobi.id, name: "VIP", price: 1500, quantity: 120 },
      { eventId: missNairobi.id, name: "VVIP", price: 3000, quantity: 40 },
      { eventId: campus.id, name: "Regular", price: 300, quantity: 600 },
      { eventId: campus.id, name: "VIP", price: 1000, quantity: 80 },
    ],
  });

  const sarah = await prisma.contestant.findFirst({
    where: { name: "Sarah Mwangi" },
  });
  if (sarah) {
    await prisma.voteTransaction.create({
      data: {
        eventId: missNairobi.id,
        contestantId: sarah.id,
        voteQuantity: 20,
        amount: 200,
        currency: "KES",
        apiRef: "vote_seed_sample",
        status: "PENDING",
        processed: false,
        customerEmail: "fan@example.com",
      },
    });
  }

  console.log("Seed complete. Admin: admin@votia.co.ke / Admin123!");
  console.log("Organizer: organizer@votia.co.ke / Organizer123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
