# PRD Técnico + Prompts para Cursor
## Sistema Automatizado de Torneos de Pádel — Ranking Padel MX / WhinPadel

**Stack:** Next.js 14 (App Router) • Prisma • Supabase • shadcn/ui • Vercel
**Versión:** 1.0 — Febrero 2026

---

# PARTE 1: PRD TÉCNICO

## 1. Contexto del Proyecto

### 1.1 Stack Tecnológico
- **Framework:** Next.js 14+ con App Router (carpeta `app/`)
- **ORM:** Prisma con PostgreSQL (Supabase)
- **Auth:** Supabase Auth (ya implementado)
- **UI:** shadcn/ui + Tailwind CSS
- **Deploy:** Vercel
- **Package manager:** pnpm

### 1.2 Lo que ya existe
El proyecto ya tiene implementado: autenticación de usuarios (PLAYER, CLUB, ADMIN), registro de clubes con onboarding multi-paso, modelo de torneos con modalidades y registros de parejas, sistema de ranking por jugador/modalidad/categoría, modelo de Match para partidos, e importación de torneos/jugadores desde Excel.

### 1.3 Lo que falta construir
El módulo de generación automática de torneos:
- Configuración de canchas y horarios por torneo
- Captura de disponibilidad de parejas
- Algoritmo de generación de grupos con cabezas de serie
- Algoritmo de calendarización con control de empalmes
- Generación del cuadro eliminatorio con cruces en espejo y ronda previa
- Interfaz para edición manual post-generación

---

## 2. Cambios al Schema de Prisma

### 2.1 Nuevos Modelos

#### Court (Canchas del club para el torneo)
```prisma
model Court {
  id              String   @id @default(cuid())
  tournamentId    String
  name            String   // 'Marietta 1', 'Catalá 2'
  venue           String   // Sede: 'Marietta', 'Catalá'
  isIndoor        Boolean  @default(false)
  createdAt       DateTime @default(now())

  tournament      Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  availabilities  CourtAvailability[]
  slots           MatchSlot[]

  @@map("tournament_courts")
}
```

#### CourtAvailability (Horarios por cancha por día)
```prisma
model CourtAvailability {
  id          String    @id @default(cuid())
  courtId     String
  dayOfWeek   Int       // 0=Dom, 1=Lun ... 6=Sáb
  startTime   String    // '16:30'
  endTime     String    // '22:00'
  specificDate DateTime? // Para días específicos

  court Court @relation(fields: [courtId], references: [id], onDelete: Cascade)

  @@map("court_availabilities")
}
```

#### MatchSlot (Slots de tiempo generados)
```prisma
model MatchSlot {
  id          String     @id @default(cuid())
  courtId     String
  date        DateTime   // Fecha del slot
  startTime   String     // '16:30'
  endTime     String     // '17:40'
  status      SlotStatus @default(AVAILABLE)
  matchId     String?    @unique

  court  Court  @relation(fields: [courtId], references: [id], onDelete: Cascade)
  match  Match? @relation(fields: [matchId], references: [id], onDelete: SetNull)

  @@unique([courtId, date, startTime])
  @@map("match_slots")
}
```

#### TournamentGroup (Grupos de fase de grupos)
```prisma
model TournamentGroup {
  id                   String @id @default(cuid())
  tournamentModalityId String
  name                 String // 'A', 'B', 'C'...
  groupSize            Int    // 3 o 4
  order                Int    // Orden del grupo

  modality    TournamentModality @relation(fields: [tournamentModalityId], references: [id], onDelete: Cascade)
  placements  GroupPlacement[]
  matches     Match[]

  @@unique([tournamentModalityId, name])
  @@map("tournament_groups")
}
```

#### GroupPlacement (Pareja dentro de un grupo)
```prisma
model GroupPlacement {
  id              String @id @default(cuid())
  groupId         String
  registrationId  String
  seed            Int?    // 1 = cabeza de serie
  position        Int?    // Posición final en grupo
  matchesPlayed   Int     @default(0)
  matchesWon      Int     @default(0)
  matchesLost     Int     @default(0)
  setsWon         Int     @default(0)
  setsLost        Int     @default(0)
  gamesWon        Int     @default(0)
  gamesLost       Int     @default(0)
  points          Int     @default(0)

  group         TournamentGroup        @relation(fields: [groupId], references: [id], onDelete: Cascade)
  registration  TournamentRegistration @relation(fields: [registrationId], references: [id], onDelete: Cascade)

  @@unique([groupId, registrationId])
  @@map("group_placements")
}
```

#### PairAvailability (Disponibilidad de la pareja)
```prisma
model PairAvailability {
  id              String    @id @default(cuid())
  registrationId  String
  dayOfWeek       Int       // 0-6
  startTime       String    // '16:00'
  endTime         String    // '22:00'
  specificDate    DateTime?
  available       Boolean   @default(true)

  registration TournamentRegistration @relation(fields: [registrationId], references: [id], onDelete: Cascade)

  @@map("pair_availabilities")
}
```

### 2.2 Nuevos Enums

```prisma
enum SlotStatus {
  AVAILABLE
  ASSIGNED    // Partido asignado
  RESERVED    // Reservado para eliminatorias
  BLOCKED     // Bloqueado manualmente
}

enum TournamentPhase {
  GROUP_STAGE
  PRELIMINARY_ROUND  // Ronda previa
  ROUND_OF_32
  ROUND_OF_16
  QUARTERFINAL
  SEMIFINAL
  FINAL
}
```

### 2.3 Campos Nuevos en Modelos Existentes

**TournamentStatus** — actualizar enum existente:
```prisma
enum TournamentStatus {
  DRAFT
  OPEN            // Inscripción abierta
  CLOSED          // Inscripción cerrada (NUEVO)
  GENERATED       // Cuadro generado (NUEVO)
  IN_PROGRESS
  ELIMINATIONS    // Fase eliminatoria (NUEVO)
  COMPLETED
  CANCELLED
}
```

**En Tournament** — agregar campos:
```prisma
matchDurationMinutes  Int      @default(70)
minPairsPerModality   Int      @default(6)

// Nueva relación:
courts    Court[]
```

