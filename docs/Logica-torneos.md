# Lógica del Sistema de Torneos Automatizado
## Ranking Padel MX — Documento de Reglas de Negocio

---

## 1. Visión General

Este documento define la lógica completa para la creación automática de torneos de pádel por parejas. El sistema permite que cualquier club configure un torneo, inscriba parejas y genere automáticamente:

- Fase de grupos (con cabezas de serie basados en ranking)
- Fase eliminatoria (con cruces en espejo)
- Calendarización completa de partidos en las canchas disponibles
- Control de empalmes de jugadores que participan en múltiples categorías

### Flujo General del Torneo (7 pasos)

1. **Configuración del Torneo** — El club define fechas, precio, categorías, canchas, horarios y duración de partidos.
2. **Inscripción de Parejas** — Las parejas se inscriben por categoría. El sistema obtiene su ranking automáticamente. Las parejas indican su disponibilidad horaria.
3. **Cierre de Inscripción** — Se valida que cada categoría cumpla el mínimo de parejas. Categorías que no lo cumplan se cancelan.
4. **Generación de Grupos** — El algoritmo arma grupos de 3 (prioritario) o 4 parejas, distribuyendo cabezas de serie.
5. **Calendarización** — Se asignan partidos a slots de cancha, respetando disponibilidad y evitando empalmes.
6. **Generación del Cuadro Eliminatorio** — Califican las 2 primeras de cada grupo. Cruces en espejo. Ronda previa si es necesario.
7. **Eliminatorias y Finales** — Se reservan slots para cada ronda eliminatoria hasta la final.

---

## 2. Configuración del Torneo

### 2.1 Datos Generales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre del torneo | Texto | Ej: "5to Aniversario Marietta" |
| Fecha de inicio | Fecha | Primer día disponible para partidos |
| Fecha de fin | Fecha | Último día (finales) |
| Fecha límite inscripción | Fecha | Después de esta fecha no se aceptan parejas |
| Precio por pareja | Número | Costo de inscripción por categoría |
| Duración de partido | Minutos | Tiempo que el club asigna por partido (ej: 70, 80 min) |
| Mínimo de parejas | Número | Mínimo global (override por categoría) |

### 2.2 Categorías (Modalidades)

Cada categoría/modalidad tiene: nombre (ej: "2da Varonil"), género (Varonil/Femenil/Mixto), rango de ranking permitido (mín-máx), mínimo de parejas (si no se alcanza, no se juega), y máximo de parejas (opcional).

### 2.3 Canchas y Horarios

El club registra las sedes y canchas disponibles. Cada cancha tiene sus horarios disponibles por día de la semana. Ejemplo del torneo analizado: 5 canchas (Marietta 1, 2, 3 y Catalá 1, 2), horarios de 16:30 a 21:30 entre semana y de 8:00 a 18:20 fines de semana.

---

## 3. Inscripción de Parejas

### 3.1 Proceso

Al inscribirse, el sistema:
1. Valida que ambos jugadores existan en el sistema de Ranking.
2. Obtiene automáticamente el ranking individual de cada jugador.
3. Calcula el ranking de la pareja (suma o promedio).
4. Valida que el ranking esté dentro del rango permitido para esa categoría.
5. Captura la disponibilidad horaria de la pareja.
6. Registra si alguno de los jugadores está inscrito en otra categoría (para evitar empalmes).

### 3.2 Jugadores en Múltiples Categorías

**REGLA CRÍTICA:** Si un jugador está en más de una categoría (ej: 2da Varonil y Mixtos B), el sistema DEBE garantizar que nunca tenga dos partidos al mismo tiempo. Esto afecta directamente al algoritmo de calendarización.

El sistema mantiene un índice de jugadores multi-categoría que se consulta al asignar cada partido.

---

## 4. Algoritmo de Generación de Grupos

### 4.1 Determinar Número y Tamaño de Grupos

