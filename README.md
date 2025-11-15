# WolfTactical

WolfTactical es una tienda y panel de administración para gestionar productos tácticos (chalecos, fundas, accesorios) construida sobre React y un backend PHP simple.

## Scripts Disponibles

En el directorio del proyecto puedes ejecutar:

### `npm start`
Inicia la aplicación en modo desarrollo en http://localhost:3000.

### `npm test`
Ejecuta los tests en modo watch interactivo.

### `npm run build`
Genera el build de producción en la carpeta `build`.

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`
Expone toda la configuración (Webpack, Babel, etc.) para personalización avanzada. Úsalo solo si necesitas controlar cada detalle.

## Más Información

Basado en Create React App. Documentación:
- CRA: https://facebook.github.io/create-react-app/
- React: https://reactjs.org/

## Endpoints Frontend (base)
El frontend ahora apunta a: `http://localhost/wolftactical/backend/`

Ejemplos:
```
GET  http://localhost/wolftactical/backend/get_products.php
POST http://localhost/wolftactical/backend/agregar_producto.php
```

## Cambio de Nombre
Se reemplazó todo `schizotactical` / `SchizoTactical` por `wolftactical` / `WolfTactical`.

## Backend
Código PHP en carpeta `backend/`. Asegúrate que XAMPP sirva `/wolftactical/backend` en `http://localhost/wolftactical/backend/`.

## Autenticación Admin
Login almacena `isAdminLoggedIn` en `localStorage` y usa cookies de sesión PHP.

## Próximos Mejoras
- Validación adicional de formularios.
- Manejo centralizado de configuración de API mediante variable global o archivo .env.

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
# wolftactical