**En TournamentModality** — agregar campos:
```prisma
rankingMin   Int?
rankingMax   Int?
maxPairs     Int?
minPairs     Int?     // Override del mínimo del torneo

// Nueva relación:
groups  TournamentGroup[]
```

**En Match** — agregar campos:
```prisma
phase       TournamentPhase?
groupId     String?          // Si es partido de grupo
slotId      String?  @unique // Relación con MatchSlot

// Nuevas relaciones:
group  TournamentGroup? @relation(fields: [groupId], references: [id], onDelete: SetNull)
slot   MatchSlot?       @relation(fields: [slotId], references: [id], onDelete: SetNull)
```

**En TournamentRegistration** — agregar campos:
```prisma
rankingScore  Int?  // Ranking de la pareja al momento de inscripción

// Nuevas relaciones:
groupPlacements  GroupPlacement[]
availabilities   PairAvailability[]
```

---

## 3. API Routes (App Router)

Todas las rutas van dentro de `app/api/tournaments/`. Usar Route Handlers de Next.js con validación de sesión Supabase.

### 3.1 Canchas y Slots

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/tournaments/[id]/courts` | Crear cancha |
| GET | `/api/tournaments/[id]/courts` | Listar canchas del torneo |
| PUT | `/api/tournaments/[id]/courts/[courtId]` | Editar cancha |
| DELETE | `/api/tournaments/[id]/courts/[courtId]` | Eliminar cancha |
| POST | `/api/tournaments/[id]/courts/[courtId]/availability` | Configurar horarios |
| POST | `/api/tournaments/[id]/slots/generate` | Generar todos los slots |
| GET | `/api/tournaments/[id]/slots` | Listar slots (filtros) |
| PATCH | `/api/tournaments/[id]/slots/[slotId]` | Bloquear/desbloquear slot |

### 3.2 Disponibilidad de Parejas

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/tournaments/[id]/registrations/[regId]/availability` | Guardar disponibilidad |
| GET | `/api/tournaments/[id]/registrations/[regId]/availability` | Consultar disponibilidad |

### 3.3 Grupos

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/tournaments/[id]/modalities/[modId]/groups/generate` | Generar grupos automático |
| GET | `/api/tournaments/[id]/modalities/[modId]/groups` | Listar grupos con parejas |
| PATCH | `/api/tournaments/[id]/modalities/[modId]/groups/swap` | Mover pareja entre grupos |
| DELETE | `/api/tournaments/[id]/modalities/[modId]/groups` | Eliminar grupos (regenerar) |

### 3.4 Calendarización

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/tournaments/[id]/schedule/generate` | Generar calendario completo |
| GET | `/api/tournaments/[id]/schedule` | Ver calendario (filtros) |
| PATCH | `/api/tournaments/[id]/matches/[matchId]/reschedule` | Mover partido a otro slot |
| POST | `/api/tournaments/[id]/matches/[matchId]/swap` | Intercambiar 2 partidos |

### 3.5 Eliminatorias

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/tournaments/[id]/modalities/[modId]/bracket/generate` | Generar cuadro eliminatorio |
| GET | `/api/tournaments/[id]/modalities/[modId]/bracket` | Ver cuadro/llaves |
| PATCH | `/api/tournaments/[id]/modalities/[modId]/bracket/swap` | Reordenar llaves |

### 3.6 Resultados

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/tournaments/[id]/matches/[matchId]/result` | Registrar resultado |
| GET | `/api/tournaments/[id]/modalities/[modId]/standings` | Tabla de posiciones grupo |

---

## 4. Pantallas y Componentes

### 4.1 Estructura de Páginas

```
app/
  dashboard/
    club/
      tournaments/
        [id]/
          setup/           → Wizard de configuración
            courts/        → Paso: Canchas y horarios
            categories/    → Paso: Categorías/modalidades
            review/        → Paso: Revisión y publicar
          registrations/   → Gestionar inscripciones
          groups/          → Ver/editar grupos generados
            [modalityId]/  → Grupos de una modalidad
          schedule/        → Calendario visual
          bracket/         → Cuadro eliminatorio
            [modalityId]/  → Llaves de una modalidad
          live/            → Resultados en vivo
```

### 4.2 Componentes Clave

| Componente | Descripción |
|-----------|-------------|
| `CourtConfigurator` | Formulario para agregar canchas, definir horarios por día. Usa shadcn Dialog + Form. |
| `AvailabilityGrid` | Grid visual de días/horas para marcar disponibilidad. Click/drag para seleccionar bloques. |
| `GroupsGenerator` | Botón de generar + vista de grupos en cards/columnas. Drag & drop para mover parejas. |
| `ScheduleCalendar` | Vista de calendario semanal: canchas como columnas, horarios como filas. Cada celda = slot. |
| `MatchSlotCard` | Card dentro del calendar que muestra partido asignado. Draggable para reasignar. |
| `BracketView` | Visualización del cuadro eliminatorio tipo llaves. SVG o react-brackets. |
| `GroupStandings` | Tabla de posiciones: PJ, PG, PP, SF, SC, GF, GC, Pts. |
| `MatchResultForm` | Dialog para capturar resultado: sets (6-3, 4-6, 7-5), ganador automático. |

---

## 5. Lógica de Negocio (`lib/tournament/`)

### 5.1 Estructura de Archivos

```
lib/
  tournament/
    generate-groups.ts      → Algoritmo de grupos + cabezas de serie
    generate-slots.ts       → Generar slots de cancha
    schedule-matches.ts     → Asignar partidos a slots
    generate-bracket.ts     → Cuadro eliminatorio + ronda previa
    standings.ts            → Calcular tabla de posiciones
    clash-detector.ts       → Detectar empalmes de jugadores
    state-machine.ts        → Transiciones de estado del torneo
    validators.ts           → Validaciones de negocio
    types.ts                → Tipos/interfaces compartidos
```

### 5.2 generate-groups.ts — Pseudocódigo

