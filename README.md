# 💍 Anillos Inteligentes IoT - Suite Web Integral

Sistema web modular para la **administración, control y monitoreo de anillos inteligentes IoT**, desarrollado con tecnologías web modernas y arquitectura cliente-servidor.

---

## 🚀 Descripción del Proyecto

Esta aplicación permite gestionar dispositivos tipo anillo inteligente desde una sola plataforma web.  
El sistema integra tres módulos principales:

- 📋 **CRUD** – Administración completa de dispositivos.
- 🎛 **Control** – Manipulación del estado y parámetros del anillo.
- 📊 **Monitoreo** – Visualización gráfica en tiempo real con refresco automático cada 2 segundos.

Todo el sistema funciona sobre una API REST alojada en MockAPI.

---

## 🌐 API Utilizada
# 💍 Anillos Inteligentes IoT - Suite Web Integral

Sistema web modular para la **administración, control y monitoreo de anillos inteligentes IoT**, desarrollado con tecnologías web modernas y arquitectura cliente-servidor.

---

## 🚀 Descripción del Proyecto

Esta aplicación permite gestionar dispositivos tipo anillo inteligente desde una sola plataforma web.  
El sistema integra tres módulos principales:

- 📋 **CRUD** – Administración completa de dispositivos.
- 🎛 **Control** – Manipulación del estado y parámetros del anillo.
- 📊 **Monitoreo** – Visualización gráfica en tiempo real con refresco automático cada 2 segundos.

Todo el sistema funciona sobre una API REST alojada en MockAPI.

---

## 🌐 API Utilizada
https://698a177cc04d974bc6a1538d.mockapi.io/api/v1/Examen


---

## 🛠 Tecnologías Utilizadas

- HTML5
- CSS3
- Bootstrap 5
- JavaScript Vanilla
- Async/Await
- Fetch API
- Chart.js
- MockAPI (API REST)

---

## 🧠 Arquitectura del Proyecto

El sistema está desarrollado como una **SPA (Single Page Application)** modular:
anillos-inteligentes-iot/
│
├── index.html
├── assets/
│ └── css/
│ └── main.css
│
└── js/
├── app.js
├── config.js
├── api.js
├── router.js
├── store.js
├── utils.js
└── modules/
├── crud.js
├── control.js
└── monitor.js


---

## 📋 Módulo CRUD

Permite:

- Crear anillos inteligentes
- Editar dispositivos existentes
- Eliminar registros individuales
- Eliminar todos los registros
- Filtrar por estado
- Búsqueda global

Campos gestionados:

- Nombre
- Modelo
- Usuario (avatar)
- Estado (Activo/Inactivo)
- Batería (%)
- Última sincronización
- Dirección IP

---

## 🎛 Módulo de Control

Desde este módulo se puede:

- Activar / Desactivar el dispositivo
- Ajustar nivel de batería
- Forzar sincronización
- Visualizar estado actual en tiempo real

---

## 📊 Módulo de Monitoreo

Incluye:

- Gráficas dinámicas por dispositivo
- Historial local (últimos 10 eventos)
- Visualización de batería y estado (0 / 1)
- Actualización automática cada 2 segundos
- Control de pausa / reanudación del refresco

---

## 🔄 Comunicación con la API

Se utilizan métodos HTTP estándar:

- `GET` → Obtener dispositivos
- `POST` → Crear dispositivo
- `PUT` → Actualizar dispositivo
- `DELETE` → Eliminar dispositivo

Ejemplo:

```javascript
const res = await fetch(API_BASE, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

▶ Cómo Ejecutar el Proyecto
Opción recomendada

Abrir la carpeta del proyecto en VS Code

Instalar la extensión Live Server

Click derecho en index.html

Seleccionar Open with Live Server

🎯 Objetivos del Sistema

Implementar arquitectura cliente-servidor.

Aplicar programación asíncrona con Async/Await.

Integrar visualización de datos en tiempo real.

Diseñar una interfaz moderna y modular.

Centralizar administración, control y monitoreo en una sola aplicación.

👨‍💻 Autor

Daniel Sabas Ramirez Butrón