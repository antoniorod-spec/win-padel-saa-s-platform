// ============================================================
// RANKING POR CATEGORIA - Cada categoria tiene ranking independiente
// Al ascender, puntos se resetean a 0 en la nueva categoria
// ============================================================

export type RankingPlayer = {
  id: number
  name: string
  city: string
  club: string
  points: number
  played: number
  wins: number
  losses: number
  winRate: number
  trend: "up" | "down" | "same"
  ascensionStreak?: boolean // en racha de ascenso
  categoryHistory?: { cat: string; from: string; to: string }[]
}

// VARONIL 4ta - San Luis Potosi (25 jugadores)
export const varonil4ta: RankingPlayer[] = [
  { id: 101, name: "Ricardo Solis", city: "San Luis Potosi", club: "Advantage Padel", points: 2450, played: 22, wins: 17, losses: 5, winRate: 77, trend: "up", ascensionStreak: true },
  { id: 102, name: "Omar Fuentes", city: "San Luis Potosi", club: "Marietta Padel", points: 2280, played: 20, wins: 15, losses: 5, winRate: 75, trend: "up", ascensionStreak: true },
  { id: 103, name: "Hector Ibarra", city: "San Luis Potosi", club: "Loma Golf", points: 2100, played: 21, wins: 14, losses: 7, winRate: 67, trend: "up" },
  { id: 104, name: "Jorge Vega", city: "San Luis Potosi", club: "Advantage Padel", points: 1950, played: 19, wins: 13, losses: 6, winRate: 68, trend: "same" },
  { id: 105, name: "Marco Diaz", city: "San Luis Potosi", club: "Loma Golf", points: 1820, played: 18, wins: 12, losses: 6, winRate: 67, trend: "up" },
  { id: 106, name: "Raul Mendez", city: "San Luis Potosi", club: "Marietta Padel", points: 1700, played: 20, wins: 12, losses: 8, winRate: 60, trend: "down" },
  { id: 107, name: "Pedro Castano", city: "San Luis Potosi", club: "Advantage Padel", points: 1580, played: 17, wins: 11, losses: 6, winRate: 65, trend: "up" },
  { id: 108, name: "Alberto Rangel", city: "San Luis Potosi", club: "Loma Golf", points: 1450, played: 18, wins: 10, losses: 8, winRate: 56, trend: "same" },
  { id: 109, name: "Francisco Nava", city: "San Luis Potosi", club: "Marietta Padel", points: 1320, played: 16, wins: 9, losses: 7, winRate: 56, trend: "down" },
  { id: 110, name: "Daniel Ochoa", city: "San Luis Potosi", club: "Advantage Padel", points: 1200, played: 15, wins: 9, losses: 6, winRate: 60, trend: "up" },
  { id: 111, name: "Sergio Luna", city: "San Luis Potosi", club: "Loma Golf", points: 1100, played: 16, wins: 8, losses: 8, winRate: 50, trend: "same" },
  { id: 112, name: "Ivan Robles", city: "San Luis Potosi", club: "Marietta Padel", points: 1020, played: 14, wins: 7, losses: 7, winRate: 50, trend: "down" },
  { id: 113, name: "Gabriel Espino", city: "San Luis Potosi", club: "Advantage Padel", points: 950, played: 13, wins: 7, losses: 6, winRate: 54, trend: "up" },
  { id: 114, name: "Enrique Tapia", city: "San Luis Potosi", club: "Loma Golf", points: 870, played: 14, wins: 6, losses: 8, winRate: 43, trend: "down" },
  { id: 115, name: "Adrian Salazar", city: "San Luis Potosi", club: "Marietta Padel", points: 800, played: 12, wins: 6, losses: 6, winRate: 50, trend: "same" },
  { id: 116, name: "Felipe Cordero", city: "San Luis Potosi", club: "Advantage Padel", points: 720, played: 11, wins: 5, losses: 6, winRate: 45, trend: "down" },
  { id: 117, name: "Mauricio Vargas", city: "San Luis Potosi", club: "Loma Golf", points: 650, played: 10, wins: 5, losses: 5, winRate: 50, trend: "up" },
  { id: 118, name: "Arturo Delgado", city: "San Luis Potosi", club: "Marietta Padel", points: 580, played: 10, wins: 4, losses: 6, winRate: 40, trend: "same" },
  { id: 119, name: "Cesar Herrera", city: "San Luis Potosi", club: "Advantage Padel", points: 500, played: 9, wins: 4, losses: 5, winRate: 44, trend: "down" },
  { id: 120, name: "Hugo Reyes", city: "San Luis Potosi", club: "Loma Golf", points: 430, played: 9, wins: 3, losses: 6, winRate: 33, trend: "down" },
  { id: 121, name: "Tomas Aguilar", city: "San Luis Potosi", club: "Marietta Padel", points: 350, played: 8, wins: 3, losses: 5, winRate: 38, trend: "same" },
  { id: 122, name: "Emilio Ponce", city: "San Luis Potosi", club: "Advantage Padel", points: 280, played: 7, wins: 2, losses: 5, winRate: 29, trend: "down" },
  { id: 123, name: "Rodrigo Campos", city: "San Luis Potosi", club: "Loma Golf", points: 200, played: 6, wins: 2, losses: 4, winRate: 33, trend: "same" },
  { id: 124, name: "Gustavo Meza", city: "San Luis Potosi", club: "Marietta Padel", points: 120, played: 5, wins: 1, losses: 4, winRate: 20, trend: "down" },
  { id: 125, name: "Ruben Lara", city: "San Luis Potosi", club: "Advantage Padel", points: 50, played: 3, wins: 1, losses: 2, winRate: 33, trend: "same", categoryHistory: [
    { cat: "6ta", from: "Ene 2025", to: "Jun 2025" },
    { cat: "5ta", from: "Jun 2025", to: "Nov 2025" },
    { cat: "4ta", from: "Nov 2025", to: "Actual" },
  ]},
]