```typescript
function generateGroups(modalityId: string) {
  // 1. Obtener parejas inscritas ordenadas por rankingScore DESC
  const pairs = await getPairsWithRanking(modalityId);
  const N = pairs.length;

  // 2. Calcular grupos (priorizar de 3)
  let groups3, groups4;
  if (N % 3 === 0) { groups3 = N / 3; groups4 = 0; }
  else if (N % 3 === 1) { groups3 = (N - 4) / 3; groups4 = 1; }
  else { groups3 = (N - 4) / 3; groups4 = 1; } // N%3===2
  const totalGroups = groups3 + groups4;

  // 3. Cabezas de serie (1 por grupo, las mejores rankeadas)
  const seeds = pairs.slice(0, totalGroups);
  const rest = pairs.slice(totalGroups);

  // 4. Crear grupos y asignar cabeza de serie
  const groupList = Array.from({length: totalGroups}, (_, i) => ({
    name: String.fromCharCode(65 + i), // A, B, C...
    size: i < groups3 ? 3 : 4,
    pairs: [seeds[i]]
  }));

  // 5. Serpentina para el resto de parejas
  let direction = 1;
  let groupIdx = 0;
  for (const pair of rest) {
    while (groupList[groupIdx].pairs.length >= groupList[groupIdx].size) {
      groupIdx += direction;
    }
    groupList[groupIdx].pairs.push(pair);
    groupIdx += direction;
    if (groupIdx >= totalGroups || groupIdx < 0) {
      direction *= -1;
      groupIdx += direction;
    }
  }

  // 6. Persistir en DB con transacción
  return await saveGroups(modalityId, groupList);
}
```

### 5.3 clash-detector.ts — Pseudocódigo

```typescript
function checkPlayerClash(tournamentId, playerId, proposedSlot) {
  // 1. Buscar TODAS las inscripciones del jugador en el torneo (como player1 O player2)
  const allRegs = await findAllRegistrations(tournamentId, playerId);

  // 2. Para cada inscripción, buscar partidos ya asignados a slots
  const assignedMatches = await findAssignedMatches(allRegs);

  // 3. Verificar colisión de tiempo
  for (const match of assignedMatches) {
    if (slotsOverlap(match.slot, proposedSlot)) {
      return { hasClash: true, reason: 'OVERLAP', conflicts: [match] };
    }
  }

  // 4. Verificar descanso mínimo (1 slot entre partidos)
  for (const match of assignedMatches) {
    if (slotsAdjacent(match.slot, proposedSlot)) {
      return { hasClash: true, reason: 'MIN_REST', conflicts: [match] };
    }
  }

  return { hasClash: false, conflicts: [] };
}

function checkMatchClash(tournamentId, match, proposedSlotId) {
  // Verificar los 4 jugadores del partido (2 parejas × 2 jugadores)
  const players = [match.teamA.player1Id, match.teamA.player2Id,
                    match.teamB.player1Id, match.teamB.player2Id];
  const conflicts = [];
  for (const playerId of players) {
    const result = await checkPlayerClash(tournamentId, playerId, proposedSlot);
    if (result.hasClash) conflicts.push(...result.conflicts);
  }
  return { hasClash: conflicts.length > 0, conflicts };
}
```

### 5.4 generate-bracket.ts — Pseudocódigo

```typescript
function generateBracket(modalityId: string) {
  // 1. Obtener standings de cada grupo
  const groups = await getGroupStandings(modalityId);

  // 2. Clasificar 2 primeros de cada grupo
  const qualified = groups.flatMap(g => [
    { ...g.standings[0], position: 'FIRST', groupName: g.name },
    { ...g.standings[1], position: 'SECOND', groupName: g.name }
  ]);
  const total = qualified.length;

  // 3. Potencia de 2 inferior más cercana
  const bracketSize = nearestPowerOf2Below(total); // 4, 8, 16, 32
  const prelimMatches = total - bracketSize;

  // 4. Cruces en espejo
  const firsts = qualified.filter(q => q.position === 'FIRST');
  const seconds = qualified.filter(q => q.position === 'SECOND').reverse();
  // Cruce: 1ro_A vs 2do_último, 1ro_B vs 2do_penúltimo, etc.

  // 5. Ronda previa si clasificadas no es potencia de 2
  if (prelimMatches > 0) {
    // Los peor rankeados (últimos 2dos) juegan previa
    // Los mejor posicionados reciben BYE
  }

  // 6. Generar partidos con phase y rondas
  return await saveBracket(modalityId, matches);
}
```

### 5.5 standings.ts — Criterios de Clasificación

1. **Puntos:** Victoria = 3, Derrota = 0
2. **Diferencia de sets** (setsWon - setsLost)
3. **Diferencia de games** (gamesWon - gamesLost)
4. **Resultado directo** entre parejas empatadas

### 5.6 state-machine.ts — Transiciones Válidas

```
DRAFT → OPEN (requiere: ≥1 cancha, ≥1 modalidad)
OPEN → CLOSED (fecha límite o acción manual)
CLOSED → GENERATED (grupos + calendario generados)
GENERATED → IN_PROGRESS (≥1 resultado registrado)
IN_PROGRESS → ELIMINATIONS (todos los grupos completados)
ELIMINATIONS → COMPLETED (final jugada)
Cualquier estado → CANCELLED
```

---

## 6. Reglas de Negocio Clave

### 6.1 Generación de Grupos
- Grupos de 3 prioritario. Solo de 4 si sobran parejas.
- N%3===0: N/3 grupos de 3
- N%3===1: (N-4)/3 de 3 + 1 de 4
- N%3===2: (N-4)/3 de 3 + 1 de 4
- 1 cabeza de serie por grupo (mejores rankeadas)
- Resto en serpentina para equilibrar

### 6.2 Partidos por Grupo
- Grupo de 3: 3 partidos (round-robin)
- Grupo de 4: 6 partidos (round-robin)
- Fórmula: n*(n-1)/2

### 6.3 Fase Eliminatoria
- Clasifican siempre las 2 primeras de cada grupo
- Cruces en espejo: 1ro A vs 2do último grupo
- Si clasificadas no es potencia de 2: ronda previa
- Ronda previa = clasificadas - potencia_2_inferior
- Los peor posicionados juegan previa, los mejores reciben BYE

### 6.4 Restricciones de Calendarización
**Duras (obligatorias):**
- R1: Sin empalme de cancha (1 partido por slot)
- R2: Sin empalme de jugador (multi-categoría)
- R3: Disponibilidad de ambas parejas
- R4: Descanso mínimo (1 slot entre partidos de la misma pareja)

