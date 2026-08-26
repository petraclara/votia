const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const posterFixed = await prisma.event.updateMany({
    where: { poster: { contains: "photo-1469334031218" } },
    data: {
      poster:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    },
  });
  const bannerFixed = await prisma.event.updateMany({
    where: { banner: { contains: "photo-1492684223066" } },
    data: {
      banner:
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1800&q=80",
    },
  });
  console.log({ posterFixed: posterFixed.count, bannerFixed: bannerFixed.count });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