**Regla:** Priorizar grupos de 3 parejas. Solo crear de 4 cuando sobran parejas.

**Algoritmo:**
- Si N es divisible entre 3: N/3 grupos de 3
- Si N % 3 == 1: (N-4)/3 grupos de 3 + 1 grupo de 4
- Si N % 3 == 2: (N-8)/3 grupos de 3 + 2 grupos de 4

**Tabla de referencia:**

| Parejas | Grupos de 3 | Grupos de 4 | Total grupos | Clasifican | Partidos grupos |
|---------|-------------|-------------|-------------|------------|-----------------|
| 6 | 2 | 0 | 2 | 4 | 6 |
| 7 | 1 | 1 | 2 | 4 | 9 |
| 8 | 0 | 2 | 2 | 4 | 12 |
| 9 | 3 | 0 | 3 | 6 | 9 |
| 10 | 2 | 1 | 3 | 6 | 12 |
| 11 | 1 | 2 | 3 | 6 | 15 |
| 12 | 4 | 0 | 4 | 8 | 12 |
| 13 | 3 | 1 | 4 | 8 | 15 |
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

**Partidos por grupo:** Grupo de 3 = 3 partidos. Grupo de 4 = 6 partidos. Fórmula: n*(n-1)/2.

### 4.2 Distribución de Cabezas de Serie

Hay exactamente 1 cabeza de serie por grupo (tantos cabezas de serie como grupos haya).

**Algoritmo:**
1. Ordenar todas las parejas inscritas por ranking de mayor a menor.
2. Las primeras G parejas (G = número de grupos) son cabezas de serie.
3. Asignar: pareja #1 al Grupo A, #2 al B, #3 al C, etc.
4. Las parejas restantes se distribuyen en **serpentina** para equilibrar la dificultad.
5. El admin del club puede editar manualmente después.

**Ejemplo con 10 parejas y 3 grupos (2 de 3 + 1 de 4):**
- Parejas por ranking: P1, P2, P3, P4, P5, P6, P7, P8, P9, P10
- Cabezas de serie: P1 → Grupo A, P2 → Grupo B, P3 → Grupo C
- Serpentina ronda 2: P4 → C, P5 → B, P6 → A
- Serpentina ronda 3: P7 → A, P8 → B, P9 → C
- Sobrante: P10 → C (se convierte en grupo de 4)
- **Resultado:** Grupo A [P1, P6, P7], Grupo B [P2, P5, P8], Grupo C [P3, P4, P9, P10]

---

## 5. Calendarización de Fase de Grupos

### 5.1 Generación de Slots

Antes de asignar partidos, el sistema genera todos los slots disponibles. Un slot = fecha + hora inicio + cancha. La hora fin = hora inicio + duración de partido.

**Algoritmo:**
1. Para cada día del torneo (fecha inicio a fecha fin)
2. Para cada cancha disponible ese día
3. Generar slots desde hora_inicio hasta hora_fin, separados por la duración
4. Cada slot tiene estado: AVAILABLE, ASSIGNED, RESERVED, BLOCKED

### 5.2 Asignación de Partidos

**Restricciones duras (obligatorias):**
- **R1 — Sin empalme de cancha:** Cada slot solo puede tener un partido.
- **R2 — Sin empalme de jugador:** Si un jugador está en múltiples categorías, no puede tener dos partidos simultáneos.
- **R3 — Disponibilidad de pareja:** Solo asignar a slots donde AMBAS parejas tengan disponibilidad.
- **R4 — Descanso mínimo:** Una pareja no puede jugar dos partidos consecutivos sin al menos un slot de descanso.

**Restricciones blandas (optimización):**
- **R5:** Distribuir partidos de un grupo en días diferentes.
- **R6:** Dejar últimos días para eliminatorias.
- **R7:** Equilibrar partidos entre canchas.

---

## 6. Fase Eliminatoria

### 6.1 Clasificación

