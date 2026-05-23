# Tauro's Barbería 💈

Sitio web profesional para **Tauro's Barbería** — agendamiento de citas en línea con integración a Supabase.

## 🚀 Demo

[Ver sitio](https://mariou04.github.io/Tauros-barber)

## 📋 Funcionalidades

- **Catálogo de barberos** — Elige tu barbero favorito (Carlos Medina, Diego Ruiz, Andrés Torres)
- **Agenda semanal interactiva** — Calendario con slots de 1 hora, vista por semanas
- **Bloqueo de horarios** — Los slots ocupados se deshabilitan automáticamente
- **Reserva en línea** — Nombre, teléfono, servicio, barbero, fecha y hora
- **Confirmación** — Resumen de la cita con enlace directo a WhatsApp
- **Panel admin** — Gestión de citas con login protegido

## 🛠️ Tecnologías

| Tecnología | Propósito |
|-----------|-----------|
| HTML5 + CSS3 | Frontend puro, sin frameworks |
| JavaScript (Vanilla) | Lógica de agenda y conexión a BD |
| Supabase | Base de datos PostgreSQL en la nube |
| Google Fonts | Tipografía (Playfair Display + Montserrat) |
| GitHub Pages | Hosting del sitio |

## 🗄️ Estructura

```
Tauro's Barbería/
├── index.html           # Página principal (solo HTML)
├── admin.html           # Panel de administración (solo HTML)
├── README.md            # Documentación
├── css/
│   ├── style.css        # Estilos del sitio principal
│   └── admin.css        # Estilos del panel admin
├── js/
│   ├── app.js           # Lógica de agenda + Supabase
│   └── admin.js         # Lógica del panel admin
├── img/
│   ├── logo.png         # Logo de la barbería
│   ├── banner.png       # Banner principal
│   ├── barbero1.jpg     # Carlos Medina
│   ├── barbero2.jpg     # Diego Ruiz
│   ├── barbero3.jpg     # Andrés Torres
│   └── 02-boxer-barber.webp
└── .git/
```

## 🗄️ Base de datos (Supabase)

Tabla `citas`:

```sql
CREATE TABLE citas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  servicio TEXT NOT NULL,
  barbero TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio INT NOT NULL,
  hora_fin INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔐 Panel Admin

Accede a `admin.html` para gestionar las citas.

| Campo | Valor |
|-------|-------|
| Correo | `admin@tauros.com` |
| Contraseña | `tauros2025` |

> Cambia las credenciales en `admin.html` buscando `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

## 🧑‍💻 Desarrollo local

```bash
# Clonar
git clone https://github.com/Mariou04/Tauros-barber.git

# Abrir index.html en el navegador
# No requiere build tools ni dependencias
```

## 📸 Capturas

| Home | Agenda | Admin |
|------|--------|-------|
| Banner + barberos | Calendario semanal | Panel de citas |

## 📄 Licencia

Todos los derechos reservados — Tauro's Barbería © 2025
