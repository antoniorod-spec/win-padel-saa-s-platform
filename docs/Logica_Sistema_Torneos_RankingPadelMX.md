  
**RANKING PADEL MX**

**Sistema de Torneos Automatizado**

Documento de Lógica, Flujo y Reglas de Negocio

Versión 1.0  •  Febrero 2026

# **1\. Visión General del Sistema**

Este documento define la lógica completa para la creación automática de torneos de pádel por parejas dentro de la plataforma Ranking Padel MX. El sistema permite que cualquier club configure un torneo, inscriba parejas y genere automáticamente: fase de grupos (con cabezas de serie basados en ranking), fase eliminatoria (con cruces en espejo), y la calendarización completa de partidos en las canchas disponibles, evitando empalmes de jugadores que participan en múltiples categorías.

## **1.1 Flujo General del Torneo**

El proceso completo sigue estos 7 pasos macro:

| 1 | Configuración del Torneo El club define fechas, precio, categorías, número mínimo de parejas, canchas, horarios y duración de partidos. |
| :---: | :---- |

| 2 | Inscripción de Parejas Las parejas se inscriben por categoría. El sistema obtiene automáticamente su ranking del sistema Ranking Padel MX. Las parejas indican su disponibilidad horaria. |
| :---: | :---- |

| 3 | Cierre de Inscripción y Validación Se valida que cada categoría cumpla el mínimo de parejas. Categorías que no lo cumplan se cancelan o fusionan. |
| :---: | :---- |

| 4 | Generación de Grupos El algoritmo arma grupos de 3 (prioritario) o 4 parejas, distribuyendo cabezas de serie para equilibrar los grupos. |
| :---: | :---- |

| 5 | Calendarización de Fase de Grupos Se asignan partidos a slots de cancha disponibles, respetando la disponibilidad de cada pareja y evitando empalmes de jugadores en múltiples categorías. |
| :---: | :---- |

| 6 | Generación del Cuadro Eliminatorio Califican las 2 primeras parejas de cada grupo. Se arma el cuadro con cruces en espejo (1ro vs 2do). Si las clasificadas no son potencia de 2, se genera ronda previa. |
| :---: | :---- |

| 7 | Calendarización de Eliminatorias y Finales Se reservan slots para cada ronda eliminatoria, semifinales y final. |
| :---: | :---- |

# **2\. Configuración del Torneo (Onboarding del Club)**

Esta es la información que el club debe proporcionar al sistema para crear un torneo. El club puede tener múltiples usuarios administradores.

## **2.1 Datos Generales del Torneo**

| Campo | Tipo | Descripción |
| ----- | ----- | ----- |
| Nombre del torneo | Texto | Ej: 5to Aniversario Marietta |
| Fecha de inicio | Fecha | Primer día disponible para partidos |
| Fecha de fin | Fecha | Último día (finales) |
| Fecha límite inscripción | Fecha | Después de esta fecha no se aceptan parejas |
| Precio por pareja | Número | Costo de inscripción por categoría |
| Duración de partido | Minutos | Tiempo que el club asigna por partido (ej: 70, 80 min) |

## **2.2 Configuración de Categorías**

El club define las categorías que se jugarán. Cada categoría tiene:

| Campo | Tipo | Descripción |
| ----- | ----- | ----- |
| Nombre | Texto | Ej: 2da Varonil, 4ta Femenil, Mixtos B |
| Género | Selección | Varonil / Femenil / Mixto |
| Rango de ranking | Números | Rango mín-máx de puntos de ranking permitidos |
| Mínimo de parejas | Número | Definido por el club. Si no se alcanza, no se juega |
| Máximo de parejas | Número | Límite de inscripción (opcional) |

## **2.3 Configuración de Canchas y Horarios**

El club registra las sedes y canchas disponibles para el torneo. Cada cancha tiene sus propios horarios disponibles por día. Esto es lo que el sistema usa para generar los slots de partidos.

| Campo | Tipo | Descripción |
| ----- | ----- | ----- |
| Sede | Texto | Nombre del club/sede (ej: Marietta, Catalá) |
| Cancha | Texto | Identificador de cancha (ej: Marietta 1, Catalá 2\) |
| Días disponibles | Multi-selección | Días de la semana que la cancha está disponible |
| Hora inicio | Hora | Hora de apertura para partidos del torneo |
| Hora fin | Hora | Hora límite (último partido debe terminar antes) |