// VARONIL 3ra - San Luis Potosi (15 jugadores)
export const varonil3ra: RankingPlayer[] = [
  { id: 201, name: "Carlos Mendoza", city: "San Luis Potosi", club: "Advantage Padel", points: 3200, played: 30, wins: 24, losses: 6, winRate: 80, trend: "up", ascensionStreak: true },
  { id: 202, name: "Alejandro Ruiz", city: "San Luis Potosi", club: "Marietta Padel", points: 2950, played: 28, wins: 21, losses: 7, winRate: 75, trend: "up" },
  { id: 203, name: "Diego Martinez", city: "San Luis Potosi", club: "Loma Golf", points: 2700, played: 26, wins: 19, losses: 7, winRate: 73, trend: "down" },
  { id: 204, name: "Fernando Lopez", city: "San Luis Potosi", club: "Advantage Padel", points: 2500, played: 25, wins: 17, losses: 8, winRate: 68, trend: "up" },
  { id: 205, name: "Roberto Sanchez", city: "San Luis Potosi", club: "Loma Golf", points: 2300, played: 24, wins: 16, losses: 8, winRate: 67, trend: "same" },
  { id: 206, name: "Miguel A. Torres", city: "San Luis Potosi", club: "Marietta Padel", points: 2100, played: 23, wins: 15, losses: 8, winRate: 65, trend: "up" },
  { id: 207, name: "Andres Gutierrez", city: "San Luis Potosi", club: "Loma Golf", points: 1900, played: 22, wins: 14, losses: 8, winRate: 64, trend: "down" },
  { id: 208, name: "Pablo Hernandez", city: "San Luis Potosi", club: "Advantage Padel", points: 1750, played: 21, wins: 13, losses: 8, winRate: 62, trend: "up" },
  { id: 209, name: "Javier Ramirez", city: "San Luis Potosi", club: "Marietta Padel", points: 1600, played: 20, wins: 12, losses: 8, winRate: 60, trend: "same" },
  { id: 210, name: "Eduardo Castillo", city: "San Luis Potosi", club: "Loma Golf", points: 1450, played: 19, wins: 11, losses: 8, winRate: 58, trend: "up" },
  { id: 211, name: "Santiago Reyes", city: "San Luis Potosi", club: "Advantage Padel", points: 1300, played: 18, wins: 10, losses: 8, winRate: 56, trend: "down" },
  { id: 212, name: "Mateo Flores", city: "San Luis Potosi", club: "Marietta Padel", points: 1100, played: 16, wins: 9, losses: 7, winRate: 56, trend: "same" },
  { id: 213, name: "Nicolas Duarte", city: "San Luis Potosi", club: "Loma Golf", points: 900, played: 15, wins: 7, losses: 8, winRate: 47, trend: "down" },
  { id: 214, name: "Emiliano Rivas", city: "San Luis Potosi", club: "Advantage Padel", points: 700, played: 13, wins: 6, losses: 7, winRate: 46, trend: "same" },
  { id: 215, name: "Sebastian Gil", city: "San Luis Potosi", club: "Marietta Padel", points: 500, played: 11, wins: 5, losses: 6, winRate: 45, trend: "down" },
]

