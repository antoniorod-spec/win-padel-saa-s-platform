# Configuración de Google Maps API

## Para habilitar el autocompletado de direcciones en el registro de clubes

### 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Places API**:
   - Ve a "APIs & Services" > "Library"
   - Busca "Places API"
   - Click en "Enable"

### 2. Crear API Key

1. Ve a "APIs & Services" > "Credentials"
2. Click en "Create Credentials" > "API Key"
3. Copia la API Key generada

### 3. Configurar restricciones (Recomendado)

#### Restricciones de aplicación:
1. Click en la API Key creada
2. En "Application restrictions" selecciona:
   - **Para desarrollo local**: "HTTP referrers"
     - Agregar: `http://localhost:3000/*`
   - **Para producción**: "HTTP referrers"
     - Agregar: `https://whinpadel.com/*`
     - Agregar: `https://*.vercel.app/*` (para previews)

#### Restricciones de API:
1. En "API restrictions" selecciona "Restrict key"
2. Selecciona únicamente:
   - **Places API**
   - **Maps JavaScript API** (si planeas mostrar mapas)

### 4. Agregar al proyecto

#### Local (`.env`):
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="tu-api-key-aqui"
```

#### Vercel:
1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega:
   - Name: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Value: tu API key
   - Environment: Production, Preview, Development

### 5. Funcionalidad

Con la API Key configurada:
- ✅ El campo de dirección tendrá autocompletado de Google
- ✅ Los usuarios pueden buscar su dirección escribiendo
- ✅ Al seleccionar, se llena automáticamente con la dirección formateada

Sin la API Key:
- ✅ El campo funciona como input de texto normal
- ✅ Los usuarios pueden escribir la dirección manualmente
- ℹ️ No se requiere obligatoriamente para desarrollo

### Precios

Google Maps Platform ofrece:
- **$200 USD de crédito gratis cada mes**
- Places Autocomplete: ~$2.83 USD por 1000 solicitudes
- Con el crédito gratis puedes hacer ~70,000 búsquedas al mes sin costo

### Nota

El componente está diseñado para funcionar **con o sin** la API Key:
- **Con API Key**: Autocompletado inteligente de Google
- **Sin API Key**: Input de texto normal
- Ambos casos funcionan correctamente ✅
