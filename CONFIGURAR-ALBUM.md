# Álbum de fotos en línea

La invitación ya permite seleccionar hasta cuatro fotos, verlas antes de enviarlas y agregar nombre y mensaje. Para que el envío quede guardado entre dispositivos hay que enlazar una hoja de Google Sheets con una carpeta privada de Drive. El archivo `apps-script.gs` prepara ese enlace; la hoja se puede descargar después como Excel (`.xlsx`).

## Activar el guardado

1. Crea una hoja nueva en Google Sheets desde la cuenta de la familia.
2. En esa hoja, abre **Extensiones → Apps Script**.
3. Reemplaza el contenido del editor por el de `apps-script.gs` y guarda.
4. En el selector de funciones, elige `setup` y pulsa **Ejecutar**. Autoriza el acceso a esa hoja y a Drive. Se creará una pestaña `Fotos` y una carpeta privada `Primera Comunión - Fotos`.
5. En Apps Script, pulsa **Implementar → Nueva implementación → Aplicación web**. Ejecutar como: **yo**. Quién tiene acceso: **cualquier persona** para que los invitados no tengan que iniciar sesión. Implementa y copia la URL que termina en `/exec`. Si ya tienes un despliegue, abre **Implementar → Gestionar implementaciones → Editar**, selecciona **Nueva versión** y vuelve a implementar para que el mismo enlace cargue el álbum.
6. En `index.html`, pega esa URL dentro de `UPLOAD_ENDPOINT`.
7. Publica de nuevo la invitación para que los invitados tengan la versión conectada.

Cada envío añade una fila con fecha, nombre, mensaje y enlaces a un máximo de cuatro fotos, junto con miniaturas optimizadas para el álbum. Los archivos se guardan como privados en el Drive de la familia. La página de galería usa la aplicación web para mostrarlos a quienes tengan acceso al enlace de la invitación. El formulario comprime las imágenes para limitar el peso y el álbum no ofrece botones para descargar.

La URL pública de Apps Script permite recibir envíos y mostrar el álbum a quien la visite; comparte la invitación solo con las personas invitadas. La aplicación no presenta enlaces o botones de descarga, aunque ninguna página puede impedir por completo que alguien haga una captura o guarde una imagen que ve en pantalla. No compartas públicamente la hoja ni la carpeta de Drive. Para descargar una copia en Excel, usa **Archivo → Descargar → Microsoft Excel (.xlsx)** en Google Sheets.
