MIGRACIÓN A BUN (OPCIONAL)

Resumen
- Bun es un runtime y package manager rápido que puede reemplazar npm/yarn/pnpm.
- Esta guía documenta pasos seguros para probar Bun en este proyecto sin romper nada.

ADVERTENCIA
- No ejecutes estos comandos si tienes cambios sin commit. Haz `git status` y commitea antes.
- No se realizan cambios automáticos en tu entorno local ni se eliminan archivos por esta guía.

Instalación (una sola vez en la máquina)
1. Revisa el script antes de ejecutarlo: https://bun.sh/install
2. Ejecuta (si decides instalar):

```bash
curl -fsSL https://bun.sh/install | bash
# cierra y vuelve a abrir la terminal o sigue las instrucciones que muestre el instalador
```

Probar en este proyecto (desde la raíz del repo)
1. Hacer backup vía git (muy recomendado):

```bash
git add -A && git commit -m "backup before bun test" || true
```

2. Limpiar artefactos de otros gestores (opcional)

```bash
rm -rf node_modules package-lock.json pnpm-lock.yaml yarn.lock
```

3. Instalar dependencias con Bun (crea `bun.lockb`)

```bash
bun install
```

4. Ejecutar scripts usando `bun run` (no hace falta editar `package.json`)

```bash
bun run start   # equivalente a `npm run start`
bun run test
bun run build
```

Notas y compatibilidad
- Para proyectos basados en Create React App (como este) puede funcionar ejecutar `bun run start`, pero algunas integraciones (plugins, herramientas nativas) podrían comportarse distinto.
- Si algo falla, puedes restaurar fácilmente con `git` o volver a `npm install`.

Recomendación del equipo
- No cambiaré los `scripts` del `package.json` a `bun` porque eso puede romper el flujo de otros devs.
- Si tu equipo decide usar Bun de forma estándar, documentar y actualizar CI es necesario.

Si quieres que añada una sección breve en `README.md` o modifique los `scripts`, dímelo y lo hago.
