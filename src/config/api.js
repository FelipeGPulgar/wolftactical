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
  return `${API_BASE}/${clean}`;
}
// src/config/api.js
// Base de API configurable para despliegue (Render, local, etc.)
let resolvedApiBase = process.env.REACT_APP_API_BASE || '/backend';

// Si estamos en Netlify y no hay REACT_APP_API_BASE, usar ngrok como fallback temporal
if (typeof window !== 'undefined') {
  const isNetlify = /\.netlify\.app$/.test(window.location.hostname);
  if (isNetlify && resolvedApiBase === '/backend') {
    resolvedApiBase = 'https://intercausative-julie-oratorically.ngrok-free.dev/wolftactical/backend';
  }
}

export const API_BASE = resolvedApiBase;

// Aviso útil: en Netlify no existe PHP en "/backend"
if (typeof window !== 'undefined') {
  const isNetlify = /\.netlify\.app$/.test(window.location.hostname);
  if (API_BASE === '/backend' && isNetlify) {
    // eslint-disable-next-line no-console
    console.warn('[API] REACT_APP_API_BASE no está definido. En Netlify, /backend devuelve 404 porque no ejecuta PHP. Configura REACT_APP_API_BASE con la URL de tu backend (por ejemplo, https://tu-backend.com/backend).');
  }
}

export function apiUrl(path) {
  if (!path) return API_BASE;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