**Blandas (optimización):**
- R5: Distribuir partidos del grupo en días diferentes
- R6: Dejar últimos días para eliminatorias
- R7: Equilibrio entre canchas

### 6.5 Tabla de Referencia: Parejas → Grupos → Partidos

| Parejas | Gpos de 3 | Gpos de 4 | Total grupos | Clasifican | Partidos grupos |
|---------|-----------|-----------|-------------|------------|-----------------|
| 6 | 2 | 0 | 2 | 4 | 6 |
| 7 | 1 | 1 | 2 | 4 | 9 |
| 8 | 0 | 2 | 2 | 4 | 12 |
| 9 | 3 | 0 | 3 | 6 | 9 |
| 10 | 2 | 1 | 3 | 6 | 12 |
| 12 | 4 | 0 | 4 | 8 | 12 |
| 14 | 2 | 2 | 4 | 8 | 18 |
| 15 | 5 | 0 | 5 | 10 | 15 |
| 16 | 4 | 1 | 5 | 10 | 18 |
| 18 | 6 | 0 | 6 | 12 | 18 |
| 20 | 4 | 2 | 6 | 12 | 24 |
| 22 | 6 | 1 | 7 | 14 | 24 |
| 24 | 8 | 0 | 8 | 16 | 24 |
| 25 | 7 | 1 | 8 | 16 | 27 |
| 28 | 8 | 1 | 9 | 18 | 30 |
| 30 | 10 | 0 | 10 | 20 | 30 |
| 31 | 9 | 1 | 10 | 20 | 33 |

### 6.6 Rondas Eliminatorias según Clasificadas

| Clasificadas | Ronda previa | Cuadro | Cuartos/8vos | Semis | Final |
|-------------|-------------|--------|-------------|-------|-------|
| 4 | 0 | 4 | 0 | 2 | 1 |
| 6 | 2 | 4 | 0 | 2 | 1 |
| 8 | 0 | 8 | 4 | 2 | 1 |
| 10 | 2 | 8 | 4 | 2 | 1 |
| 12 | 4 | 8 | 4 | 2 | 1 |
| 14 | 6 | 8 | 4 | 2 | 1 |
| 16 | 0 | 16 | 8 | 2 | 1 |
| 18 | 2 | 16 | 8 | 2 | 1 |
| 20 | 4 | 16 | 8 | 2 | 1 |

### 6.7 Fórmula Total de Partidos por Categoría

```
Total = partidos_grupos + partidos_ronda_previa + partidos_eliminatorias
Donde:
  partidos_grupos = (grupos_de_3 × 3) + (grupos_de_4 × 6)
  partidos_ronda_previa = clasificadas - potencia_2_inferior
  partidos_eliminatorias = potencia_2_inferior - 1
```

---

# PARTE 2: PROMPTS SECUENCIALES PARA CURSOR

> **IMPORTANTE:** Antes de empezar, copia este archivo a `docs/PRD-torneos.md` en tu proyecto. Ejecuta los prompts en orden. Cada uno construye sobre el anterior.

---

## Fase 1: Schema y Migración

### PROMPT 1A — Actualizar Prisma Schema

```
Lee el archivo @docs/PRD-torneos.md para contexto completo del proyecto. Enfócate en la sección "2. Cambios al Schema de Prisma".

Necesito que actualices el schema.prisma para soportar el sistema de torneos automatizados. El proyecto usa Next.js 14 App Router + Prisma + Supabase + shadcn/ui.

MODELOS NUEVOS a crear:
1. Court - canchas del torneo (id, tournamentId, name, venue, isIndoor)
2. CourtAvailability - horarios por cancha (courtId, dayOfWeek 0-6, startTime, endTime, specificDate?)
3. MatchSlot - slots generados (courtId, date, startTime, endTime, status: AVAILABLE/ASSIGNED/RESERVED/BLOCKED, matchId? unique)
4. TournamentGroup - grupos (tournamentModalityId, name A/B/C, groupSize 3 o 4, order)
5. GroupPlacement - pareja en grupo (groupId, registrationId, seed?, position?, matchesPlayed, matchesWon, matchesLost, setsWon, setsLost, gamesWon, gamesLost, points)
6. PairAvailability - disponibilidad de pareja (registrationId, dayOfWeek, startTime, endTime, available)

ENUMS NUEVOS:
- SlotStatus: AVAILABLE, ASSIGNED, RESERVED, BLOCKED
- TournamentPhase: GROUP_STAGE, PRELIMINARY_ROUND, ROUND_OF_32, ROUND_OF_16, QUARTERFINAL, SEMIFINAL, FINAL

MODIFICAR existentes:
- TournamentStatus: agregar CLOSED, GENERATED, ELIMINATIONS
- Tournament: agregar matchDurationMinutes (Int, default 70), minPairsPerModality (Int, default 6), relación courts Court[]
- TournamentModality: agregar rankingMin?, rankingMax?, maxPairs?, minPairs?, relación groups TournamentGroup[]
- Match: agregar phase (TournamentPhase?), groupId?, slotId? (unique), relaciones con TournamentGroup y MatchSlot
- TournamentRegistration: agregar rankingScore (Int?), relaciones groupPlacements GroupPlacement[] y availabilities PairAvailability[]

Mantén todos los @@map existentes. Los nuevos modelos usan snake_case en @@map. Agrega índices necesarios para queries frecuentes. NO borres nada existente.
```

### PROMPT 1B — Ejecutar migración

```
Ejecuta la migración de Prisma para aplicar los cambios del schema:

npx prisma migrate dev --name add_tournament_automation

Si hay errores, corrige el schema y vuelve a intentar. Después verifica que npx prisma generate funcione sin errores.
```

---

## Fase 2: Lógica de Negocio (lib/)

### PROMPT 2A — Generador de Grupos

