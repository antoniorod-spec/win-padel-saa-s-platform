# Prompt Inicial para Cursor

Copia y pega este prompt en Cursor ANTES de empezar cualquier fase.
Asegúrate de haber copiado los archivos .md a tu carpeta docs/ primero.

---

## PROMPT:

```
Lee estos dos archivos de documentación del proyecto:
- @docs/Logica-torneos.md (reglas de negocio completas del sistema de torneos)
- @docs/PRD-torneos.md (PRD técnico con schema, APIs, componentes y prompts)

También revisa el schema actual: @prisma/schema.prisma

Este es un proyecto Next.js 14 (App Router) + Prisma + Supabase + shadcn/ui + Tailwind que ya tiene implementado: autenticación, registro de clubes, modelo de torneos con modalidades, registro de parejas, sistema de ranking, y modelo de Match.

Vamos a construir el módulo de TORNEOS AUTOMATIZADOS que agrega: configuración de canchas/horarios, generación automática de grupos con cabezas de serie, calendarización de partidos con control de empalmes multi-categoría, y cuadro eliminatorio con cruces en espejo.

Antes de generar cualquier código:
1. Confirma que entiendes la arquitectura general
2. Identifica qué modelos del schema actual se van a modificar vs cuáles son nuevos
3. Señala si ves algún conflicto potencial con el código existente
4. Dime si tienes alguna duda sobre las reglas de negocio

No generes código todavía. Solo confirma tu entendimiento.
```
