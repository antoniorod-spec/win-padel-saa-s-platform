import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Use DIRECT_URL if available, otherwise DATABASE_URL without pgbouncer
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123456", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@whinpadel.com" },
    update: {},
    create: {
      email: "admin@whinpadel.com",
      passwordHash: adminPassword,
      name: "Admin WhinPadel",
      role: "ADMIN",
    },
  })
  console.log("Admin created:", admin.email)

  // Create clubs
  const clubPassword = await bcrypt.hash("club123456", 12)

  const clubUser1 = await prisma.user.upsert({
    where: { email: "info@advantagepadel.mx" },
    update: {},
    create: {
      email: "info@advantagepadel.mx",
      passwordHash: clubPassword,
      name: "Advantage Padel",
      role: "CLUB",
      club: {
        create: {
          name: "Advantage Padel",
          city: "San Luis Potosi",
          address: "Av. Carranza 2450, Col. Tangamanga",
          indoorCourts: 4,
          outdoorCourts: 4,
          courts: 8,
          status: "APPROVED",
          rating: 4.8,
        },
      },
    },
    include: { club: true },
  })

  const clubUser2 = await prisma.user.upsert({
    where: { email: "info@mariettapadel.mx" },
    update: {},
    create: {
      email: "info@mariettapadel.mx",
      passwordHash: clubPassword,
      name: "Marietta Padel",
      role: "CLUB",
      club: {
        create: {
          name: "Marietta Padel",
          city: "San Luis Potosi",
          address: "Boulevard Río Santiago 150, Lomas 2a Secc",
          indoorCourts: 2,
          outdoorCourts: 4,
          courts: 6,
          status: "APPROVED",
          rating: 4.7,
        },
      },
    },
    include: { club: true },
  })

  const clubUser3 = await prisma.user.upsert({
    where: { email: "info@lomagolf.mx" },
    update: {},
    create: {
      email: "info@lomagolf.mx",
      passwordHash: clubPassword,
      name: "Loma Golf",
      role: "CLUB",
      club: {
        create: {
          name: "Loma Golf",
          city: "San Luis Potosi",
          address: "Privada Loma de San Luis 2001, Lomas Del Tec",
          indoorCourts: 6,
          outdoorCourts: 4,
          courts: 10,
          status: "APPROVED",
          rating: 4.9,
        },
      },
    },
    include: { club: true },
  })

  console.log("Clubs created:", clubUser1.name, clubUser2.name, clubUser3.name)

  // Create sample players
  const playerPassword = await bcrypt.hash("player123456", 12)

  const playerData = [
    { email: "ricardo.solis@email.com", firstName: "Ricardo", lastName: "Solis", city: "San Luis Potosi", sex: "M" as const, points: 2450, played: 22, wins: 17, losses: 5 },
    { email: "omar.fuentes@email.com", firstName: "Omar", lastName: "Fuentes", city: "San Luis Potosi", sex: "M" as const, points: 2280, played: 20, wins: 15, losses: 5 },
    { email: "hector.ibarra@email.com", firstName: "Hector", lastName: "Ibarra", city: "San Luis Potosi", sex: "M" as const, points: 2100, played: 21, wins: 14, losses: 7 },
    { email: "jorge.vega@email.com", firstName: "Jorge", lastName: "Vega", city: "San Luis Potosi", sex: "M" as const, points: 1950, played: 19, wins: 13, losses: 6 },
    { email: "marco.diaz@email.com", firstName: "Marco", lastName: "Diaz", city: "San Luis Potosi", sex: "M" as const, points: 1820, played: 18, wins: 12, losses: 6 },
    { email: "maria.diaz@email.com", firstName: "Maria Fernanda", lastName: "Diaz", city: "San Luis Potosi", sex: "F" as const, points: 2800, played: 24, wins: 19, losses: 5 },
    { email: "ana.vega@email.com", firstName: "Ana Laura", lastName: "Vega", city: "San Luis Potosi", sex: "F" as const, points: 2600, played: 22, wins: 17, losses: 5 },
    { email: "sofia.morales@email.com", firstName: "Sofia", lastName: "Morales", city: "San Luis Potosi", sex: "F" as const, points: 2350, played: 21, wins: 15, losses: 6 },
  ]

  for (const pd of playerData) {
    const user = await prisma.user.upsert({
      where: { email: pd.email },
      update: {},
      create: {
        email: pd.email,
        passwordHash: playerPassword,
        name: `${pd.firstName} ${pd.lastName}`,
        role: "PLAYER",
        player: {
          create: {
            firstName: pd.firstName,
            lastName: pd.lastName,
            city: pd.city,
            sex: pd.sex,
            country: "MX",
          },
        },
      },
      include: { player: true },
    })

    if (user.player) {
      // Create ranking entry
      const modality = pd.sex === "M" ? "VARONIL" : "FEMENIL"
      const category = pd.sex === "M" ? "4ta" : "3ra"

      await prisma.ranking.upsert({
        where: {
          playerId_modality_category: {
            playerId: user.player.id,
            modality,
            category,
          },
        },
        update: {
          points: pd.points,
          played: pd.played,
          wins: pd.wins,
          losses: pd.losses,
        },
        create: {
          playerId: user.player.id,
          modality,
          category,
          points: pd.points,
          played: pd.played,
          wins: pd.wins,
          losses: pd.losses,
        },
      })
    }
  }

  console.log("Players and rankings created")

  // Create a sample tournament
  if (clubUser1.club) {
    const tournament = await prisma.tournament.upsert({
      where: { id: "seed-tournament-1" },
      update: {},
      create: {
        id: "seed-tournament-1",
        clubId: clubUser1.club.id,
        name: "Open SLP 2026",
        description: "El torneo mas importante de San Luis Potosi",
        startDate: new Date("2026-03-15"),
        endDate: new Date("2026-03-17"),
        category: "A",
        format: "ROUND_ROBIN",
        prize: "$50,000 MXN",
        inscriptionPrice: 800,
        maxTeams: 64,
        status: "OPEN",
        modalities: {
          create: [
            { modality: "VARONIL", category: "4ta" },
            { modality: "FEMENIL", category: "3ra" },
          ],
        },
      },
    })
    console.log("Tournament created:", tournament.name)
  }

  // Create pending clubs for admin review
  const pendingClubData = [
    { email: "padel.cancun@email.com", name: "Padel Arena Cancun", city: "Cancun", address: "Av. Bonampak 123, Zona Hotelera", courts: 6, indoorCourts: 3, outdoorCourts: 3 },
    { email: "pro.tijuana@email.com", name: "Pro Padel Tijuana", city: "Tijuana", address: "Blvd. Agua Caliente 456, Zona Rio", courts: 4, indoorCourts: 2, outdoorCourts: 2 },
    { email: "padel.leon@email.com", name: "Padel Zone Leon", city: "Leon", address: "Blvd. Adolfo Lopez Mateos 789", courts: 8, indoorCourts: 4, outdoorCourts: 4 },
  ]

  for (const pc of pendingClubData) {
    await prisma.user.upsert({
      where: { email: pc.email },
      update: {},
      create: {
        email: pc.email,
        passwordHash: clubPassword,
        name: pc.name,
        role: "CLUB",
        club: {
          create: {
            name: pc.name,
            city: pc.city,
            address: pc.address,
            indoorCourts: pc.indoorCourts,
            outdoorCourts: pc.outdoorCourts,
            courts: pc.courts,
            status: "PENDING",
          },
        },
      },
    })
  }

  console.log("Pending clubs created")
  console.log("Seed complete!")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