```
Siguiendo @docs/PRD-torneos.md sección 5.2, crea el archivo lib/tournament/generate-groups.ts con la lógica de generación automática de grupos para una modalidad de torneo.

REGLAS DE NEGOCIO:
- Grupos de 3 parejas son prioritarios. Solo crear de 4 si sobran parejas.
- Si N%3===0: N/3 grupos de 3.
- Si N%3===1: (N-4)/3 grupos de 3 + 1 grupo de 4.
- Si N%3===2: (N-4)/3 grupos de 3 + 1 grupo de 4.
- Hay 1 cabeza de serie por grupo = la pareja con mejor rankingScore.
- Las parejas se ordenan por rankingScore DESC.
- Los cabezas de serie se asignan: #1 al grupo A, #2 al B, etc.
- El resto se distribuyen en serpentina (ida y vuelta) para equilibrar.
- La función debe ser transaccional: si falla algo, no se guarda nada.

Input: modalityId (string)
Output: TournamentGroup[] con GroupPlacement[] incluidos

Usa Prisma para queries y transacciones ($transaction). Consulta el pseudocódigo en el PRD. Incluye tipos TypeScript estrictos. Exporta generateGroups como named export.
```

### PROMPT 2B — Generador de Slots

```
Siguiendo @docs/PRD-torneos.md, crea lib/tournament/generate-slots.ts que genera todos los slots de tiempo disponibles para un torneo.

LÓGICA:
1. Recibe tournamentId.
2. Consulta las canchas (Court) del torneo y sus CourtAvailability.
3. Para cada día entre tournament.startDate y tournament.endDate:
   a. Para cada cancha disponible ese día (por dayOfWeek o specificDate):
      - Genera slots desde startTime hasta endTime, con duración = tournament.matchDurationMinutes.
      - Ejemplo: si cancha abre 16:30-22:00 y duración=70min, genera: 16:30-17:40, 17:40-18:50, 18:50-20:00, 20:00-21:10. El de 21:10-22:20 NO porque excede endTime.
4. Guarda todos los MatchSlot en DB con status AVAILABLE.
5. Devuelve conteo de slots generados por cancha y por día.

Usa transacción Prisma. Antes de generar, elimina slots existentes del torneo que estén en AVAILABLE (no tocar ASSIGNED ni RESERVED). Exporta generateSlots como named export.
```

### PROMPT 2C — Detector de Empalmes

```
Siguiendo @docs/PRD-torneos.md sección 5.3, crea lib/tournament/clash-detector.ts con la lógica para detectar empalmes de jugadores multi-categoría.

UN JUGADOR PUEDE ESTAR EN VARIAS CATEGORÍAS del mismo torneo. El detector debe:

1. Función checkPlayerClash(tournamentId, playerId, proposedSlotId):
   - Busca TODAS las inscripciones (TournamentRegistration) del jugador en el torneo (como player1 O player2), a través de las modalidades del torneo.
   - Para cada inscripción, busca partidos (Match) que ya tengan slot asignado (via MatchSlot).
   - Verifica si algún partido coincide en tiempo con el slot propuesto.
   - También verifica que haya al menos 1 slot de descanso entre partidos (slotsAdjacent).
   - Devuelve { hasClash: boolean, reason?: 'OVERLAP' | 'MIN_REST', conflicts: Match[] }

2. Función checkMatchClash(tournamentId, matchId, proposedSlotId):
   - Obtiene los 4 jugadores del partido (teamA.player1, teamA.player2, teamB.player1, teamB.player2).
   - Para cada jugador, ejecuta checkPlayerClash.
   - Devuelve { hasClash: boolean, conflicts: { playerId, playerName, conflictMatch }[] }

3. Funciones helper: slotsOverlap(slotA, slotB) y slotsAdjacent(slotA, slotB).

Exporta todo con tipos TypeScript estrictos.
```

### PROMPT 2D — Calendarización Automática

```
Siguiendo @docs/PRD-torneos.md, crea lib/tournament/schedule-matches.ts que asigna todos los partidos de fase de grupos a slots disponibles.

ALGORITMO:
1. Recibe tournamentId.
2. Para cada modalidad del torneo que tenga grupos generados:
   a. Genera los partidos del grupo (round-robin): grupo de 3 = 3 partidos, grupo de 4 = 6 partidos.
   b. Crea los Match en DB con phase=GROUP_STAGE, groupId, roundName="Fase de Grupos".
3. Obtiene todos los MatchSlot con status=AVAILABLE, ordenados cronológicamente.
4. Para cada partido sin slot:
   a. Busca el primer slot donde:
      - AMBAS parejas tengan disponibilidad (PairAvailability) para ese día/hora.
      - NO haya clash para ninguno de los 4 jugadores (usa checkMatchClash de clash-detector.ts).
      - El slot esté AVAILABLE.
   b. Si encuentra slot: asigna Match.slotId, actualiza MatchSlot.status=ASSIGNED, MatchSlot.matchId.
   c. Si no encuentra: marca el partido como sin slot y continúa.
5. Devuelve resumen: { totalMatches, scheduled, unscheduled, unscheduledMatches[] }.

RESTRICCIONES BLANDAS (intentar pero no bloquear):
- No poner 2 partidos del mismo grupo en el mismo slot de tiempo.
- Intentar que la misma pareja no juegue 2 partidos el mismo día.
- Dejar los últimos días del torneo con slots RESERVED para eliminatorias.

Usa transacción Prisma para la creación de partidos. La asignación a slots puede ser secuencial. Exporta scheduleGroupMatches como named export.
```

### PROMPT 2E — Tabla de Posiciones

```
Siguiendo @docs/PRD-torneos.md sección 5.5, crea lib/tournament/standings.ts para calcular posiciones dentro de un grupo.

CRITERIOS DE CLASIFICACIÓN (en este orden de prioridad):
1. Puntos: Victoria = 3, Derrota = 0
2. Diferencia de sets (setsWon - setsLost)
3. Diferencia de games (gamesWon - gamesLost)
4. Resultado directo entre parejas empatadas

Función calculateGroupStandings(groupId: string):
- Consulta todos los Match del grupo que tengan resultado (winner !== NONE).
- Para cada pareja en GroupPlacement, calcula a partir de los resultados: matchesPlayed, matchesWon, matchesLost, setsWon, setsLost, gamesWon, gamesLost, points.
- Los scores de Match vienen en formato JSON: [{ setA: 6, setB: 3 }, { setA: 4, setB: 6 }, { setA: 7, setB: 5 }]
- Ordena por los criterios de arriba.
- Actualiza los campos en GroupPlacement en la DB.
- Devuelve el array ordenado con posición asignada.

Función calculateModalityStandings(modalityId: string):
- Ejecuta calculateGroupStandings para cada grupo de la modalidad.
- Devuelve { groups: [{ groupName, standings: GroupPlacement[] }] }

Exporta ambas funciones. Tipos estrictos.
```

