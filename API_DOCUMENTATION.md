# 📘 Guía Maestra de Implementación - TrifoBet Backend

Esta documentación está diseñada para el equipo de Frontend (Next.js). Contiene **toda** la información necesaria para integrar el backend: endpoints REST, eventos WebSocket, estructuras de datos exactas (JSON) y flujos de autenticación.

---

## 🛠️ Configuración Inicial

### Base URL
- **REST API**: `http://localhost:3000` (o URL de producción)
- **WebSocket**: `http://localhost:3000` (o URL de producción)

### Autenticación
El backend utiliza **JWT (JSON Web Token)**.
- **Header para REST**: `Authorization: Bearer <TOKEN>`
- **Handshake para WebSocket**: `{ auth: { token: "<TOKEN>" } }`

---

## 1. 🔐 Módulo de Autenticación (`/auth`)

### 1.1. Registro de Usuario
Crea una nueva cuenta.

- **Endpoint**: `POST /auth/register`
- **Body (JSON)**:
  ```json
  {
    "nombre": "Juan",
    "apellido1": "Perez",
    "apellido2": "Lopez",       // Opcional
    "ci": "1234567",            // Cédula de Identidad
    "fechaNacimiento": "1990-01-01",
    "nombreUsuario": "juanperez",
    "correo": "juan@example.com",
    "telefono": "77777777",     // Opcional
    "contrasena": "password123",
    "paisCodigo": "BO"          // Opcional (Defecto: 'BO')
  }
  ```