// FEMENIL 3ra - San Luis Potosi (18 jugadoras)
export const femenil3ra: RankingPlayer[] = [
  { id: 301, name: "Maria Fernanda Diaz", city: "San Luis Potosi", club: "Advantage Padel", points: 2800, played: 24, wins: 19, losses: 5, winRate: 79, trend: "up", ascensionStreak: true },
  { id: 302, name: "Ana Laura Vega", city: "San Luis Potosi", club: "Loma Golf", points: 2600, played: 22, wins: 17, losses: 5, winRate: 77, trend: "up" },
  { id: 303, name: "Sofia Morales", city: "San Luis Potosi", club: "Marietta Padel", points: 2350, played: 21, wins: 15, losses: 6, winRate: 71, trend: "down" },
  { id: 304, name: "Valentina Rios", city: "San Luis Potosi", club: "Advantage Padel", points: 2150, played: 20, wins: 14, losses: 6, winRate: 70, trend: "up" },
  { id: 305, name: "Camila Navarro", city: "San Luis Potosi", club: "Loma Golf", points: 1950, played: 19, wins: 13, losses: 6, winRate: 68, trend: "same" },
  { id: 306, name: "Isabella Castro", city: "San Luis Potosi", club: "Marietta Padel", points: 1780, played: 18, wins: 12, losses: 6, winRate: 67, trend: "up", ascensionStreak: true },
  { id: 307, name: "Daniela Ortiz", city: "San Luis Potosi", club: "Advantage Padel", points: 1600, played: 17, wins: 11, losses: 6, winRate: 65, trend: "down" },
  { id: 308, name: "Lucia Herrera", city: "San Luis Potosi", club: "Loma Golf", points: 1450, played: 16, wins: 10, losses: 6, winRate: 63, trend: "up" },
  { id: 309, name: "Andrea Salinas", city: "San Luis Potosi", club: "Marietta Padel", points: 1300, played: 15, wins: 9, losses: 6, winRate: 60, trend: "same" },
  { id: 310, name: "Paula Mendez", city: "San Luis Potosi", club: "Advantage Padel", points: 1150, played: 14, wins: 8, losses: 6, winRate: 57, trend: "up" },
  { id: 311, name: "Regina Leal", city: "San Luis Potosi", club: "Loma Golf", points: 1000, played: 14, wins: 8, losses: 6, winRate: 57, trend: "down" },
  { id: 312, name: "Fernanda Ramos", city: "San Luis Potosi", club: "Marietta Padel", points: 880, played: 12, wins: 6, losses: 6, winRate: 50, trend: "same" },
  { id: 313, name: "Mariana Soto", city: "San Luis Potosi", club: "Advantage Padel", points: 750, played: 11, wins: 6, losses: 5, winRate: 55, trend: "up" },
  { id: 314, name: "Alejandra Cruz", city: "San Luis Potosi", club: "Loma Golf", points: 620, played: 10, wins: 5, losses: 5, winRate: 50, trend: "down" },
  { id: 315, name: "Natalia Paredes", city: "San Luis Potosi", club: "Marietta Padel", points: 500, played: 9, wins: 4, losses: 5, winRate: 44, trend: "same" },
  { id: 316, name: "Gabriela Estrada", city: "San Luis Potosi", club: "Advantage Padel", points: 380, played: 8, wins: 3, losses: 5, winRate: 38, trend: "down" },
  { id: 317, name: "Carolina Luna", city: "San Luis Potosi", club: "Loma Golf", points: 250, played: 7, wins: 2, losses: 5, winRate: 29, trend: "same" },
  { id: 318, name: "Diana Zamora", city: "San Luis Potosi", club: "Marietta Padel", points: 120, played: 5, wins: 1, losses: 4, winRate: 20, trend: "down" },
]