### PROMPT 2F — Generador de Cuadro Eliminatorio

```
Siguiendo @docs/PRD-torneos.md sección 5.4, crea lib/tournament/generate-bracket.ts para generar el cuadro eliminatorio.

LÓGICA:
1. Recibe modalityId. Obtiene grupos con standings ya calculados (usa calculateModalityStandings de standings.ts).
2. Clasifica las 2 primeras parejas de cada grupo: total = numGrupos × 2.

CRUCES EN ESPEJO:
- 1ros de grupo en orden: [A, B, C, D, E, F, G]
- 2dos de grupo invertidos: [G, F, E, D, C, B, A]
- Cruce: 1ro_A vs 2do_G, 1ro_B vs 2do_F, 1ro_C vs 2do_E, etc.

RONDA PREVIA (si clasificadas no es potencia de 2):
- bracketSize = potencia de 2 inferior más cercana (ej: 14 → 8, 18 → 16)
- prelimMatches = clasificadas - bracketSize
- Los 2dos lugares con peor ranking juegan ronda previa (prelimMatches partidos)
- Los 1ros lugares y los mejores 2dos reciben BYE directo

Genera los Match con:
- phase = PRELIMINARY_ROUND / ROUND_OF_16 / QUARTERFINAL / SEMIFINAL / FINAL
- roundName descriptivo ("Ronda Previa", "Octavos de Final", etc.)
- roundOrder (1=primera ronda jugada, 2=siguiente, etc.)
- matchOrder (orden dentro de la ronda)
- teamA y teamB con registrationId para la primera ronda
- Rondas futuras se crean con teamA/teamB null (se llenan cuando se conozca ganador)

Devuelve la estructura completa del bracket. Usa transacción Prisma.
```

---

## Fase 3: API Routes

### PROMPT 3A — APIs de Canchas y Slots

```
Siguiendo @docs/PRD-torneos.md sección 3.1-3.2, crea las API routes para gestión de canchas, horarios y slots. Usa Route Handlers de Next.js App Router.

Todas las rutas requieren autenticación Supabase y validar que el usuario sea dueño del club del torneo. Sigue el patrón de auth que ya existe en el proyecto.

Archivos a crear:
1. app/api/tournaments/[id]/courts/route.ts
   - GET: listar canchas del torneo con sus horarios (include availabilities)
   - POST: crear cancha (body: { name, venue, isIndoor })

2. app/api/tournaments/[id]/courts/[courtId]/route.ts
   - PUT: editar cancha
   - DELETE: eliminar cancha (cascade a availabilities y slots)

3. app/api/tournaments/[id]/courts/[courtId]/availability/route.ts
   - POST: configurar horarios (body: { availabilities: [{ dayOfWeek, startTime, endTime }] })
   - Reemplaza los horarios existentes de esa cancha

4. app/api/tournaments/[id]/slots/generate/route.ts
   - POST: llama a generateSlots de lib/tournament/generate-slots.ts
   - Devuelve conteo de slots generados

5. app/api/tournaments/[id]/slots/route.ts
   - GET: listar slots con query params: ?date=2026-02-16&courtId=xxx&status=AVAILABLE

6. app/api/tournaments/[id]/slots/[slotId]/route.ts
   - PATCH: body { status: 'BLOCKED' | 'AVAILABLE' } para bloquear/desbloquear manualmente

Usa Zod para validar inputs. Retorna JSON: { success: true, data } o { success: false, error: string }. Maneja errores con try/catch.
```

### PROMPT 3B — APIs de Grupos, Calendario, Bracket y Resultados

```
Siguiendo @docs/PRD-torneos.md secciones 3.3-3.6, crea las API routes para grupos, calendario, eliminatorias y resultados.

1. app/api/tournaments/[id]/modalities/[modId]/groups/generate/route.ts
   - POST: llama a generateGroups de lib/tournament/generate-groups.ts
   - Valida que la modalidad tenga suficientes parejas (>= minPairs)
   - Devuelve los grupos generados con parejas

2. app/api/tournaments/[id]/modalities/[modId]/groups/route.ts
   - GET: devuelve grupos con parejas (include placements → registration → player1, player2), rankings y seed

3. app/api/tournaments/[id]/modalities/[modId]/groups/swap/route.ts
   - PATCH: body { registrationId, fromGroupId, toGroupId }
   - Mueve pareja entre grupos. Valida que el grupo destino no exceda groupSize.

4. app/api/tournaments/[id]/schedule/generate/route.ts
   - POST: llama a scheduleGroupMatches de lib/tournament/schedule-matches.ts
   - Devuelve resumen de asignación

5. app/api/tournaments/[id]/schedule/route.ts
   - GET: devuelve partidos con slots asignados
   - Query params: ?date=X&courtId=X&modalityId=X
   - Include: slot → court, teamARegistration → player1/player2, teamBRegistration → player1/player2

6. app/api/tournaments/[id]/matches/[matchId]/reschedule/route.ts
   - PATCH: body { newSlotId }
   - Usa checkMatchClash de clash-detector para validar antes de mover
   - Libera el slot anterior (status=AVAILABLE), asigna el nuevo (status=ASSIGNED)

7. app/api/tournaments/[id]/modalities/[modId]/bracket/generate/route.ts
   - POST: llama a generateBracket de lib/tournament/generate-bracket.ts
   - Requiere que todos los partidos de grupo estén completados

8. app/api/tournaments/[id]/matches/[matchId]/result/route.ts
   - POST: body { scores: [{ setA: number, setB: number }], winner: 'TEAM_A' | 'TEAM_B' }
   - Registra resultado, actualiza Match
   - Si es partido de grupo: recalcula standings (calculateGroupStandings)
   - Si es partido eliminatorio: asigna ganador al siguiente Match del bracket

Misma estructura de auth, Zod, y manejo de errores que 3A.
```

