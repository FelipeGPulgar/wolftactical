// src/config/api.js
// Centraliza la base del backend para que no quede fija a localhost

const rawBase = process.env.REACT_APP_API_BASE || 'http://localhost/wolftactical';
export const API_BASE = rawBase.replace(/\/$/, '');

// Construye URLs a scripts PHP bajo /backend
export function backendUrl(path) {
  const clean = String(path || '').replace(/^\/+/, '');
  return `${API_BASE}/backend/${clean}`;
}

// Construye URLs para servir archivos/imagenes que vienen como rutas relativas
export function mediaUrl(relativePath) {
  if (!relativePath) return '';
  const str = String(relativePath);
  if (/^https?:\/\//i.test(str)) return str;
  const clean = str.replace(/^\/+/, '');
  // Si viene de product_images (guardado como 'uploads/archivo.ext' dentro de backend)
  if (clean.startsWith('uploads/')) {
    return `${API_BASE}/backend/${clean}`;
  }
  return `${API_BASE}/${clean}`;
}
// Note: Cloudflare Pages/Netlify no ejecutan PHP, configura REACT_APP_API_BASE
// con la URL pública donde vive tu backend PHP (ej: https://api.tu-dominio.com/wolftactical)