De cada grupo clasifican siempre las 2 primeras parejas. Criterios de posición:
1. Puntos: Victoria = 3, Derrota = 0
2. Diferencia de sets
3. Diferencia de games
4. Resultado directo

### 6.2 Cruces en Espejo

El 1ro del Grupo A enfrenta al 2do del último grupo, el 1ro del B al 2do del penúltimo, etc.

- Lado superior: 1ro A vs 2do G, 1ro C vs 2do E, ...
- Lado inferior: 1ro B vs 2do F, 1ro D vs 2do D, ...

### 6.3 Ronda Previa

Cuando clasificadas no es potencia de 2:
1. Calcular clasificadas = G × 2
2. bracketSize = potencia de 2 inferior más cercana
3. prelimMatches = clasificadas - bracketSize
4. Los peor posicionados (2dos con peor ranking) juegan previa
5. Los mejor posicionados reciben BYE

**Tabla de rondas:**

| Clasificadas | Ronda previa | Cuadro | 8vos/4tos | Semis | Final |
|-------------|-------------|--------|-----------|-------|-------|
| 4 | 0 | 4 | 0 | 2 | 1 |
| 6 | 2 | 4 | 0 | 2 | 1 |
| 8 | 0 | 8 | 4 | 2 | 1 |
| 10 | 2 | 8 | 4 | 2 | 1 |
| 12 | 4 | 8 | 4 | 2 | 1 |
| 14 | 6 | 8 | 4 | 2 | 1 |
| 16 | 0 | 16 | 8 | 2 | 1 |
| 18 | 2 | 16 | 8 | 2 | 1 |
| 20 | 4 | 16 | 8 | 2 | 1 |

### 6.4 Ejemplo: 2da Varonil (22 parejas)

- **Grupos:** 6 de 3 + 1 de 4 = 7 grupos
- **Partidos de grupos:** 6×3 + 1×6 = 24 partidos
- **Clasifican:** 7×2 = 14 parejas
- **Potencia de 2 inferior:** 8
- **Ronda previa:** 14 - 8 = 6 partidos previos
- **Octavos:** 4 partidos
- **Cuartos:** 4 partidos
- **Semifinales:** 2 partidos
- **Final:** 1 partido
- **Total categoría:** 24 + 6 + 4 + 4 + 2 + 1 = 41 partidos

---

## 7. Fórmula Total de Partidos

```
Total = partidos_grupos + partidos_ronda_previa + partidos_eliminatorias

Donde:
  partidos_grupos = (grupos_de_3 × 3) + (grupos_de_4 × 6)
  partidos_ronda_previa = clasificadas - potencia_2_inferior
  partidos_eliminatorias = potencia_2_inferior - 1
```

Un cuadro de 8 tiene 7 eliminatorios (4+2+1). Un cuadro de 16 tiene 15 (8+4+2+1).

---

## 8. Edición Manual Post-Generación

La generación automática es el punto de partida. El admin siempre puede ajustar:

- **Grupos:** Mover parejas entre grupos, agregar/quitar parejas
- **Calendario:** Cambiar slot de un partido, intercambiar partidos, bloquear slots
- **Cuadro eliminatorio:** Reordenar llaves, ajustar cruces

---

## 9. Estados del Torneo

| Estado | Descripción | Acciones permitidas |
|--------|-------------|---------------------|
| DRAFT | Torneo creado, configurando | Editar todo, agregar categorías y canchas |
| OPEN | Inscripción abierta | Inscribir parejas, editar configuración |
| CLOSED | Inscripción cerrada | Validar mínimos, ajustar categorías |
| GENERATED | Grupos y calendario generados | Editar grupos, mover partidos |
| IN_PROGRESS | Torneo jugándose | Registrar resultados |
| ELIMINATIONS | Fase eliminatoria | Registrar resultados eliminatorias |
| COMPLETED | Torneo terminado | Consultar resultados, actualizar rankings |
| CANCELLED | Torneo cancelado | Solo lectura |