| Ejemplo del torneo analizado El torneo Aniversario Marietta usa 5 canchas: Marietta 1, 2, 3 y Catalá 1, 2\. Los horarios van de 16:30 a 21:30 entre semana y de 8:00 a 18:20 los fines de semana. La duración por partido es de aproximadamente 70-80 minutos. |
| :---- |

# **3\. Inscripción de Parejas**

## **3.1 Proceso de Inscripción**

Cada pareja se inscribe en una o más categorías. Al inscribirse, el sistema:

1. Valida que ambos jugadores existan en el sistema de Ranking Padel MX.

2. Obtiene automáticamente el ranking individual de cada jugador.

3. Calcula el ranking de la pareja (suma, promedio, o el método definido).

4. Valida que el ranking de la pareja esté dentro del rango permitido para esa categoría.

5. Captura la disponibilidad horaria de la pareja (días y horarios en los que pueden jugar).

6. Registra si alguno de los jugadores está inscrito en otra categoría del mismo torneo (para evitar empalmes).

## **3.2 Jugadores en Múltiples Categorías**

| Regla crítica de empalmes Si un jugador está inscrito en más de una categoría (ej: 2da Varonil y Mixtos B), el sistema DEBE garantizar que nunca tenga dos partidos al mismo tiempo. Esto afecta directamente al algoritmo de calendarización. |
| :---- |

El sistema debe mantener un índice de jugadores multi-categoría para consultarlo en la fase de calendarización. Cuando se asigne un partido, se verifica que ningún jugador de las parejas involucradas tenga otro partido en el mismo horario.

# **4\. Algoritmo de Generación de Grupos**

Este es el núcleo del sistema. Una vez cerrada la inscripción, el algoritmo arma los grupos automáticamente para cada categoría que cumpla el mínimo de parejas.

## **4.1 Determinar Número y Tamaño de Grupos**

La regla es: priorizar grupos de 3 parejas. Solo se crean grupos de 4 cuando sobran parejas que no completan otro grupo de 3\.

**Algoritmo de cálculo:**

1. Dado N \= número total de parejas inscritas en la categoría.

2. Si N es divisible entre 3: se crean N/3 grupos de 3\.

3. Si N % 3 \== 1: se crean (N-4)/3 grupos de 3 \+ 1 grupo de 4\. (Porque 1 pareja suelta no hace grupo, pero 4 sí).

4. Si N % 3 \== 2: se crean (N-4)/3 grupos de 3 \+ 1 grupo de 4\. O alternativamente (N-8)/3 grupos de 3 \+ 2 grupos de 4\. El sistema elige la configuración que minimice los grupos de 4\.

**Tabla de referencia rápida:**

| Parejas | Grupos de 3 | Grupos de 4 | Total grupos | Clasifican | Partidos grupos |
| ----- | ----- | ----- | ----- | ----- | ----- |
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

| Fórmula de partidos por grupo Grupo de 3 parejas: cada pareja juega contra las otras 2 \= 3 partidos por grupo. Grupo de 4 parejas: cada pareja juega contra las otras 3 \= 6 partidos por grupo. Fórmula general: n\*(n-1)/2 donde n \= parejas en el grupo. |
| :---- |

## **4.2 Distribución de Cabezas de Serie**

Los cabezas de serie son las parejas con mejor ranking dentro de la categoría. Hay exactamente 1 cabeza de serie por grupo (tantos cabezas de serie como grupos haya).

**Algoritmo de distribución:**

1. Ordenar todas las parejas inscritas por ranking de mayor a menor.

2. Las primeras G parejas (donde G \= número de grupos) son cabezas de serie.

3. Asignar la pareja \#1 del ranking al Grupo A, la \#2 al Grupo B, y así sucesivamente.

4. Las parejas restantes (no cabezas de serie) se distribuyen de forma aleatoria o en serpentina inversa para equilibrar la dificultad de cada grupo.

5. El administrador del club puede editar manualmente los grupos después de la generación automática (mover parejas entre grupos).

**Método serpentina para el resto de parejas:**

Después de colocar los cabezas de serie, las demás parejas (ordenadas por ranking) se distribuyen en serpentina: la siguiente tanda va del último grupo al primero, la siguiente del primero al último, etc. Esto equilibra la fuerza de los grupos.