// MIXTO C - San Luis Potosi (20 parejas)
export const mixtoC: RankingPlayer[] = [
  { id: 401, name: "Ricardo Solis / Maria F. Diaz", city: "San Luis Potosi", club: "Advantage Padel", points: 2200, played: 18, wins: 14, losses: 4, winRate: 78, trend: "up", ascensionStreak: true },
  { id: 402, name: "Omar Fuentes / Ana L. Vega", city: "San Luis Potosi", club: "Loma Golf", points: 2050, played: 17, wins: 13, losses: 4, winRate: 76, trend: "up" },
  { id: 403, name: "Hector Ibarra / Sofia Morales", city: "San Luis Potosi", club: "Marietta Padel", points: 1900, played: 16, wins: 12, losses: 4, winRate: 75, trend: "up" },
  { id: 404, name: "Jorge Vega / Valentina Rios", city: "San Luis Potosi", club: "Advantage Padel", points: 1750, played: 16, wins: 11, losses: 5, winRate: 69, trend: "same" },
  { id: 405, name: "Marco Diaz / Camila Navarro", city: "San Luis Potosi", club: "Loma Golf", points: 1600, played: 15, wins: 10, losses: 5, winRate: 67, trend: "up" },
  { id: 406, name: "Raul Mendez / Isabella Castro", city: "San Luis Potosi", club: "Marietta Padel", points: 1450, played: 14, wins: 9, losses: 5, winRate: 64, trend: "down" },
  { id: 407, name: "Pedro Castano / Daniela Ortiz", city: "San Luis Potosi", club: "Advantage Padel", points: 1300, played: 13, wins: 8, losses: 5, winRate: 62, trend: "up" },
  { id: 408, name: "Alberto Rangel / Lucia Herrera", city: "San Luis Potosi", club: "Loma Golf", points: 1180, played: 13, wins: 8, losses: 5, winRate: 62, trend: "same" },
  { id: 409, name: "Francisco Nava / Andrea Salinas", city: "San Luis Potosi", club: "Marietta Padel", points: 1050, played: 12, wins: 7, losses: 5, winRate: 58, trend: "down" },
  { id: 410, name: "Daniel Ochoa / Paula Mendez", city: "San Luis Potosi", club: "Advantage Padel", points: 950, played: 12, wins: 7, losses: 5, winRate: 58, trend: "up" },
  { id: 411, name: "Sergio Luna / Regina Leal", city: "San Luis Potosi", club: "Loma Golf", points: 850, played: 11, wins: 6, losses: 5, winRate: 55, trend: "same" },
  { id: 412, name: "Ivan Robles / Fernanda Ramos", city: "San Luis Potosi", club: "Marietta Padel", points: 750, played: 10, wins: 5, losses: 5, winRate: 50, trend: "down" },
  { id: 413, name: "Gabriel Espino / Mariana Soto", city: "San Luis Potosi", club: "Advantage Padel", points: 660, played: 10, wins: 5, losses: 5, winRate: 50, trend: "up" },
  { id: 414, name: "Enrique Tapia / Alejandra Cruz", city: "San Luis Potosi", club: "Loma Golf", points: 580, played: 9, wins: 4, losses: 5, winRate: 44, trend: "down" },
  { id: 415, name: "Adrian Salazar / Natalia Paredes", city: "San Luis Potosi", club: "Marietta Padel", points: 500, played: 8, wins: 4, losses: 4, winRate: 50, trend: "same" },
  { id: 416, name: "Felipe Cordero / Gabriela Estrada", city: "San Luis Potosi", club: "Advantage Padel", points: 420, played: 8, wins: 3, losses: 5, winRate: 38, trend: "down" },
  { id: 417, name: "Mauricio Vargas / Carolina Luna", city: "San Luis Potosi", club: "Loma Golf", points: 340, played: 7, wins: 3, losses: 4, winRate: 43, trend: "same" },
  { id: 418, name: "Arturo Delgado / Diana Zamora", city: "San Luis Potosi", club: "Marietta Padel", points: 260, played: 6, wins: 2, losses: 4, winRate: 33, trend: "down" },
  { id: 419, name: "Cesar Herrera / Paula Mendez", city: "San Luis Potosi", club: "Advantage Padel", points: 180, played: 5, wins: 2, losses: 3, winRate: 40, trend: "same" },
  { id: 420, name: "Hugo Reyes / Regina Leal", city: "San Luis Potosi", club: "Loma Golf", points: 100, played: 4, wins: 1, losses: 3, winRate: 25, trend: "down" },
]