---

## Fase 4: Interfaz de Usuario

### PROMPT 4A — Wizard de Configuración del Torneo

```
Siguiendo @docs/PRD-torneos.md sección 4, crea la pantalla de configuración del torneo. Usa shadcn/ui + Tailwind. Sigue la paleta existente del proyecto (verde y navy).

Es un wizard de 3 pasos con navegación lateral tipo Stepper:

PASO 1 — CANCHAS Y HORARIOS: app/dashboard/club/tournaments/[id]/setup/courts/page.tsx
- Formulario para agregar canchas: nombre, sede, indoor/outdoor
- Para cada cancha, configurar horarios por día de la semana: checkboxes de días (L-M-M-J-V-S-D) + inputs hora inicio/fin
- Mostrar lista de canchas ya creadas con opción editar/eliminar
- Usa shadcn: Card, Form, Input, Select, Checkbox, Button, Dialog para crear/editar
- Llama a POST/PUT/DELETE de /api/tournaments/[id]/courts

PASO 2 — CATEGORÍAS: app/dashboard/club/tournaments/[id]/setup/categories/page.tsx
- Listar las modalidades (TournamentModality) existentes del torneo
- Para cada una: editar rankingMin, rankingMax, minPairs, maxPairs con inputs
- Mostrar cuántas parejas inscritas tiene cada modalidad
- Badge verde si cumple mínimo, rojo si no
- Llama a PUT para actualizar cada modalidad

PASO 3 — REVISAR Y PUBLICAR: app/dashboard/club/tournaments/[id]/setup/review/page.tsx
- Resumen: X canchas configuradas, Y slots que se generarán, Z categorías activas
- Botón "Generar Slots" → POST /api/tournaments/[id]/slots/generate. Mostrar resultado.
- Botón "Cerrar Inscripción" → PATCH /api/tournaments/[id]/status { status: 'CLOSED' }
- Warnings si hay categorías que no cumplen mínimo de parejas
- Loading states con shadcn Skeleton

Crea también el layout con Stepper: app/dashboard/club/tournaments/[id]/setup/layout.tsx
Responsive. Todos los formularios con estados de loading, error y success.
```

### PROMPT 4B — Vista de Grupos con Drag & Drop

```
Siguiendo @docs/PRD-torneos.md, crea app/dashboard/club/tournaments/[id]/groups/[modalityId]/page.tsx

FUNCIONALIDAD:
1. Botón "Generar Grupos" que llama a POST .../groups/generate. Mostrar loading spinner.
2. Una vez generados, mostrar grupos en columnas (grid responsive). Cada grupo es un Card con:
   - Header: "Grupo A" + badge "(3 parejas)" o "(4 parejas)"
   - Lista de parejas: nombre completo de ambos jugadores, ranking score, estrella dorada si es cabeza de serie
   - Estadísticas si ya hay partidos jugados (PJ, PG, Pts)
3. Drag & drop para mover parejas entre grupos. Usa @dnd-kit/core y @dnd-kit/sortable.
   - Al soltar, llama a PATCH .../groups/swap
   - Valida que el grupo destino no exceda su tamaño (mostrar toast de error si falla)
   - Si no quieres drag&drop, alternativa: botón "Mover" que abre Dialog con select de grupo destino
4. Botón "Regenerar Grupos" con confirmación (Dialog) que elimina y vuelve a generar.
5. Una vez conformes, botón "Generar Calendario" → POST .../schedule/generate
   - Mostrar resultado: "X partidos asignados, Y sin asignar"

Usa shadcn: Card, Badge, Button, Dialog, Skeleton, Toast. Si instalas @dnd-kit, agrégalo con pnpm.
```

### PROMPT 4C — Calendario Visual de Partidos

```
Siguiendo @docs/PRD-torneos.md, crea app/dashboard/club/tournaments/[id]/schedule/page.tsx

DISEÑO: Vista tipo calendario/grid semanal.
- Eje X (columnas): una columna por cancha (Marietta 1, Marietta 2, Catalá 1...)
- Eje Y (filas): horarios del día (16:30, 17:40, 18:50...)
- Navegación: flechas para cambiar de día. Selector de fecha.
- Cada celda (slot):
  - Si tiene partido: Card con "Pareja1 vs Pareja2", badge de categoría, color por categoría/modalidad
  - Si está disponible: celda vacía con borde punteado
  - Si está bloqueado: celda gris con ícono de candado
- Click en partido → Dialog con: detalle del partido, botón "Reasignar" (mover a otro slot), botón "Registrar Resultado"
- Click en slot vacío → Dialog que muestra partidos sin asignar, click para asignar uno aquí

SIDEBAR:
- Lista de partidos "Sin Asignar" agrupados por categoría
- Contadores: Total partidos, Asignados, Sin asignar
- Filtro por categoría/modalidad

Stats en header: total partidos, asignados, sin asignar, porcentaje.

Usa shadcn: Card, Badge, Dialog, Select, Button. Grid custom con CSS Grid de Tailwind. Colores distintos por categoría.
Datos: GET /api/tournaments/[id]/schedule y GET /api/tournaments/[id]/slots
```

### PROMPT 4D — Cuadro Eliminatorio (Bracket)

```
Siguiendo @docs/PRD-torneos.md, crea app/dashboard/club/tournaments/[id]/bracket/[modalityId]/page.tsx

Visualización de llaves tipo torneo eliminatorio (bracket tree):
- Rondas de izquierda a derecha: Ronda Previa → 16vos → 8vos → Cuartos → Semis → Final
- Cada nodo/partido muestra:
  - Las 2 parejas (nombres) o "Por definir" si aún no se sabe
  - Score si ya se jugó (ej: "6-3, 4-6, 7-5")
  - Ganador resaltado con fondo verde/bold
- Líneas conectoras entre rondas (el ganador avanza a la siguiente)
- Click en un partido abre MatchResultForm (Dialog):
  - Inputs para cada set: Score Pareja A / Score Pareja B
  - Botón "+" para agregar set (mín 2, máx 3)
  - Calcula ganador automáticamente (quien gane 2 de 3 sets)
  - Al confirmar → POST .../matches/[matchId]/result
  - Al registrar resultado, el ganador aparece automáticamente en el siguiente partido

Botón "Generar Cuadro" si aún no se ha generado → POST .../bracket/generate
Solo habilitado si todos los partidos de grupo de esa modalidad están completados.

Para el bracket visual: crear componentes custom con CSS grid. Cada ronda es una columna. Los partidos se conectan con bordes CSS (border-right + border-top/bottom). No usar librerías externas a menos que ya estén instaladas.

Responsive: en móvil, mostrar como lista colapsable por ronda (Accordion de shadcn).
```