| Ejemplo con 10 parejas y 3 grupos Parejas ordenadas por ranking: P1, P2, P3, P4, P5, P6, P7, P8, P9, P10. Cabezas de serie (3): P1 → Grupo A, P2 → Grupo B, P3 → Grupo C. Serpentina (ronda 2): P4 → Grupo C, P5 → Grupo B, P6 → Grupo A. Serpentina (ronda 3): P7 → Grupo A, P8 → Grupo B, P9 → Grupo C. Sobrante: P10 → Grupo C (que se convierte en grupo de 4). Resultado: Grupo A \[P1, P6, P7\] \= 3 parejas. Grupo B \[P2, P5, P8\] \= 3 parejas. Grupo C \[P3, P4, P9, P10\] \= 4 parejas. |
| :---- |

# **5\. Calendarización de Fase de Grupos**

## **5.1 Generación de Slots Disponibles**

Antes de asignar partidos, el sistema genera todos los slots disponibles de cancha. Un slot es una combinación de: fecha \+ hora inicio \+ cancha. La hora fin se calcula sumando la duración de partido definida por el club.

**Algoritmo:**

1. Para cada día del torneo (fecha inicio a fecha fin):

2. Para cada cancha disponible ese día:

3. Generar slots desde hora\_inicio hasta hora\_fin, separados por la duración del partido.

4. Cada slot tiene un estado: disponible, asignado, o reservado (para eliminatorias).

**Ejemplo de slots generados (5 canchas, 70 min por partido):**

| Slot | Día | Hora | Cancha | Estado |
| ----- | ----- | ----- | ----- | ----- |
| \#1 | Lun 16-Feb | 16:30 | Marietta 1 | Disponible |
| \#2 | Lun 16-Feb | 16:30 | Marietta 2 | Disponible |
| \#3 | Lun 16-Feb | 16:30 | Marietta 3 | Disponible |
| \#4 | Lun 16-Feb | 18:00 | Marietta 1 | Disponible |
| ... | ... | ... | ... | ... |

## **5.2 Algoritmo de Asignación de Partidos**

El sistema asigna cada partido de fase de grupos a un slot disponible siguiendo estas restricciones, en orden de prioridad:

**Restricciones duras (obligatorias):**

**R1 – Sin empalme de cancha:** Cada slot de cancha solo puede tener un partido asignado.

**R2 – Sin empalme de jugador:** Si un jugador participa en más de una categoría, no puede tener dos partidos en el mismo slot de tiempo (ni siquiera en canchas diferentes).

**R3 – Disponibilidad de pareja:** El partido solo se asigna a un slot donde AMBAS parejas hayan indicado disponibilidad.

**R4 – Descanso mínimo:** Una pareja no puede jugar dos partidos consecutivos sin al menos un slot de descanso entre ellos.

**Restricciones blandas (optimización):**

**R5 – Distribuir partidos:** Intentar que los partidos de un mismo grupo no se jueguen todos el mismo día.

**R6 – Prioridad temporal:** Asignar primero los partidos de fase de grupos, dejando los últimos días para eliminatorias.

**R7 – Equilibrio de canchas:** Distribuir partidos equitativamente entre todas las canchas disponibles.

# **6\. Fase Eliminatoria**

## **6.1 Clasificación de Parejas**

De cada grupo clasifican siempre las 2 primeras parejas. La posición en el grupo se determina por:

1. Puntos: Victoria \= 3 puntos, Empate \= 1 punto (si aplica por reglamento), Derrota \= 0\.

2. Desempate 1: Diferencia de sets (sets ganados \- sets perdidos).

3. Desempate 2: Diferencia de games (games ganados \- games perdidos).

4. Desempate 3: Resultado directo entre las parejas empatadas.

## **6.2 Construcción del Cuadro Eliminatorio**

El cuadro se construye con cruces en espejo: el 1ro del Grupo A enfrenta al 2do del último grupo, el 1ro del Grupo B al 2do del penúltimo grupo, y así sucesivamente.

**Algoritmo de cruces en espejo:**

Dado G grupos (A, B, C, ...), los cruces de primera ronda eliminatoria son:

**Lado superior del cuadro:** 1ro A vs 2do del Grupo G │ 1ro C vs 2do del Grupo (G-2) │ ...

**Lado inferior del cuadro:** 1ro B vs 2do del Grupo (G-1) │ 1ro D vs 2do del Grupo (G-3) │ ...