// Lookup map for rankings by modality and category
export const rankingsByCategory: Record<string, Record<string, RankingPlayer[]>> = {
  varonil: {
    "6ta": [],
    "5ta": [],
    "4ta": varonil4ta,
    "3ra": varonil3ra,
    "2da": [],
    "1ra": [],
  },
  femenil: {
    "6ta": [],
    "5ta": [],
    "4ta": [],
    "3ra": femenil3ra,
    "2da": [],
    "1ra": [],
  },
  mixto: {
    "D": [],
    "C": mixtoC,
    "B": [],
    "A": [],
  },
}

// Categories per modality
export const categoriesByModality: Record<string, string[]> = {
  varonil: ["1ra", "2da", "3ra", "4ta", "5ta", "6ta"],
  femenil: ["1ra", "2da", "3ra", "4ta", "5ta", "6ta"],
  mixto: ["A", "B", "C", "D"],
}

// Ascension rules
export const ascensionRules = [
  { rule: "Ganar un torneo", result: "Ascenso automatico inmediato" },
  { rule: "Llegar a la final en 2 torneos consecutivos", result: "Ascenso automatico" },
  { rule: "Semifinales en 3 de ultimos 5 torneos", result: "Revision por comite" },
  { rule: "Al ascender", result: "Puntos = 0 en nueva categoria" },
]

export const descentRules = [
  { rule: "Eliminado en 1ra ronda en 5 torneos consecutivos", result: "Puede solicitar descenso" },
  { rule: "El comite revisa y aprueba/rechaza", result: "Si desciende: Puntos = 0 en categoria inferior" },
]

