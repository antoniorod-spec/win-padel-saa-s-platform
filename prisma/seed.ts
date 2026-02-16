import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// External demo covers (long images) provided by user.
// photos[0] is used as the "cover" in /clubes and /clubes/[id].
const DEMO_COVER_1 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuADtl8vDNLK78sUMtfcOIT1GzWV2eR6yrtRN01mwbIf75omTObakTMF1NPqAACWtqjzVi4AWxKcWJIuLKiE4rNza0UYWtPmXe_xd1vzBbCU9o_ZPbSAosECx3uaaWMyQygA6uj-LNJ0TK5AB5ujs5c-9PvYnI430A0sILHRECXDskEtKW7Slt9n2FmFHuhO2dZw8PTqwiij5t5at-GUAuQ3_QI80ZA6X3biuzTWhD0Z58spNBCh6sObHMHJLg5-Esha8VxfVGktIZU"
const DEMO_COVER_2 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAec6MLz3LsKi2m6suRUSNX8qOKx0GTAPH_vK42HZ066yxAsyDGvXv0sXQXiAMaxG3flhMCl784oORoiIBsuUFn6pwYlbsLdNQJuT7LdT-bC5JrBJbLWNK-jtGxHuBYyergTFanJI02Zae7juUZJblcmZDbXjLBWSHWdBQ0_S9t88a6rK7XxFs21PNmasgEm5zf-Zj3zbIwK-QQ4oAwKWqpqFDrvJi8_yhSH7JBb2wpMVmivCFhguSRhK3e99qAuHCyHUc0lTbBkoI"
const DEMO_COVER_3 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuClJVM1EVaQVTPTg7d5gyRK8yl3TNdqHwmMPljoqaECXdltgZ9s5-Jc2ICF2dLSNrFpOQPhCIGrhfJsYP_Fp_8Fcbw8B36PnqTRy5Qsk6WBuuE-TqwsTd8I_TcR6IIZY95DxJS_M7o2C0JtvvJvyrU05fUFobm08byMVGbFRDAeOl46EZw5_qJQ84ENRw151eehBUy9cT4Be8Ne28kjAvVDbgAnaI3ZcvIniTKCZs0QIH5itq1_aZ2oe5ai3r6df7l8Mp6Jw4BuGXI"
const DEMO_COVER_4 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA5Nw2AzqKcVMumHz83JB879v5bADekOEfdRIpd7p8TzsbdbzqeLVJOJKjc4xys2i660dBzqkDCtsZkY4iGBF8mQ4ZTFe4wy38thAIK0JWD4clweQ8lLODXEN6M8KlANUlqB1e_la4aZD6XgmKEzpxhWHkYHWAt0M1iWs2YtMc6b9LnbAm5sQC0yoQHRZBWEjnsBis-nqz-xKkdYc1AxEZIzPwMHcKehXxTl_aIXJz1y28ViWQXhpwbhuxdlbjHOsbE_-RWNmYH0Fo"

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
          contactName: "Carlos Rodriguez",
          contactPhone: "4441234567",
          rfc: "ADP220101A1A",
          phone: "4441234567",
          state: "San Luis Potosi",
          city: "San Luis Potosi",
          address: "Av. Carranza 2450, Col. Tangamanga",
          latitude: 22.1442,
          longitude: -100.9803,
          indoorCourts: 4,
          outdoorCourts: 4,
          courts: 8,
          status: "APPROVED",
          rating: 4.8,
          logoUrl: "/demo/logos/advantage.svg",
          photos: [DEMO_COVER_1, DEMO_COVER_2, DEMO_COVER_3, DEMO_COVER_4],
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
          contactName: "Maria Fernandez",
          contactPhone: "4449876543",
          rfc: "MPD210915B2B",
          phone: "4449876543",
          state: "San Luis Potosi",
          city: "San Luis Potosi",
          address: "Boulevard Río Santiago 150, Lomas 2a Secc",
          latitude: 22.1524,
          longitude: -100.9634,
          indoorCourts: 2,
          outdoorCourts: 4,
          courts: 6,
          status: "APPROVED",
          rating: 4.7,
          logoUrl: "/demo/logos/marietta.svg",
          photos: [DEMO_COVER_2, DEMO_COVER_1, DEMO_COVER_3, DEMO_COVER_4],
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
          contactName: "Juan Martinez",
          contactPhone: "4445551234",
          rfc: "LGP200520C3C",
          phone: "4445551234",
          state: "San Luis Potosi",
          city: "San Luis Potosi",
          address: "Privada Loma de San Luis 2001, Lomas Del Tec",
          latitude: 22.1485,
          longitude: -100.9245,
          indoorCourts: 6,
          outdoorCourts: 4,
          courts: 10,
          status: "APPROVED",
          rating: 4.9,
          logoUrl: "/demo/logos/loma.svg",
          photos: [DEMO_COVER_3, DEMO_COVER_1, DEMO_COVER_2, DEMO_COVER_4],
        },
      },
    },
    include: { club: true },
  })

  console.log("Clubs created:", clubUser1.name, clubUser2.name, clubUser3.name)

  // Ensure demo clubs always have "Stitch-like" media + contact links (even if they already existed).
  // Upserts above use update: {} so we patch the club records explicitly for consistent demos.
  await prisma.club.updateMany({
    where: { name: "Advantage Padel" },
    data: {
      email: "info@advantagepadel.mx",
      website: "https://advantagepadel.mx",
      whatsapp: "+52 444 123 4567",
      instagram: "https://instagram.com/advantagepadel",
      facebook: "https://facebook.com/advantagepadel",
      logoUrl: "/demo/logos/advantage.svg",
      photos: [DEMO_COVER_1, DEMO_COVER_2, DEMO_COVER_3, DEMO_COVER_4],
    },
  })
  await prisma.club.updateMany({
    where: { name: "Marietta Padel" },
    data: {
      email: "info@mariettapadel.mx",
      website: "https://mariettapadel.mx",
      whatsapp: "+52 444 987 6543",
      instagram: "https://instagram.com/mariettapadel",
      facebook: "https://facebook.com/mariettapadel",
      logoUrl: "/demo/logos/marietta.svg",
      photos: [DEMO_COVER_2, DEMO_COVER_1, DEMO_COVER_3, DEMO_COVER_4],
    },
  })
  await prisma.club.updateMany({
    where: { name: "Loma Golf" },
    data: {
      email: "info@lomagolf.mx",
      website: "https://lomagolf.mx",
      whatsapp: "+52 444 555 1234",
      instagram: "https://instagram.com/lomagolf",
      facebook: "https://facebook.com/lomagolf",
      logoUrl: "/demo/logos/loma.svg",
      photos: [DEMO_COVER_3, DEMO_COVER_1, DEMO_COVER_2, DEMO_COVER_4],
    },
  })

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
          playerId_modality_category_scope: {
            playerId: user.player.id,
            modality,
            category,
            scope: "NATIONAL",
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
          scope: "NATIONAL",
          associationId: null,
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
    { 
      email: "padel.cancun@email.com", 
      name: "Padel Arena Cancun", 
      contactName: "Roberto Sanchez",
      contactPhone: "9981234567",
      rfc: "PAC230301D4D",
      phone: "9981234567",
      state: "Quintana Roo",
      city: "Cancun", 
      address: "Av. Bonampak 123, Zona Hotelera", 
      latitude: 21.1619, 
      longitude: -86.8515, 
      courts: 6, 
      indoorCourts: 3, 
      outdoorCourts: 3 
    },
    { 
      email: "pro.tijuana@email.com", 
      name: "Pro Padel Tijuana", 
      contactName: "Patricia Lopez",
      contactPhone: "6649876543",
      rfc: "PPT220815E5E",
      phone: "6649876543",
      state: "Baja California",
      city: "Tijuana", 
      address: "Blvd. Agua Caliente 456, Zona Rio", 
      latitude: 32.5149, 
      longitude: -117.0382, 
      courts: 4, 
      indoorCourts: 2, 
      outdoorCourts: 2 
    },
    { 
      email: "padel.leon@email.com", 
      name: "Padel Zone Leon", 
      contactName: "Miguel Torres",
      contactPhone: "4775551111",
      rfc: "PZL210601F6F",
      phone: "4775551111",
      state: "Guanajuato",
      city: "Leon", 
      address: "Blvd. Adolfo Lopez Mateos 789", 
      latitude: 21.1216, 
      longitude: -101.6827, 
      courts: 8, 
      indoorCourts: 4, 
      outdoorCourts: 4 
    },
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
            contactName: pc.contactName,
            contactPhone: pc.contactPhone,
            rfc: pc.rfc,
            phone: pc.phone,
            state: pc.state,
            city: pc.city,
            address: pc.address,
            latitude: pc.latitude,
            longitude: pc.longitude,
            indoorCourts: pc.indoorCourts,
            outdoorCourts: pc.outdoorCourts,
            courts: pc.courts,
            status: "PENDING",
            logoUrl: "/demo/logos/default.svg",
            photos: ["/demo/covers/default.svg"],
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