## **6.3 Ronda Previa (cuando clasificadas no son potencia de 2\)**

Cuando el número de parejas clasificadas (G × 2\) no es potencia de 2, se necesita una ronda previa para reducir el cuadro a la potencia de 2 inferior más cercana.

**Algoritmo de ronda previa:**

1. Calcular clasificadas \= G × 2\.

2. Encontrar la potencia de 2 inferior más cercana (cuadro\_objetivo). Ej: 14 clasificadas → cuadro de 8\.

3. Calcular partidos\_previos \= clasificadas \- cuadro\_objetivo. Ej: 14 \- 8 \= 6 partidos previos.

4. Las parejas que juegan ronda previa son las peor posicionadas (los 2dos lugares de grupo con peor ranking o los últimos en la tabla de cruces).

5. Las parejas mejor posicionadas reciben BYE directo a la siguiente ronda.

**Tabla de rondas eliminatorias según clasificadas:**

| Clasificadas | Ronda previa | Cuadro | 8vos/4tos | Semis | Final |
| ----- | ----- | ----- | ----- | ----- | ----- |
| 4 | 0 | 4 | 0 | 2 | 1 |
| 6 | 2 previos | 4 | 0 | 2 | 1 |
| 8 | 0 | 8 | 4 | 2 | 1 |
| 10 | 2 previos | 8 | 4 | 2 | 1 |
| 12 | 4 previos | 8 | 4 | 2 | 1 |
| 14 | 6 previos | 8 | 4 | 2 | 1 |
| 16 | 0 | 16 | 8 | 2 | 1 |
| 18 | 2 previos | 16 | 8 | 2 | 1 |
| 20 | 4 previos | 16 | 8 | 2 | 1 |

## **6.4 Ejemplo Completo: 2da Varonil (22 parejas)**

El torneo de ejemplo muestra cómo funciona con 22 parejas:

**Grupos:** 6 grupos de 3 \+ 1 grupo de 4 \= 7 grupos.

**Partidos de grupos:** 6 grupos × 3 partidos \+ 1 grupo × 6 partidos \= 24 partidos.

**Clasifican:** 7 × 2 \= 14 parejas.

**Potencia de 2 inferior:** 8\.

**Ronda previa:** 14 \- 8 \= 6 partidos previos (12 parejas juegan ronda previa, 2 pasan directo a 8vos).

**Octavos:** 4 partidos (8 parejas, incluyendo ganadoras de previas \+ byes).

**Cuartos:** 4 partidos.

**Semifinales:** 2 partidos.

**Final:** 1 partido.

**Total partidos categoría:** 24 (grupos) \+ 6 (previos) \+ 4 (8vos) \+ 4 (4tos) \+ 2 (semis) \+ 1 (final) \= 41 partidos.

# **7\. Fórmulas de Cálculo Total de Partidos**

## **7.1 Fórmula General por Categoría**

El total de partidos de una categoría se calcula como:

| Fórmula maestra Total \= partidos\_grupos \+ partidos\_ronda\_previa \+ partidos\_eliminatorias. Donde: partidos\_grupos \= (grupos\_de\_3 × 3\) \+ (grupos\_de\_4 × 6). partidos\_ronda\_previa \= (clasificadas \- potencia\_2\_inferior). partidos\_eliminatorias \= potencia\_2\_inferior \- 1 (desde cuartos/octavos hasta la final). Es decir, un cuadro de 8 tiene 7 partidos eliminatorios (4+2+1), un cuadro de 16 tiene 15 (8+4+2+1). |
| :---- |

## **7.2 Cálculo del Torneo Completo**

Para el torneo de ejemplo analizado (Aniversario Marietta), el cálculo total es:

| Categoría | Parejas | Grupos | Part. Gpos | Part. Elim | Total | Rondas elim. |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 1ra Varonil | 10 | 3 | 12 | 5 | 17 | 4tos+semi+fin |
| 2da Varonil | 22 | 7 | 24 | 17 | 41 | prev+8vos+4tos+semi+fin |
| 3ra Varonil | 28 | 9 | 30 | 17 | 47 | prev+8vos+4tos+semi+fin |
| 4ta Varonil | 25 | 8 | 27 | 15 | 42 | 8vos+4tos+semi+fin |
| 5ta Varonil | 31 | 10 | 33 | 19 | 52 | prev+8vos+4tos+semi+fin |
| 2da Fem | 7 | 2 | 9 | 3 | 12 | semi+fin |
| 4ta Fem | 10 | 3 | 12 | 5 | 17 | 4tos+semi+fin |
| 5ta Fem | 7 | 2 | 9 | 3 | 12 | semi+fin |
| Mixtos B | 12 | 4 | 12 | 7 | 19 | 4tos+semi+fin |
| Mixtos C | 14 | 4 | 18 | 7 | 25 | 4tos+semi+fin |

