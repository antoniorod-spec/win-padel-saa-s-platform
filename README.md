# WinPadel - Sistema de Torneos y Ranking de Pádel

Sistema completo para la gestión de torneos de pádel y ranking de jugadores en México.

## 🚀 Tecnologías

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM 7, PostgreSQL
- **Autenticación**: NextAuth.js v5 (Credentials + Google OAuth)
- **Base de datos**: Supabase (PostgreSQL)
- **Validación**: Zod
- **Deployment**: Vercel

## 📋 Características

### Para Jugadores
- Registro y perfil de jugador
- Ranking por modalidad (Varonil, Femenil, Mixto) y categoría
- Historial de partidos y estadísticas
- Inscripción a torneos en parejas
- Sistema de ascenso automático por logros

### Para Clubes
- Registro y gestión de clubes
- Creación y administración de torneos
- Generación automática de brackets
- Registro de resultados de partidos
- Gestión de pagos de inscripciones

### Para Administradores
- Dashboard de estadísticas generales
- Aprobación de clubes nuevos
- Revisión de cambios de categoría
- Recalculación de rankings
- Configuración de tablas de puntos

## 🛠️ Instalación Local

### Prerrequisitos

- Node.js 20.19.0 o superior
- npm o pnpm
- Cuenta de Supabase (para la base de datos PostgreSQL)

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/TU_USUARIO/win-padel-saa-s-platform.git
   cd win-padel-saa-s-platform
   ```

2. **Instalar dependencias**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   # Database - Supabase
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

   # NextAuth.js
   AUTH_SECRET="tu-secret-aleatorio-seguro"
   AUTH_URL="http://localhost:3000"

   # Google OAuth (opcional)
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   ```

   **Importante**: Reemplaza los valores de `DATABASE_URL` y `DIRECT_URL` con tus credenciales de Supabase.
   - Si tu contraseña tiene caracteres especiales (`$`, `&`, `@`, etc.), debes URL-encodearlos:
     - `$` → `%24`
     - `&` → `%26`
     - `@` → `%40`

4. **Generar el cliente de Prisma**
   ```bash
   npm run db:generate
   ```

5. **Crear las tablas en la base de datos**
   ```bash
   npm run db:push
   ```

6. **Poblar con datos de prueba**
   ```bash
   npm run db:seed
   ```

7. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 👥 Usuarios de Prueba (después del seed)

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@winpadel.com` | `admin123456` |
| Club | `info@advantagepadel.mx` | `club123456` |
| Club | `info@mariettapadel.mx` | `club123456` |
| Jugador | `carlos.m@example.com` | `player123456` |
| Jugador | `ana.r@example.com` | `player123456` |

## 📊 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo con Turbopack
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter de ESLint
- `npm run db:generate` - Genera el cliente de Prisma
- `npm run db:push` - Sincroniza el schema con la base de datos
- `npm run db:seed` - Puebla la base de datos con datos de prueba
- `npm run db:studio` - Abre Prisma Studio (interfaz visual de BD)

## 🏗️ Estructura del Proyecto

```
win-padel-saa-s-platform/
├── app/                      # Next.js App Router
│   ├── api/                 # API Routes
│   │   ├── auth/           # Autenticación (NextAuth)
│   │   ├── players/        # CRUD de jugadores
│   │   ├── clubs/          # CRUD de clubes
│   │   ├── tournaments/    # CRUD de torneos
│   │   ├── matches/        # Gestión de partidos
│   │   ├── rankings/       # Sistema de ranking
│   │   ├── admin/          # Endpoints de administración
│   │   └── payments/       # Gestión de pagos
│   ├── admin/              # Dashboard de admin
│   ├── club/               # Dashboard de club
│   ├── jugador/            # Dashboard de jugador
│   ├── ranking/            # Página de rankings
│   ├── torneos/            # Lista y detalle de torneos
│   ├── login/              # Página de login
│   └── registro/           # Página de registro
├── components/              # Componentes de React
│   ├── ui/                 # Componentes base (shadcn/ui)
│   └── landing/            # Componentes del landing
├── lib/                     # Librerías y utilidades
│   ├── api/                # Cliente API para el frontend
│   ├── services/           # Lógica de negocio
│   ├── validations/        # Schemas de Zod
│   ├── auth.ts             # Configuración de NextAuth
│   ├── prisma.ts           # Cliente de Prisma
│   └── types/              # Tipos de TypeScript
├── prisma/
│   ├── schema.prisma       # Schema de la base de datos
│   └── seed.ts             # Script de seed
└── prisma.config.ts        # Configuración de Prisma 7
```

## 🎮 Sistema de Ranking

### Categorías

- **Varonil/Femenil**: 1ra, 2da, 3ra, 4ta, 5ta, 6ta
- **Mixto**: A, B, C, D

### Tabla de Puntos por Torneo

| Categoría | Campeón | Subcampeón | Semifinal | Cuartos | Octavos |
|-----------|---------|------------|-----------|---------|---------|
| A         | 1000    | 700        | 500       | 300     | 175     |
| B         | 700     | 500        | 350       | 200     | 100     |
| C         | 400     | 275        | 175       | 100     | 20      |

### Reglas de Ascenso (Automático)

1. **Ganar un torneo** → Ascenso inmediato
2. **Llegar a la final en 2 torneos consecutivos** → Ascenso automático
3. **Semifinales en 3 de los últimos 5 torneos** → Revisión por comité

Al ascender, los puntos se resetean a 0 en la nueva categoría.

### Reglas de Descenso (Solicitud)

- Eliminado en 1ra ronda en 5 torneos consecutivos → Puede solicitar descenso
- El comité revisa y aprueba/rechaza
- Si desciende: Puntos = 0 en categoría inferior

## 🚀 Deploy en Vercel

1. Haz push de tu código a GitHub
2. Importa el proyecto en Vercel
3. Configura las variables de entorno en Vercel (las mismas del `.env`)
4. Vercel detectará Next.js automáticamente y lo desplegará

## 📝 Licencia

MIT

## 👨‍💻 Autor

WinPadel Team