// Player profile example - jugador que subio de 6ta a 4ta
export const playerProfileExample = {
  id: 125,
  name: "Ruben Lara",
  city: "San Luis Potosi",
  club: "Advantage Padel",
  modality: "Varonil",
  currentCategory: "4ta",
  currentPoints: 50,
  currentPosition: 25,
  totalInCategory: 25,
  categoryHistory: [
    { cat: "6ta", from: "Ene 2025", to: "Jun 2025", maxPoints: 2100, reason: "Gano Torneo Express #5" },
    { cat: "5ta", from: "Jun 2025", to: "Nov 2025", maxPoints: 1800, reason: "2 finales consecutivas" },
    { cat: "4ta", from: "Nov 2025", to: "Actual", maxPoints: 50, reason: null },
  ],
  pointsEvolution: [
    // 6ta
    { month: "Ene 25", points: 0, category: "6ta" },
    { month: "Feb 25", points: 400, category: "6ta" },
    { month: "Mar 25", points: 900, category: "6ta" },
    { month: "Abr 25", points: 1400, category: "6ta" },
    { month: "May 25", points: 2100, category: "6ta" },
    // Ascenso a 5ta - reset
    { month: "Jun 25", points: 0, category: "5ta" },
    { month: "Jul 25", points: 350, category: "5ta" },
    { month: "Ago 25", points: 800, category: "5ta" },
    { month: "Sep 25", points: 1200, category: "5ta" },
    { month: "Oct 25", points: 1800, category: "5ta" },
    // Ascenso a 4ta - reset
    { month: "Nov 25", points: 0, category: "4ta" },
    { month: "Dic 25", points: 0, category: "4ta" },
    { month: "Ene 26", points: 20, category: "4ta" },
    { month: "Feb 26", points: 50, category: "4ta" },
  ],
}

// Keep top-level exports for backward compat (landing page preview)
export const topPlayers = varonil4ta.slice(0, 5)
export const topFemPlayers = femenil3ra.slice(0, 3)

export const upcomingTournaments = [
  {
    id: 1,
    name: "Open SLP 2026",
    club: "Advantage Padel",
    city: "San Luis Potosi",
    date: "15-17 Mar 2026",
    category: "A",
    modalities: ["Varonil", "Femenil"],
    teams: 32,
    maxTeams: 64,
    prize: "$50,000 MXN",
    status: "Inscripciones abiertas",
  },
  {
    id: 2,
    name: "Copa Marietta Elite",
    club: "Marietta Padel",
    city: "San Luis Potosi",
    date: "22-23 Mar 2026",
    category: "B",
    modalities: ["Varonil", "Mixto"],
    teams: 18,
    maxTeams: 32,
    prize: "$25,000 MXN",
    status: "Inscripciones abiertas",
  },
  {
    id: 3,
    name: "Loma Golf Masters",
    club: "Loma Golf",
    city: "San Luis Potosi",
    date: "5-7 Abr 2026",
    category: "A",
    modalities: ["Varonil", "Femenil", "Mixto"],
    teams: 48,
    maxTeams: 64,
    prize: "$40,000 MXN",
    status: "Inscripciones abiertas",
  },
  {
    id: 4,
    name: "Express Advantage Weekend",
    club: "Advantage Padel",
    city: "San Luis Potosi",
    date: "29 Mar 2026",
    category: "C",
    modalities: ["Varonil"],
    teams: 12,
    maxTeams: 16,
    prize: "$10,000 MXN",
    status: "Casi lleno",
  },
]

export const clubs = [
  { id: 1, name: "Advantage Padel", city: "San Luis Potosi", courts: 8, players: 210, tournaments: 18, rating: 4.8 },
  { id: 2, name: "Marietta Padel", city: "San Luis Potosi", courts: 6, players: 160, tournaments: 12, rating: 4.7 },
  { id: 3, name: "Loma Golf", city: "San Luis Potosi", courts: 10, players: 280, tournaments: 22, rating: 4.9 },
]