| Total torneo estimado Aproximadamente 280-300 partidos totales distribuidos en 5 canchas durante 2 semanas. Esto es lo que el sistema debe ser capaz de calendarizar automáticamente. |
| :---- |

# **8\. Edición Manual Post-Generación**

Un principio fundamental del sistema es que la generación automática es el punto de partida, pero el administrador del club siempre puede ajustar manualmente. Las operaciones editables incluyen:

## **8.1 Edición de Grupos**

**Mover pareja entre grupos:** El admin puede arrastrar una pareja de un grupo a otro. El sistema recalcula automáticamente los partidos del grupo afectado.

**Agregar/quitar pareja:** Si se agrega una pareja tardía o se retira una, el sistema recalcula el grupo completo.

## **8.2 Edición de Calendarización**

**Cambiar slot de un partido:** Mover un partido a otro horario/cancha. El sistema valida que no haya conflictos.

**Intercambiar partidos:** Swap de dos partidos entre sus slots. El sistema valida ambas asignaciones.

**Bloquear slots:** Marcar slots como no disponibles (ej: mantenimiento de cancha).

## **8.3 Edición de Cuadro Eliminatorio**

**Reordenar llaves:** Mover parejas clasificadas a diferentes posiciones del cuadro.

**Ajustar cruces:** Modificar qué parejas se enfrentan en primera ronda.

# **9\. Resumen Técnico para Desarrollo**

## **9.1 Entidades del Sistema**

| Entidad | Campos clave |
| ----- | ----- |
| Torneo | id, nombre, fecha\_inicio, fecha\_fin, fecha\_limite\_inscripcion, precio, duracion\_partido\_min, club\_id |
| Categoría | id, torneo\_id, nombre, genero, ranking\_min, ranking\_max, min\_parejas, max\_parejas |
| Cancha | id, sede\_nombre, nombre, horarios\_disponibles (por día) |
| Pareja | id, jugador1\_id, jugador2\_id, categoria\_id, ranking\_pareja, disponibilidad |
| Grupo | id, categoria\_id, nombre (A, B, C...), tipo (3 o 4 parejas) |
| Partido | id, grupo\_id o ronda\_eliminatoria, pareja1\_id, pareja2\_id, slot\_id, resultado |
| Slot | id, cancha\_id, fecha, hora\_inicio, hora\_fin, estado, partido\_id |
| Jugador | id, nombre, ranking, parejas\_inscritas\[\] (para control de empalmes) |

## **9.2 Flujo de Estados del Torneo**

| Estado | Descripción | Acciones permitidas |
| ----- | ----- | ----- |
| BORRADOR | Torneo creado, configurando | Editar todo, agregar categorías y canchas |
| INSCRIPCION | Abierto para parejas | Inscribir parejas, editar configuración |
| CERRADO | Inscripción cerrada | Validar mínimos, ajustar categorías |
| GENERADO | Grupos y calendar generados | Editar grupos, mover partidos |
| EN CURSO | Torneo jugandose | Registrar resultados, generar eliminatorias |
| ELIMINATORIAS | Fase de grupos terminada | Registrar resultados eliminatorias |
| FINALIZADO | Torneo terminado | Consultar resultados, actualizar rankings |

## **9.3 Consideraciones de Implementación**

**Transaccionalidad:** La generación de grupos y calendarización debe ser atómica. Si falla la asignación de algún partido, se revierte todo y se notifica al admin.

**Performance:** Para un torneo grande (\~300 partidos, 5 canchas, 2 semanas), el algoritmo de calendarización debe resolver en menos de 30 segundos.

**Actualización de ranking:** Al finalizar el torneo, los resultados se envían al sistema de Ranking Padel MX para actualizar las posiciones de todos los jugadores participantes.

**Notificaciones:** El sistema debe notificar a los jugadores cuando se publican los grupos, cuando se asigna un partido, y cuando se generan las eliminatorias.