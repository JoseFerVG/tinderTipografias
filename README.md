# TypeMatch — Decisión de Tipografía Corporativa

TypeMatch es una aplicación web interactiva de estética minimalista y premium diseñada para ayudar a las empresas a decidir de manera colectiva y consensuada su sistema tipográfico (para Títulos H1, Subtítulos H2, Gráficas de Instagram y Cuerpo de Texto).

La aplicación funciona mediante una interfaz estilo "Tinder", donde cada colaborador califica ("Me gusta" o "Descartar") una selección de 14 tipografías profesionales de Google Fonts ampliamente utilizadas en el sector.

## ✨ Características

- **Votación Tipo Tinder**: Desliza o vota si te gusta cada tipografía con transiciones fluidas.
- **Teclado Interactivo**:
  - `←` / `→`: Descartar / Me Gusta.
  - `Espacio`: Alternar entre previsualizaciones (H1, H2, Instagram, Cuerpo).
  - `1` al `8`: Cambiar instantáneamente el color del texto.
  - `F` / `f`: Activar/desactivar filtro de color en el fondo.
- **Previsualizaciones en Contexto**: Visualiza la tipografía en escenarios reales de marca (H1 corporativo, post de Instagram diseñado, etc.).
- **Paleta de Colores Corporativa**: Soporta cambio interactivo de tipografía y filtros de fondo con la paleta de la empresa:
  - `#d96a73` (Coral)
  - `#f78041` (Naranja)
  - `#8fb186` (Verde salvia)
  - `#f8a861` (Arena)
  - `#4f628d` (Azul pizarra)
  - `#c1d0e0` (Gris azulado)
  - `#6a8dd3` (Pervinca)
  - `#f9fcfd` (Blanco roto)
- **Filtro de Fondo**: Aplica una capa traslúcida y desenfocada del color activo sobre la imagen de fondo (`fondo.png`) para evaluar el contraste y el clima visual.
- **Asignación de Roles**: Una vez finalizada la votación, el usuario asigna sus tipografías favoritas a roles específicos (H1, H2, Instagram y Cuerpo).
- **Dashboard de Consenso**:
  - Muestra la **Identidad Visual Resultante en Vivo** combinando las fuentes ganadoras por votación colectiva.
  - Gráficos estadísticos con el conteo de votos de cada fuente por categoría.
  - Historial detallado de las elecciones de cada colaborador.
  - Guardado en `localStorage` (sin base de datos, ideal para despliegues estáticos y rápidos).

## 🚀 Instalación y Desarrollo Local

1. Asegúrate de tener instalado **Node.js** (v18 o superior).
2. Abre la terminal en esta carpeta e instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
4. Abre la dirección que aparezca en la consola (usualmente `http://localhost:5173`).

## ☁️ Cómo subir a Render (¡Totalmente Gratis!)

Render te permite alojar esta aplicación como un **Static Site** de forma gratuita en menos de 2 minutos.

### Paso 1: Subir el código a GitHub/GitLab
1. Crea un repositorio en tu cuenta de GitHub (público o privado).
2. Sube esta carpeta a tu repositorio:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of TypeMatch"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

### Paso 2: Crear el sitio en Render
1. Inicia sesión en [Render.com](https://render.com/).
2. Haz clic en el botón **New +** y selecciona **Static Site**.
3. Conecta tu cuenta de GitHub y selecciona el repositorio de la aplicación.
4. Rellena los siguientes campos:
   - **Name**: `typematch` (o el nombre que prefieras).
   - **Branch**: `main`.
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
5. Haz clic en **Create Static Site**.
6. ¡Listo! Render compilará tu aplicación y te dará una URL pública (ej. `typematch.onrender.com`) para compartir con tus compañeros de la empresa.

