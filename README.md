# Nueva Farma POS

Sistema POS para farmacias con frontend web, sincronizacion con Google Sheets por Apps Script, API local opcional con MongoDB y empaquetado de escritorio con Electron.

## Estructura

- `pos.html`, `login-interno.html`, `dashboard.html` y paginas relacionadas: interfaz principal del sistema.
- `auth.js`, `pos.js`, `farmapos-data.js` y `pos.css`: logica de autenticacion, POS, datos y estilos.
- `assets/`: logos, iconos e imagenes usadas por el login, promociones y la app.
- `apps-script-inventario.gs`: backend principal para Google Apps Script.
- `google-apps-script/apps-script-inventario.gs`: copia organizada del script para publicar o respaldar.
- `support-api/src/`: API local de soporte y persistencia con MongoDB.
- `electron/main.js`: entrada de escritorio para abrir el POS como aplicacion.
- `scripts/`: utilidades de validacion, instalacion, build y provision.
- `docs/PROJECT-STRUCTURE.md`: mapa detallado de frontend, backend, scripts y Apps Script.

## Comandos

```bash
npm run validate
npm run start:web-api
npm start
```

En Windows, si PowerShell bloquea `npm`, usa:

```bash
npm.cmd run validate
```

## Validacion

Antes de entregar cambios ejecuta:

```bash
npm.cmd run validate
```

Ese chequeo confirma que los archivos principales existen, que los enlaces locales de HTML apuntan a archivos reales y que los scripts JavaScript/Apps Script no tienen errores de sintaxis.

## Configuracion

- Usa `db.config.example.json` y `mongodb.config.example.json` como plantillas.
- No publiques credenciales reales en archivos de ejemplo.
- Si cambias `apps-script-inventario.gs`, mantén sincronizada la copia de `google-apps-script/` cuando corresponda.