### PROMPT 4E — Disponibilidad de Parejas (Vista del Jugador)

```
Crea la vista para que las parejas/jugadores indiquen su disponibilidad horaria para el torneo.

app/dashboard/player/tournaments/[id]/availability/page.tsx

DISEÑO:
- Header con nombre del torneo y categoría inscrita
- Si el jugador está en múltiples categorías, mostrar tabs o selector
- Grid interactivo:
  - Columnas: días del torneo (Lun 16-Feb, Mar 17-Feb, Mié 18-Feb...)
  - Filas: horarios posibles basados en los slots del torneo (16:30, 17:40, 18:50...)
  - Cada celda es un toggle: verde = disponible, gris = no disponible
  - Click para togglear. También soportar click + drag para seleccionar rangos
  - Por defecto todo en verde (disponible). El jugador desmarca lo que NO puede.
- Botón "Guardar" → POST /api/tournaments/[id]/registrations/[regId]/availability
- Indicador de progreso: "Has marcado tu disponibilidad para 2 de 3 categorías"
- Nota: la disponibilidad es POR REGISTRO (pareja+categoría), pero si ambos jugadores de la pareja marcan, se usa la intersección

Datos necesarios: GET /api/tournaments/[id]/slots (para saber qué días/horas existen)
Usa shadcn: Card, Button, Toggle, Tabs si multi-categoría. Grid custom con Tailwind.
```

---

## Fase 5: Integración y Flujo Completo

### PROMPT 5A — Estado del Torneo y Navegación

```
Actualiza la página principal del torneo en el dashboard del club para mostrar el flujo completo del torneo.

Edita o crea: app/dashboard/club/tournaments/[id]/page.tsx (y/o layout.tsx)

Debe mostrar un stepper/timeline horizontal del estado del torneo:
1. DRAFT → "Configurar" (link a setup/)
2. OPEN → "Inscripciones" (link a registrations/)
3. CLOSED → "Generar Grupos" (link a groups/)
4. GENERATED → "Calendario" (link a schedule/)
5. IN_PROGRESS → "En Juego" (registrar resultados)
6. ELIMINATIONS → "Eliminatorias" (link a bracket/)
7. COMPLETED → "Finalizado"

Cada paso tiene:
- Ícono (usa Lucide icons)
- Estado: completado (check verde), activo (resaltado), pendiente (gris)
- Se habilita solo cuando el anterior está completo

Dashboard cards con métricas:
- Parejas inscritas (total y por categoría)
- Canchas configuradas
- Partidos generados / jugados / pendientes
- Categorías activas

Sidebar de navegación (o tabs) con links a todas las secciones.

Usa shadcn: Card, Badge, Button, Tabs o navigation. Lucide icons. El estado actual del torneo determina qué secciones están activas.
```

### PROMPT 5B — Máquina de Estados del Torneo

```
Crea lib/tournament/state-machine.ts que maneja las transiciones de estado del torneo.

TRANSICIONES VÁLIDAS:
- DRAFT → OPEN (requiere: ≥1 cancha configurada, ≥1 modalidad creada)
- OPEN → CLOSED (requiere: fecha límite cumplida O acción manual del admin)
- CLOSED → GENERATED (requiere: grupos generados para todas las modalidades activas + calendario generado)
- GENERATED → IN_PROGRESS (requiere: ≥1 partido con resultado registrado)
- IN_PROGRESS → ELIMINATIONS (requiere: todos los partidos de grupos completados para ≥1 modalidad)
- ELIMINATIONS → COMPLETED (requiere: todas las finales jugadas)
- Cualquier estado → CANCELLED (siempre permitido)

Función validateTransition(tournamentId: string, targetStatus: TournamentStatus):
- Verifica que la transición sea válida desde el estado actual
- Verifica los requisitos del estado objetivo consultando la DB
- Devuelve { valid: boolean, errors: string[] }

Función transitionTournament(tournamentId: string, targetStatus: TournamentStatus):
- Llama a validateTransition
- Si es válido, actualiza Tournament.status
- Devuelve { success: boolean, errors: string[], tournament }

Crea también: app/api/tournaments/[id]/status/route.ts
- PATCH: body { status: TournamentStatus }
- Llama a transitionTournament
- Devuelve resultado con errores si los hay
```

---

## Resumen de Ejecución

| Fase | Prompt | Qué construye | Depende de |
|------|--------|---------------|------------|
| 1 | 1A + 1B | Schema Prisma + migración | Nada |
| 2 | 2A | Generador de grupos | Fase 1 |
| 2 | 2B | Generador de slots | Fase 1 |
| 2 | 2C | Detector de empalmes | Fase 1 |
| 2 | 2D | Calendarización | 2A + 2B + 2C |
| 2 | 2E | Tabla de posiciones | Fase 1 |
| 2 | 2F | Cuadro eliminatorio | 2E |
| 3 | 3A | APIs canchas/slots | Fase 2 |
| 3 | 3B | APIs grupos/calendario/bracket | Fase 2 |
| 4 | 4A | UI Wizard configuración | Fase 3 |
| 4 | 4B | UI Grupos | Fase 3 |
| 4 | 4C | UI Calendario | Fase 3 |
| 4 | 4D | UI Bracket eliminatorio | Fase 3 |
| 4 | 4E | UI Disponibilidad parejas | Fase 3 |
| 5 | 5A + 5B | Integración y estados | Fase 4 |

> **Tip:** Antes de cada prompt, asegúrate de que Cursor tenga en su contexto: el schema.prisma actualizado, la carpeta lib/tournament/ (después de Fase 2), y este archivo PRD. Usa @file en Cursor para añadir archivos al contexto.
