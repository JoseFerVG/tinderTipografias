import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del build de Vite
app.use(express.static(path.join(__dirname, 'dist')));

// Cargar respuestas de memoria iniciales
let serverResponses = [];
if (fs.existsSync(DB_FILE)) {
  try {
    const rawData = fs.readFileSync(DB_FILE, 'utf8');
    serverResponses = JSON.parse(rawData || '[]');
  } catch (e) {
    console.error("Error leyendo database.json:", e);
    serverResponses = [];
  }
}

// Helper para guardar base de datos
const saveDatabase = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(serverResponses, null, 2), 'utf8');
  } catch (e) {
    console.error("Error escribiendo database.json:", e);
  }
};

// Endpoint de Sincronización y Fusión de Datos
app.post('/api/sync', (req, res) => {
  const { clientResponses } = req.body;

  if (!Array.isArray(clientResponses)) {
    return res.status(400).json({ error: "clientResponses debe ser un array" });
  }

  // Fusión de respuestas por nombre de usuario (username único)
  const mergedMap = new Map();

  // 1. Agregar las del servidor primero
  serverResponses.forEach(resp => {
    if (resp.username) {
      mergedMap.set(resp.username.toLowerCase().trim(), resp);
    }
  });

  // 2. Agregar/Sobrecribir con las del cliente (el cliente tiene prioridad)
  clientResponses.forEach(resp => {
    if (resp.username) {
      mergedMap.set(resp.username.toLowerCase().trim(), resp);
    }
  });

  // Convertir el Map de vuelta a array
  serverResponses = Array.from(mergedMap.values());
  
  // Guardar en archivo
  saveDatabase();

  // Responder con la lista completa y actualizada
  res.json(serverResponses);
});

// Endpoint para borrar un colaborador
app.post('/api/delete', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "username es requerido" });
  }
  
  serverResponses = serverResponses.filter(
    r => r.username.toLowerCase().trim() !== username.toLowerCase().trim()
  );
  
  saveDatabase();
  res.json(serverResponses);
});

// Endpoint para vaciar el historial (Dashboard)
app.post('/api/clear', (req, res) => {
  serverResponses = [];
  saveDatabase();
  res.json({ success: true, message: "Historial borrado con éxito" });
});

// Ruta comodín para SPA (enviar index.html de dist para cualquier otra ruta de la app web)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor de TypeMatch escuchando en el puerto ${PORT}`);
  console.log(`Base de datos local guardada en: ${DB_FILE}`);
});
