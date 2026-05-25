# Diagnóstico - Problema de Validación Lenta y "Acceso no permitido"

## Problema Identificado
El sistema está tardando demasiado en validar el acceso (timeout de 15 segundos) y mostrando "Acceso no permitido".

## Cambios Realizados ✅

### 1. **Timeout aumentado: 15s → 45s**
   - Archivo: `auth.js`
   - `AUTH_REQUEST_TIMEOUT_MS = 45000` (antes era 15000)
   - Permite que Google Apps Script tenga más tiempo para responder

### 2. **Reintentos automáticos agregados**
   - Si falla la conexión, ahora reintenta automáticamente 2 veces
   - Espera 2 segundos entre reintentos
   - Mejora la confiabilidad en conexiones inestables

### 3. **Eliminada validación de estado previa**
   - Quitamos la verificación de conectividad antes de autenticar
   - Esto reducía latencia innecesaria
   - Ahora se autentica directamente

### 4. **Mensajes de error mejorados**
   - Mensajes más específicos para diferentes tipos de errores
   - Instrucciones claras sobre qué verificar

---

## Pasos de Diagnóstico

### ✓ Paso 1: Verificar Conexión a Internet
```
- Abre https://google.com en tu navegador
- Si no carga, soluciona tu conexión primero
```

### ✓ Paso 2: Verificar Google Apps Script
**URL en pos.html (línea 6):**
```
https://script.google.com/macros/s/AKfycbxWsxVwFfRjK8NGFj7IhblLL06QII-W-OWnt00-21JqEGA2iKV5luz65Pry_xtUMja9jg/exec
```

**Prueba:**
1. Copia la URL anterior
2. Ábrela en una pestaña nueva de tu navegador
3. Deberías ver una respuesta JSON con `"ok": true`
4. Si ves error 403/404, el Apps Script no está disponible

### ✓ Paso 3: Verificar Hojas de Cálculo
En Google Sheets, verifica que exista la hoja "Usuarios":
- Debe tener columnas: `Usuario`, `Contraseña`, `Nombre`, `Estado`, `EmpresaId`
- Debe tener al menos un usuario con Estado = "Activo"

### ✓ Paso 4: Verificar Usuario y Contraseña
- Usuario debe existir en la hoja "Usuarios"
- El estado debe ser "Activo" (no "Inactivo")
- La contraseña debe ser correcta

### ✓ Paso 5: Revisar Licencia
Si el usuario es de empresa (no admin global):
- Debe tener una empresa asignada en la columna `EmpresaId`
- La empresa debe tener una licencia activa en la hoja "Licencias"

---

## Errores Comunes y Soluciones

### "Problema de conexión - tardando demasiado"
**Causas:**
- Conexión a internet lenta
- Google Apps Script saturado
- Firewall bloqueando Google APIs

**Soluciones:**
1. Cierra otras pestañas/descargas
2. Espera 2-3 minutos e intenta nuevamente
3. Prueba con otra conexión a internet (móvil hotspot)

### "Servidor no disponible"
**Causas:**
- URL de Apps Script incorrecta
- Google Apps Script no está publicado
- El link de acceso ha expirado

**Soluciones:**
1. Verifica la URL en `pos.html` línea 6
2. Abre directamente el URL en el navegador
3. Si no funciona, re-publica el Apps Script:
   - En Google Apps Script, haz clic en "Deploy" → "New deployment"
   - Selecciona "Web app"
   - Ejecuta como: (tu email)
   - Acceso: "Anyone"

### "Usuario no encontrado"
**Causas:**
- El usuario no existe en la hoja "Usuarios"
- Nombre de usuario está en una columna diferente

**Soluciones:**
1. Verifica que el usuario esté en la hoja "Usuarios"
2. La columna debe ser exactamente "Usuario" (o "usuario", "USUARIO", etc.)
3. Verifica mayúsculas/minúsculas

### "Clave incorrecta"
**Causas:**
- Contraseña errada
- Carácter especial no compatible

**Soluciones:**
1. Verifica que CAPS LOCK no esté activado
2. Prueba con otra contraseña simple primero (ej: "test123")
3. Asegúrate que la columna de contraseña sea "Contraseña" o "contraseña"

### "El usuario se encuentra inactivo"
**Causas:**
- El estado del usuario no es "Activo"

**Soluciones:**
1. En la hoja "Usuarios", busca el usuario
2. En la columna "Estado", cambia a "Activo"
3. Guarda los cambios

---

## Archivos Modificados

1. **auth.js**
   - `AUTH_REQUEST_TIMEOUT_MS`: 15000 → 45000
   - Agregadas: `AUTH_REQUEST_RETRY_COUNT`, `AUTH_REQUEST_RETRY_DELAY_MS`
   - Mejorada función `fetchWebDbApi()` con reintentos
   - Mejorados mensajes de error en `getFriendlyLoginError()`
   - Removida validación de estado previa en form submit

---

## Testing

Prueba estos casos:
1. **Usuario válido + contraseña correcta**: Debe entrar al dashboard
2. **Usuario inválido**: Debe mostrar "Usuario no encontrado"
3. **Contraseña incorrecta**: Debe mostrar "Clave incorrecta"
4. **Usuario inactivo**: Debe mostrar "El usuario se encuentra inactivo"
5. **Sin licencia**: Debe mostrar error de licencia

---

## Contacto & Soporte

Si después de todos estos pasos sigue sin funcionar:
1. Abre el navegador console (F12)
2. Intenta el login
3. Copia el error que aparece
4. Verifica la URL del Apps Script en la línea 6 de pos.html
5. Contacta al administrador con esta información
