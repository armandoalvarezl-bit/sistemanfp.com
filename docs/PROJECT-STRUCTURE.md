# Estructura del Proyecto

Esta es la organizacion recomendada sin mover rutas criticas del POS.

## Frontend

- `pos.html` y `login-interno.html`: accesos principal e interno.
- `dashboard.html`, `ventas.html`, `inventario.html` y demas paginas: modulos de la app.
- `auth.js`: autenticacion, recuperacion de contrasena, modal de carga y promociones.
- `pos.js`, `farmapos-data.js`, `delivery-orders.js`: logica de operacion.
- `pos.css`: estilos principales del POS.
- `assets/`: logos, imagenes de login, iconos y promociones.

## Backend

- `support-api/src/server.js`: API local para usuarios, licencias, soporte y datos.
- `support-api/src/mongo-store.js`: almacenamiento MongoDB.
- `db.config.example.json` y `mongodb.config.example.json`: plantillas de configuracion.

## Scripts

- `scripts/validate-project.js`: revisa sintaxis, archivos requeridos y referencias locales de HTML.
- `scripts/build-excel-template.js`: genera plantilla Excel.
- `scripts/provision-tenant-db.js` y `scripts/validate-tenant-schema.js`: provision y validacion multiempresa.

## Google Apps Script

- `apps-script-inventario.gs`: copia principal para pegar/desplegar.
- `google-apps-script/apps-script-inventario.gs`: copia organizada de respaldo.

## Comandos Utiles

```bash
npm run validate
npm run start:web-api
npm start
```

Antes de mover archivos de lugar, ejecuta `npm run validate` y revisa referencias `src`, `href` y rutas dentro de CSS/JS.
