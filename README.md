# PMN-INFO1163: Sistema de Paquetería Interna Universitaria

Este repositorio contiene la implementación del **Prototipo Mínimo Navegable (PMN)** y la base arquitectónica para el sistema de gestión y trazabilidad de paquetería interna de la Universidad Católica de Temuco.

## 🚀 ¿Qué hemos construido?

1. **Base Dockerizada (Cero dependencias locales)**:
   - Entorno completamente aislado mediante `docker-compose.yml`.
   - **Backend (FastAPI)**: Configurado bajo los principios de **Arquitectura Limpia** (Clean Architecture), con separación estructural en `models`, `schemas`, `services`, `api`, `db` y `core`.
   - **Frontend (Next.js)**: Configurado con TypeScript, TailwindCSS y soporte de *hot-reload* dentro de los microservicios.

2. **Prototipo Mínimo Navegable (Frontend Modular)**:
   - Se transformó el Flujo de Negocio Formal (Handshakes, Geocercas, Validaciones y Excepciones) en una experiencia gráfica navegable y coherente.
   - **Arquitectura de Componentes Modulares**: Separación estricta de vistas lógicas (`src/components/views/`), componentes reutilizables (`src/components/ui/`) y modelos de estado (`src/types/`).
   - UI/UX estética (foco móvil inicial para la aplicación del repartidor estafeta), utilizando Framer Motion para transiciones inmersivas y Lucide-React para iconografía.

3. **Flujos Simulados de la Aplicación (PMN)**:
   - **Ruta Feliz**: Escaneo inicio, 1er Handshake concurrente, Match espacial GPS (Geocerca), validación visual en destino y 2do Handshake (OTP).
   - **Manejo de Errores (E1 y E2)**: Rechazo en origen por daño (Caja mal sellada) e inconsistencias de datos de destino en la plataforma (E2).
   - **Ajuste 1 (Tolerancia)**: Estado de "Espera/Intento Fallido" de 15 minutos e integración de entregas a un "Proxy" autorizado.
   - **Ajuste 2 (Retorno)**: Protocolo legal de devolución a Informática y firma del 3er Handshake con el remitente.
   - **Ajuste 3 (Disputa)**: Resolución de conflictos de custodia legal mediante casilleros neutrales de "Bodega de Cuarentena" (Cerrado con Incidencia).

## 🛠️ Cómo ejecutar el proyecto

Clona o descarga este repositorio y, desde la ruta raíz del proyecto, ejecuta el siguiente comando (requiere Docker y Docker Compose instalados):

```bash
docker compose up --build
```

Esto levantará los siguientes servicios automáticamente de forma local:
- **Frontend (App PMN Navegable)**: Disponible en `http://localhost:3000`
- **Backend (API Base limpia)**: Disponible en `http://localhost:8000/docs` (Swagger UI interactivo)

## 📁 Estructura del Proyecto

```text
/
├── docker-compose.yml     # Orquestador general
├── docs/                  # Documentación del caso y reglas de negocio
├── frontend/              # Interfaz interactiva y Prototipo (Next.js)
│   ├── src/components/    # Vistas modulares y botones genéricos
│   ├── src/types/         # Estados y flujos (TypeScript)
│   └── src/app/page.tsx   # Orquestador central de la maqueta
└── backend/               # Servidor de Datos Inteligente (FastAPI)
    └── app/               # Divisiones en Clean Architecture
```
