export function formatCLP(value) {
  const num = Number(value);
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

export function parseCLPInput(raw) {
  // Remove non digits
  if (typeof raw !== 'string') return raw;
  const cleaned = raw.replace(/[^0-9]/g, '');
  return cleaned;
}