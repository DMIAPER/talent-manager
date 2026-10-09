# Talent Manager Pro 🚀

> **Plataforma Integral y Multidisciplinar de Gestión del Talento, Planes de Carrera y Seguimiento de Empleo**  
> Desarrollado con **Python (FastAPI)** y **React (Vite)** bajo una estética premium *Dark Glassmorphism*.

---

## 🌟 Características Principales

### 1. 📋 Pipeline de Candidaturas & Motor de Follow-up
* **Tablero Kanban Universal**: Gestión visual de cualquier proceso selectivo en cualquier ámbito profesional (`Postulada / En espera`, `Follow-up requerido`, `En proceso / Entrevistas`, `Oferta recibida`, `Retiradas o descartadas`).
* **Semáforo Inteligente de Seguimiento**:
  * 🟢 *En plazo* (< 5 días)
  * 🟡 *Follow-up recomendado hoy* (5-7 días)
  * 🔴 *Plazo excedido* (> 7 días sin respuesta)
* **Plantilla de Follow-up con 1 Clic**: Redacción personalizada y profesional para la empresa lista para copiar y enviar.
* **Comprobador de URLs en Vivo (Detector de Ofertas Retiradas)**: Solicitudes asíncronas en Python (`httpx`) para validar si la vacante continúa activa o si ha sido despublicada/expirada en el portal.

### 2. 📅 Integración con Google Calendar
* Botón directo en cada candidatura para **Agendar Follow-up** o **Agendar Entrevista**.
* Genera automáticamente el evento en Google Calendar con título, notas de la oferta, enlaces y notificaciones preconfiguradas.

### 3. 🎯 Career & Skills Studio (100% Universal)
* **Enfoque Abierto sin Encasillamiento**: Capacidad de gestionar planes de carrera para cualquier disciplina profesional (Tecnología, Sanidad, Dirección de Empresas, Educación, Legal, etc.).
* **Enfoque de Salto Profesional**: Configuración de metas de *Consolidación Senior*, *Salto Vertical a Liderazgo / Gestión* o *Especialización Avanzada*.
* **Matriz de Brechas (Skill Gap Analysis)**: Visualización comparativa de nivel actual vs. nivel objetivo en:
  * *Hard Skills* (técnicas y operativas)
  * *Acreditaciones & Regulaciones* (colegiación oficial, certificaciones oficiales, licencias)
  * *Power / Soft Skills* (liderazgo, gestión de equipos y resolución de conflictos)
* **Roadmap Formativo por Fases**: Hitos temporales (Corto, Medio, Largo Plazo) con estimación de horas, costes, acreditación oficial y actualización en tiempo real del progreso hacia la meta.

### 4. 📊 LinkedIn Hub & Marca Personal
* **Métricas Semanales**: Registro y gráficas visuales de visualizaciones de perfil, apariciones en búsquedas, impresiones de posts y nuevos contactos cualificados.
* **Auditoría de Perfil**: Checklist interactivo basado en las directrices de `skills/Auditor-prefil-linkedin.md` para optimizar Titular, Acerca de, Experiencia STAR y Competencias.

### 5. 📜 Visor PDF & Verificación de Certificados y Titulaciones
* **Extracción y Evaluación con IA**: Identificación automática de titulaciones oficiales de FP, Grado, Máster, horas lectivas y entidades emisoras.
* **Visor PDF Integrado**: Visualización directa en el navegador con opción de descarga amigable y segura.
* **Cero Fabricación**: Blindaje para contrastar toda afirmación exclusivamente contra las fuentes de verdad acreditadas.

### 6. 👥 Bitácora CRM de Interacciones
* Historial cronológico por empresa de llamadas, mensajes de LinkedIn, pruebas técnicas y entrevistas de RRHH/técnicas, con nombres de interlocutores y feedback.

---

## 🛠️ Estructura del Proyecto

```
talent-manager/
├── .env.example                   # Plantilla de variables de entorno (segura)
├── .gitignore                     # Filtros de privacidad, credenciales y caché
├── assets/
│   ├── certificates/              # Carpeta para almacenamiento seguro de certificados
│   └── cv-maestro.example.md      # Plantilla curricular de Fuente de Verdad
├── skills/                        # Agentes y manuales operativos de talento
├── backend/                       # API REST en Python (FastAPI)
│   ├── main.py                    # Entrypoint con CORS y endpoints estáticos
│   ├── routers/                   # applications, career, linkedin, agent, profile, cv
│   ├── services/                  # IA, evaluador de certificados, ATS matcher, browser
│   └── data/                      # Almacenamiento local estructurado (.json)
├── frontend/                      # SPA en React (Vite)
│   ├── src/
│   │   ├── components/            # Visor PDF, Modales, Kanban, Simulador CV, Chats
│   │   └── services/api.js        # Cliente API centralizado
│   └── package.json
└── start.bat                      # Lanzador en 1 clic
```

---

## 🔒 Protocolo de Seguridad y Privacidad

Para garantizar que el repositorio sea 100% seguro y apto para ser publicado en GitHub:
1. **Credenciales en `.env`**: Las claves de API (`GEMINI_API_KEY`) se cargan mediante variables de entorno y están estrictamente ignoradas por `.gitignore`.
2. **Documentos Privados**: Los diplomas y certificados en `assets/certificates/` y tu archivo curricular `cv-maestro.md` nunca se suben al repositorio.
3. **Plantillas Sanitizadas**: El proyecto incluye `.env.example`, `cv-maestro.example.md` y archivos `*.example.json` para facilitar la instalación sin exponer datos reales.

---

## 🚀 Cómo Iniciar la Aplicación

### 1. Configuración de Credenciales
Copia la plantilla de entorno y añade tu clave gratuita de Google Gemini:
```powershell
copy .env.example .env
```
Edita `.env` y añade tu clave:
```env
GEMINI_API_KEY="tu_clave_aqui"
```

### 2. Ejecutar la Aplicación

#### Opción A: Con el lanzador automático
Haz doble clic sobre el archivo [`start.bat`](file:///c:/00-programación/talent-manager/start.bat).

#### Opción B: Manualmente desde la terminal
1. **Iniciar Backend (FastAPI)**:
   ```powershell
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Iniciar Frontend (React + Vite)**:
   ```powershell
   cd frontend
   cmd.exe /c "npm run dev"
   ```

3. Abre en tu navegador: **http://localhost:5173**

