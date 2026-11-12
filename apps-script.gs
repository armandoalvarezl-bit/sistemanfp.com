/**
 * Backend para el formulario y álbum privado de fotos de la invitación.
 * Vincular este proyecto a una hoja de cálculo de Google antes de implementarlo.
 * Los archivos que suban los invitados quedan privados en el Drive del propietario.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Vincula el script a una hoja de cálculo de Google y vuelve a ejecutar setup().');
  let sheet = ss.getSheetByName('Fotos');
  if (!sheet) sheet = ss.insertSheet('Fotos');
  const headers = ['Fecha y hora', 'Nombre del invitado', 'Mensaje', 'Foto 1 (Drive)', 'Foto 2 (Drive)', 'Foto 3 (Drive)', 'Foto 4 (Drive)', 'Miniatura 1', 'Miniatura 2', 'Miniatura 3', 'Miniatura 4'];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  const folders = DriveApp.getFoldersByName('Primera Comunión - Fotos');
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Primera Comunión - Fotos');
  PropertiesService.getScriptProperties().setProperties({SPREADSHEET_ID:ss.getId(), SHEET_NAME:'Fotos', FOLDER_ID:folder.getId()});
  Logger.log('Configuración terminada. Despliega como aplicación web y pega la URL /exec en index.html.');
}

function doGet(e) {
  if (!e || !e.parameter || e.parameter.gallery !== '1') {
    return HtmlService.createHtmlOutput('Álbum de fotos de la Primera Comunión.');
  }
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');
  const sheetName = props.getProperty('SHEET_NAME') || 'Fotos';
  let cards = '';
  if (spreadsheetId) {
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() > 1) {
      const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(11, sheet.getLastColumn())).getValues().reverse();
      rows.forEach(row => {
        for (let i = 0; i < 4; i++) {
          const url = String(row[7 + i] || row[3 + i] || '');
          const fileId = driveIdFromUrl_(url);
          if (!fileId) continue;
          try {
            const blob = DriveApp.getFileById(fileId).getBlob();
            const mime = blob.getContentType();
            if (!/^image\/(jpeg|png|webp|gif)$/.test(mime)) continue;
            const data = Utilities.base64Encode(blob.getBytes());
            cards += '<figure><img src="data:' + mime + ';base64,' + data + '" alt="Recuerdo de la celebración" draggable="false"><figcaption>Lizzi · Primera Comunión</figcaption></figure>';
          } catch (ignored) { /* Omite archivos que ya no estén disponibles. */ }
        }
      });
    }
  }
  const empty = cards ? '' : '<p class="empty">Todavía no han compartido fotos. ¡Sé el primero!</p>';
  const html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' +
    '*{box-sizing:border-box}body{margin:0;padding:16px;background:#fffaf2;color:#76564b;font:15px Arial,sans-serif}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}figure{position:relative;margin:0;padding:7px;background:#fff;border:1px solid #e7d8c6;border-radius:9px;box-shadow:0 5px 15px #76562b12;overflow:hidden}img{display:block;width:100%;aspect-ratio:1;object-fit:cover;border-radius:5px;-webkit-user-drag:none;user-select:none}figcaption{position:absolute;bottom:13px;left:13px;right:13px;padding:7px 9px;border-radius:4px;background:#fffaf0d9;color:#76564b;text-align:center;font:italic 13px Georgia,serif;pointer-events:none}.empty{grid-column:1/-1;text-align:center;padding:70px 16px;color:#927d82}::selection{background:transparent}</style></head><body><main oncontextmenu="return false">' + cards + empty + '</main><script>document.addEventListener("contextmenu",e=>e.preventDefault());document.addEventListener("dragstart",e=>e.preventDefault());</script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function driveIdFromUrl_(url) {
  const match = String(url).match(/[-\w]{25,}/);
  return match ? match[0] : '';
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const body = JSON.parse(e && e.postData && e.postData.contents || '{}');
    const name = String(body.name || '').trim().slice(0, 80);
    const note = String(body.note || '').trim().slice(0, 300);
    const photos = Array.isArray(body.photos) ? body.photos.slice(0, 4) : [];
    if (!name || photos.length < 1) throw new Error('Escribe tu nombre y adjunta al menos una foto.');
    const props = PropertiesService.getScriptProperties();
    const folder = DriveApp.getFolderById(props.getProperty('FOLDER_ID'));
    const links = photos.map((photo, i) => {
      const mime = String(photo.type || '');
      if (!/^image\/(jpeg|png|webp|gif)$/.test(mime)) throw new Error('Solo se permiten fotos JPEG, PNG, WebP o GIF.');
      const bytes = Utilities.base64Decode(String(photo.data || ''));
      if (bytes.length > 2 * 1024 * 1024) throw new Error('Cada foto debe pesar menos de 2 MB.');
      const safeName = String(photo.name || ('foto-' + (i + 1))).replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);
      const file = folder.createFile(Utilities.newBlob(bytes, mime, new Date().toISOString() + '-' + safeName));
      const thumbType = String(photo.thumbType || '');
      let thumbUrl = '';
      if (/^image\/(jpeg|png|webp)$/.test(thumbType) && photo.thumbData) {
        const thumbBytes = Utilities.base64Decode(String(photo.thumbData));
        if (thumbBytes.length <= 250 * 1024) {
          const thumb = folder.createFile(Utilities.newBlob(thumbBytes, thumbType, 'mini-' + new Date().toISOString() + '-' + safeName));
          thumbUrl = thumb.getUrl();
        }
      }
      return {url:file.getUrl(), thumbUrl:thumbUrl};
    });
    const ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
    const sheet = ss.getSheetByName(props.getProperty('SHEET_NAME') || 'Fotos');
    sheet.appendRow([new Date(), name, note, links[0]?.url || '', links[1]?.url || '', links[2]?.url || '', links[3]?.url || '', links[0]?.thumbUrl || '', links[1]?.thumbUrl || '', links[2]?.thumbUrl || '', links[3]?.thumbUrl || '']);
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(error.message || error)})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