- **Respuesta (201 Created)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUz...", // Guardar en localStorage/Cookies
    "user": {
      "id": 1,
      "nombre": "Juan",
      "usuario": "juanperez",
      "saldo": 0
    }
  }
  ```

### 1.2. Iniciar Sesión
- **Endpoint**: `POST /auth/login`
- **Body (JSON)**: *Puede usar `correo` O `nombreUsuario`*
  ```json
  {
    "correo": "juan@example.com",       // Opción A
    "nombreUsuario": "juanperez",       // Opción B
    "contrasena": "password123"
  }
  ```
- **Respuesta (200 OK)**: *Misma estructura que Registro (token + user)*

### 1.3. Obtener Usuario Actual (Me)
Valida el token y devuelve datos frescos del usuario.

- **Endpoint**: `GET /auth/me`
- **Header**: `Authorization: Bearer <TOKEN>`
- **Respuesta**:
  ```json
  {
    "userId": 1,
    "nombre_usuario": "juanperez",
    "correo": "juan@example.com",
    "rol": "user"
  }
  ```

---

## 2. 👤 Perfil de Usuario (`/perfil`)

### 2.1. Obtener Datos Completos
- **Endpoint**: `GET /perfil/me`
- **Respuesta**:
  ```json
  {
    "id": 1,
    "nombre": "Juan",
    "apellido1": "Perez",
    "saldo": 100.50,
    "foto_perfil": "https://res.cloudinary.com/...", // URL de la foto
    "pais_codigo": "BO"
  }
  ```

### 2.2. Actualizar Datos
- **Endpoint**: `PATCH /perfil/me`
- **Body**:
  ```json
  {
    "nombre": "Juan Carlos",
    "telefono": "60000000"
  }
  ```

### 2.3. Subir Foto
- **Endpoint**: `PATCH /perfil/me/photo`
- **Form-Data**: Key `foto` (archivo imagen).

---

## 3. ⚽ Deportes y Cuotas (`/deportes`)

### 3.1. Obtener Partidos (Feed Principal)
Devuelve partidos, marcadores en vivo y TODAS las cuotas.

- **Endpoint**: `GET /deportes/futbol/partidos`
- **Query Params**: `fecha=2025-12-09` (Opcional)
- **Respuesta (Estructura Completa)**:
  ```json
  [
    {
      "id": 1451111,
      "fecha": "2025-12-09T15:00:00.000Z",
      "liga": "Champions League",
      "logo_liga": "https://media.api-sports.io/football/leagues/2.png",
      "pais": "World",
      "bandera_pais": "https://media.api-sports.io/flags/world.svg",
      "equipo_local": "Real Madrid",
      "equipo_visitante": "Barcelona",
      "escudo_local": "https://media.api-sports.io/football/teams/541.png",
      "escudo_visitante": "https://media.api-sports.io/football/teams/529.png",
      "estado": "1H",       // 1H (1er Tiempo), 2H, HT (Descanso), FT (Fin), NS (No iniciado)
      "minuto": 34,         // ⏱️ MINUTO EN VIVO
      "updated_at": "2025-12-09T15:05:00.000Z", // Última actualización de datos
      "goles_local": 1,
      "goles_visitante": 0,
      "cuotas": {
        "main": {
          "1X2": { "1": 1.50, "X": 4.00, "2": 6.50 },
          "double_chance": { "1X": 1.10, "12": 1.20, "X2": 2.50 },
          "btts": { "yes": 1.80, "no": 1.90 } // Ambos anotan
        },
        "goals": {
          "total": {
            "2.5": { "over": 1.70, "under": 2.10 } // Más/Menos de 2.5 goles
          }
        },
        "handicap": {
          "asian": {
            "-1.5": { "1": 2.10, "2": 1.70 }
          }
        }
      }
    }
  ]
  ```

---

## 4. 🎫 Apuestas (`/apuestas-deportivas`)

### 4.1. Crear Apuesta
- **Endpoint**: `POST /apuestas-deportivas/crear`
- **Body**:
  ```json
  {
    "tipo": "simple", // o "combinada"
    "monto": 50.00,
    "selecciones": [
      {
        "eventoId": 1451111,
        "mercado": "main.1X2",      // ID técnico del mercado (usar claves del objeto cuotas)
        "seleccion": "1",           // "1", "X", "2", "over", "yes", etc.
        "cuota": 1.50,
        "eventoNombre": "Real Madrid vs Barcelona", // Para mostrar en historial
        "seleccionDisplay": "Real Madrid"           // Para mostrar en historial
      }
    ]
  }
  ```

### 4.2. Historial
- **Endpoint**: `GET /apuestas-deportivas/historial`
- **Query**: `estado=pendiente` (o ganada/perdida)
- **Respuesta**:
  ```json
  [
    {
      "id": 10,
      "monto": 50,
      "gananciaPotencial": 75,
      "estado": "pendiente",
      "selecciones": [ ... ]
    }
  ]
  ```

---

## 5. 💸 Transacciones (`/transacciones`)

### 5.1. Depositar
- **Endpoint**: `POST /transacciones/deposito`
- **Body**:
  ```json
  {
    "monto": 100,
    "entidadFinancieraId": 1, // ID obtenido de /transacciones/entidades
    "metodoPagoId": 1,        // ID obtenido de /transacciones/metodos-pago
    "datosPago": { "banco": "BNB", "cuenta": "..." }
  }
  ```

### 5.2. Retirar
- **Endpoint**: `POST /transacciones/retiro`
- **Body**: *Similar a depósito*

---

## 6. 🎰 Casino (WebSockets)

Los juegos usan **Socket.IO**. Debes conectar a namespaces específicos.

### 6.1. Blackjack (`/blackjack`)
- **Conexión**: `io('URL/blackjack', { auth: { token } })`
- **Eventos que EMITES (Cliente -> Servidor)**:
  - `joinGame`: Unirse a la mesa.
  - `addBet { amount: 10 }`: Añadir ficha.
  - `dealInitial`: Repartir cartas (iniciar ronda).
  - `hit`: Pedir carta.
  - `stand`: Plantarse.
  - `double`: Doblar apuesta.
  - `split`: Dividir pares.
- **Eventos que ESCUCHAS (Servidor -> Cliente)**:
  - `gameState`: Estado completo inicial (balance, cartas, turno).
  - `gameUpdate`: Actualización parcial (nueva carta, cambio de turno).

### 6.2. Nebula Crash (`/nebula`)
- **Conexión**: `io('URL/nebula', { auth: { token } })`
- **Eventos EMITES**:
  - `placeNebulaBet { amount: 10 }`: Apostar para la siguiente ronda.
  - `cashoutNebula { multiplier: 2.5 }`: Retirar ganancia en vuelo.
- **Eventos ESCUCHAS**:
  - `nebulaGameStarted`: El cohete despega.
  - `nebulaTick { multiplier: 1.05 }`: Actualización constante del multiplicador (cada 100ms).
  - `nebulaGameCrashed { crashPoint: 3.45 }`: El cohete explota.

### 6.3. Plinko (`/plinko`)
- **Conexión**: `io('URL/plinko', { auth: { token } })`
- **Eventos EMITES**:
  - `placeBet { betAmount: 10, rows: 16, risk: 'high' }`: Tirar una bola.
- **Eventos ESCUCHAS**:
  - `plinkoResult`: Resultado del trayecto de la bola (path) y multiplicador final.

---

## 7. ⚠️ Manejo de Errores

El backend devuelve errores con códigos HTTP estándar y un cuerpo JSON consistente.

### Estructura de Error
```json
{
  "statusCode": 400,
  "message": ["El monto debe ser mayor a 0", "La entidad financiera es obligatoria"],
  "error": "Bad Request"
}
```

- **400 Bad Request**: Error de validación (datos faltantes o inválidos).
- **401 Unauthorized**: Token inválido o expirado.
- **403 Forbidden**: No tiene permisos para esta acción.
- **404 Not Found**: Recurso no encontrado (ej: partido o apuesta).
- **500 Internal Server Error**: Error inesperado del servidor.

---

## 8. 📄 Paginación

Los endpoints de historial (`/historial`) utilizan paginación basada en `limit` y `offset`.

- **limit**: Cantidad de elementos a devolver (Default: 20).
- **offset**: Cantidad de elementos a saltar (Default: 0).

**Ejemplo:**
- Página 1: `?limit=20&offset=0`
- Página 2: `?limit=20&offset=20`
- Página 3: `?limit=20&offset=40`