export const sampleBracket = {
  tournamentName: "Open SLP 2026 - Varonil 1ra",
  rounds: [
    {
      name: "Cuartos de Final",
      matches: [
        { id: 1, teamA: { name: "Mendoza / Ruiz", seed: 1, score: [6, 6] }, teamB: { name: "Ibarra / Soto", seed: 8, score: [3, 2] }, winner: "A" as const },
        { id: 2, teamA: { name: "Martinez / Lopez", seed: 4, score: [6, 4, 6] }, teamB: { name: "Navarro / Reyes", seed: 5, score: [3, 6, 3] }, winner: "A" as const },
        { id: 3, teamA: { name: "Sanchez / Torres", seed: 3, score: [6, 7] }, teamB: { name: "Rojas / Herrera", seed: 6, score: [4, 5] }, winner: "A" as const },
        { id: 4, teamA: { name: "Gutierrez / Hernandez", seed: 2, score: [6, 3, 7] }, teamB: { name: "Delgado / Rios", seed: 7, score: [4, 6, 5] }, winner: "A" as const },
      ],
    },
    {
      name: "Semifinales",
      matches: [
        { id: 5, teamA: { name: "Mendoza / Ruiz", seed: 1, score: [6, 6] }, teamB: { name: "Martinez / Lopez", seed: 4, score: [4, 3] }, winner: "A" as const },
        { id: 6, teamA: { name: "Sanchez / Torres", seed: 3, score: [3, 6, 4] }, teamB: { name: "Gutierrez / Hernandez", seed: 2, score: [6, 3, 6] }, winner: "B" as const },
      ],
    },
    {
      name: "Final",
      matches: [
        { id: 7, teamA: { name: "Mendoza / Ruiz", seed: 1, score: [7, 6] }, teamB: { name: "Gutierrez / Hernandez", seed: 2, score: [5, 4] }, winner: "A" as const },
      ],
    },
  ],
}

export const playerStats = {
  // Points evolution for Ricardo Solis (4ta varonil, leading)
  monthlyPoints: [
    { month: "Sep", points: 0 },
    { month: "Oct", points: 350 },
    { month: "Nov", points: 700 },
    { month: "Dic", points: 1100 },
    { month: "Ene", points: 1500 },
    { month: "Feb", points: 1900 },
    { month: "Mar", points: 2200 },
    { month: "Abr", points: 2450 },
  ],
  recentMatches: [
    { opponent: "Omar Fuentes / Raul Mendez", tournament: "Open SLP 2026", result: "W", score: "6-4, 6-3", date: "15 Mar 2026" },
    { opponent: "Hector Ibarra / Marco Diaz", tournament: "Open SLP 2026", result: "W", score: "7-5, 6-4", date: "16 Mar 2026" },
    { opponent: "Pedro Castano / Alberto Rangel", tournament: "Open SLP 2026", result: "W", score: "7-5, 6-4", date: "17 Mar 2026" },
    { opponent: "Francisco Nava / Daniel Ochoa", tournament: "Copa Marietta Elite", result: "W", score: "6-2, 6-1", date: "22 Mar 2026" },
    { opponent: "Jorge Vega / Sergio Luna", tournament: "Copa Marietta Elite", result: "L", score: "4-6, 3-6", date: "23 Mar 2026" },
  ],
}

export const adminStats = {
  totalClubs: 3,
  activePlayers: 4280,
  activeTournaments: 23,
  monthlyRevenue: "$1,250,000 MXN",
  newPlayersThisMonth: 342,
  pendingClubs: 8,
  categoryDisputes: 12,
}

export const clubDashboardStats = {
  activeTournaments: 3,
  totalPlayers: 320,
  pendingPayments: 15,
  monthlyRevenue: "$85,000 MXN",
  courtsAvailable: 12,
  upcomingMatches: 24,
}

export const pointsTable = {
  categoryA: [
    { round: "Campeon", points: 1000 },
    { round: "Subcampeon (Final)", points: 700 },
    { round: "Semifinalista", points: 500 },
    { round: "Cuartofinalista", points: 300 },
    { round: "Octavos de final", points: 175 },
    { round: "Dieciseisavos", points: 100 },
    { round: "Fase de grupos", points: 50 },
  ],
  categoryB: [
    { round: "Campeon", points: 700 },
    { round: "Subcampeon", points: 500 },
    { round: "Semifinalista", points: 350 },
    { round: "Cuartofinalista", points: 200 },
    { round: "Octavos", points: 100 },
    { round: "Fase de grupos", points: 30 },
  ],
  categoryC: [
    { round: "Campeon", points: 400 },
    { round: "Subcampeon", points: 275 },
    { round: "Semifinalista", points: 175 },
    { round: "Cuartofinalista", points: 100 },
    { round: "Fase de grupos", points: 20 },
  ],
}
