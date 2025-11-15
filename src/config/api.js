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
