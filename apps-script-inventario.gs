var SHEET_NAME = 'Inventario';
var SALES_SHEET_NAME = 'Ventas';
var USERS_SHEET_NAME = 'Usuarios';
var COMPANIES_SHEET_NAME = 'Empresas';
var LICENSES_SHEET_NAME = 'Licencias';
var LICENSE_DEVICES_SHEET_NAME = 'LicenciasEquipos';
var LICENSE_HISTORY_SHEET_NAME = 'LicenciasHistorial';
var WITHDRAWALS_SHEET_NAME = 'Retiros';
var CASH_CLOSURES_SHEET_CANDIDATES = ['CierresCaja', 'Cierres de Caja', 'Cierres'];
var SETTINGS_SHEET_NAME = 'Info';
var CLIENTS_SHEET_NAME = 'Clientes';
var SUPPLIERS_SHEET_NAME = 'Proveedores';
var PURCHASES_SHEET_NAME = 'Compras';
var RETURNS_SHEET_NAME = 'Devoluciones';
var PROMOTIONS_SHEET_NAME = 'Promociones';
var AUDIT_LOGS_SHEET_NAME = 'Auditoria';
var SUPPORT_TICKETS_SHEET_NAME = 'SoporteTickets';
var SUPPORT_MESSAGES_SHEET_NAME = 'SoporteMensajes';
var REQUIRED_HEADERS = ['id', 'sku', 'nombre', 'categoria', 'precio', 'stock', 'lote', 'fecha_vencimiento', 'laboratorio', 'registro_invima', 'codigo_barras', 'descripcion', 'imagen_url', 'activo'];
var LEGACY_SALES_HEADERS = ['id', 'ticket_numero', 'fecha', 'hora', 'cliente_nombre', 'cliente_documento', 'metodo_pago', 'recibido', 'cambio', 'subtotal', 'impuesto', 'total', 'items_json', 'creado_en'];
var SALES_HEADERS = ['id', 'ticket_numero', 'fecha', 'hora', 'cliente_nombre', 'cliente_documento', 'metodo_pago', 'recibido', 'cambio', 'subtotal', 'impuesto', 'total', 'items_json', 'creado_en', 'puntos_usados', 'descuento_puntos', 'puntos_ganados', 'estado', 'anulado_en', 'anulado_por', 'motivo_anulacion', 'domicilio_estado', 'domicilio_actualizado_en'];
var USER_HEADERS = ['Id', 'Nombre', 'Usuario', 'contraseña', 'Estado'];
var WITHDRAWALS_HEADERS = ['id', 'retiro_numero', 'fecha', 'hora', 'monto', 'motivo', 'cajero_usuario', 'cajero_nombre', 'supervisor_usuario', 'supervisor_nombre', 'creado_en'];
var CASH_CLOSURES_HEADERS = ['id', 'cierre_numero', 'fecha', 'creado_en', 'usuario', 'apertura', 'ventas_efectivo', 'ventas_tarjeta', 'ventas_transferencia', 'retiros_total', 'ajuste_manual', 'efectivo_contado', 'efectivo_esperado', 'diferencia', 'transacciones', 'ventas_total', 'unidades', 'observaciones', 'ventas_json'];
var SETTINGS_HEADERS = ['clave', 'valor'];
var CLIENT_HEADERS = ['id', 'nombre', 'documento', 'telefono', 'compras', 'puntos', 'total_gastado', 'activo'];
var SUPPLIER_HEADERS = ['id', 'nombre', 'documento', 'telefono', 'contacto', 'ciudad', 'notas', 'activo'];
var PURCHASE_HEADERS = ['id', 'proveedor_id', 'proveedor_nombre', 'inventario_id', 'producto_nombre', 'sku', 'cantidad', 'costo_unitario', 'total', 'lote', 'fecha', 'notas', 'creado_en'];
var RETURN_HEADERS = ['id', 'venta_id', 'detalle_venta_id', 'ticket_numero', 'cliente_nombre', 'inventario_id', 'producto_nombre', 'cantidad', 'precio_unitario', 'total', 'motivo', 'repone_stock', 'fecha', 'creado_en', 'procesado_por'];
var PROMOTION_HEADERS = ['id', 'nombre', 'alcance', 'objetivo', 'tipo_descuento', 'valor_descuento', 'activo'];
var AUDIT_LOG_HEADERS = ['id', 'modulo', 'accion', 'entity_id', 'entity_name', 'detalle', 'usuario', 'usuario_login', 'creado_en'];
var SUPPORT_TICKET_HEADERS = ['id', 'ticket_code', 'empresa_id', 'empresa_nombre', 'licencia_codigo', 'contacto_nombre', 'contacto_email', 'contacto_telefono', 'titulo', 'categoria', 'prioridad', 'estado', 'creado_por_usuario', 'creado_por_nombre', 'creado_en', 'ultimo_mensaje_en', 'no_leidos_empresa', 'no_leidos_interno'];
var SUPPORT_MESSAGE_HEADERS = ['id', 'ticket_id', 'autor_scope', 'autor_usuario', 'autor_nombre', 'mensaje', 'creado_en'];
var COMPANY_PROFILE_KEYS = ['name', 'nit', 'phone', 'email', 'address', 'city', 'manager', 'logo_url'];
var LEGACY_USER_HEADERS = ['Id', 'Nombre', 'Usuario', 'contraseÃ±a', 'Estado'];
var WEB_USER_HEADERS = ['Id', 'EmpresaId', 'Nombre', 'Usuario', 'contrasena', 'Rol', 'Estado', 'CreadoEn'];
var COMPANY_HEADERS = ['id', 'nombre', 'nit', 'telefono', 'email', 'contacto', 'estado', 'creada_en', 'actualizada_en'];
var LICENSE_HEADERS = ['id', 'empresa_id', 'codigo_licencia', 'cliente_nombre', 'cliente_documento', 'empresa_nombre', 'telefono', 'email', 'equipo_id', 'equipo_nombre', 'plan', 'max_equipos', 'fecha_activacion', 'fecha_vencimiento', 'estado', 'observaciones', 'creada_en', 'actualizada_en'];
var LICENSE_DEVICE_HEADERS = ['id', 'licencia_id', 'equipo_id', 'equipo_nombre', 'primera_activacion', 'ultima_validacion', 'estado'];
var LICENSE_HISTORY_HEADERS = ['id', 'licencia_id', 'tipo_evento', 'detalle', 'equipo_id', 'equipo_nombre', 'creado_en'];

function doGet(e) {
  var mode = getParam_(e, 'mode', 'full');

  try {
    if (mode === 'ping') {
      return jsonResponse_({
        ok: true,
        mode: 'ping',
        message: 'Apps Script responde',
        timestamp: new Date().toISOString()
      });
    }

    if (mode === 'debug') {
      return jsonResponse_(debugInfo_());
    }

    if (mode === 'diagnostics') {
      var sheet = SpreadsheetApp.getActiveSpreadsheet();
      return jsonResponse_({
        ok: true,
        mode: 'diagnostics',
        timestamp: new Date().toISOString(),
        spreadsheet_id: sheet.getId(),
        spreadsheet_name: sheet.getName()
      });
    }

    if (mode === 'setup') {
      return jsonResponse_(setupWebApp_({ dryRun: true }));
    }

    if (mode === 'users') {
      return jsonResponse_({
        ok: true,
        mode: 'users',
        updated_at: new Date().toISOString(),
        users: listUsersWeb_()
      });
    }

    if (mode === 'licensing') {
      return jsonResponse_({
        ok: true,
        mode: 'licensing',
        updated_at: new Date().toISOString(),
        overview: getLicensingOverviewWeb_()
      });
    }

    if (mode === 'sales') {
      var salesSheet = getSalesSheet_();
      var sales = readSalesItems_(salesSheet);
      return jsonResponse_({
        ok: true,
        mode: 'sales',
        updated_at: new Date().toISOString(),
        total: sales.length,
        sales: sales
      });
    }

    if (mode === 'support') {
      return jsonResponse_(getSupportOverviewWeb_({
        companyId: getParam_(e, 'companyId', ''),
        isInternal: getParam_(e, 'isInternal', 'false') === 'true'
      }));
    }

    if (mode === 'withdrawals') {
      var withdrawalsSheet = getWithdrawalsSheet_();
      var withdrawals = readWithdrawalItems_(withdrawalsSheet);
      return jsonResponse_({
        ok: true,
        mode: 'withdrawals',
        updated_at: new Date().toISOString(),
        total: withdrawals.length,
        withdrawals: withdrawals
      });
    }

    if (mode === 'closures') {
      var cashClosuresSheet = getCashClosuresSheet_();
      var closures = readCashClosureItems_(cashClosuresSheet);
      return jsonResponse_({
        ok: true,
        mode: 'closures',
        updated_at: new Date().toISOString(),
        total: closures.length,
        closures: closures
      });
    }

    if (mode === 'company') {
      var settingsSheet = getSettingsSheet_();
      return jsonResponse_({
        ok: true,
        mode: 'company',
        updated_at: new Date().toISOString(),
        profile: readCompanyProfile_(settingsSheet)
      });
    }

    if (mode === 'all') {
      return jsonResponse_(buildFullWorkbookState_('all'));
    }

    var sheet = getInventorySheet_();
    var items = readInventoryItems_(sheet);

    return jsonResponse_({
      ok: true,
      mode: 'full',
      updated_at: new Date().toISOString(),
      total: items.length,
      items: items,
      inventory: items
    });
  } catch (error) {
    logError_('doGet', error);
    return jsonResponse_({
      ok: false,
      where: 'doGet',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function doPost(e) {
  try {
    var payload = parseRequestBody_(e);
    var action = String(payload.action || 'upsert').trim().toLowerCase();

    if (action === 'debug') {
      return jsonResponse_({
        ok: true,
        mode: 'post-debug',
        received: payload,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'authenticate_user') {
      var usersSheet = getUsersSheet_();
      var authResult = authenticateUser_(usersSheet, payload);
      return jsonResponse_(authResult);
    }

    if (action === 'request_password_reset') {
      return jsonResponse_(requestPasswordResetWeb_(payload));
    }

    if (action === 'confirm_password_reset') {
      return jsonResponse_(confirmPasswordResetWeb_(payload));
    }

    if (action === 'setup_web_app') {
      return jsonResponse_(setupWebApp_(payload));
    }

    if (action === 'list_users') {
      return jsonResponse_({
        ok: true,
        action: 'list_users',
        updated_at: new Date().toISOString(),
        users: listUsersWeb_()
      });
    }

    if (action === 'save_user') {
      return jsonResponse_({
        ok: true,
        action: 'save_user',
        updated_at: new Date().toISOString(),
        users: saveUserWeb_(payload.user || payload)
      });
    }

    if (action === 'set_user_active') {
      return jsonResponse_({
        ok: true,
        action: 'set_user_active',
        updated_at: new Date().toISOString(),
        users: setUserActiveWeb_(payload.id, payload.active)
      });
    }

    if (action === 'licensing_overview') {
      return jsonResponse_({
        ok: true,
        action: 'licensing_overview',
        updated_at: new Date().toISOString(),
        overview: getLicensingOverviewWeb_()
      });
    }

    if (action === 'save_company') {
      return jsonResponse_({
        ok: true,
        action: 'save_company',
        updated_at: new Date().toISOString(),
        overview: saveCompanyWeb_(payload.company || payload)
      });
    }

    if (action === 'save_license') {
      return jsonResponse_({
        ok: true,
        action: 'save_license',
        updated_at: new Date().toISOString(),
        overview: saveLicenseWeb_(payload.license || payload)
      });
    }

    if (action === 'assign_license_current') {
      return jsonResponse_({
        ok: true,
        action: 'assign_license_current',
        updated_at: new Date().toISOString(),
        response: assignLicenseToInstallationWeb_(
          payload.id || payload.licenseId,
          payload.installationId,
          payload.installationName
        )
      });
    }

    if (action === 'validate_license_web') {
      return jsonResponse_({
        ok: true,
        action: 'validate_license_web',
        updated_at: new Date().toISOString(),
        license: validateLicenseWeb_(payload.code || payload.licenseCode || '')
      });
    }

    if (action === 'set_license_status') {
      return jsonResponse_({
        ok: true,
        action: 'set_license_status',
        updated_at: new Date().toISOString(),
        overview: setLicenseStatusWeb_(payload.id, payload.status)
      });
    }

    if (action === 'renew_license') {
      return jsonResponse_({
        ok: true,
        action: 'renew_license',
        updated_at: new Date().toISOString(),
        overview: renewLicenseWeb_(payload.id)
      });
    }

    if (action === 'release_license_device') {
      return jsonResponse_({
        ok: true,
        action: 'release_license_device',
        updated_at: new Date().toISOString(),
        overview: releaseLicenseDeviceWeb_(payload.licenseId, payload.installationId)
      });
    }

    if (action === 'save_company_profile') {
      var settingsSheet = getSettingsSheet_();
      var profile = normalizeCompanyProfile_(payload.profile || payload);
      var savedProfile = saveCompanyProfile_(settingsSheet, profile);
      return jsonResponse_({
        ok: true,
        action: 'save_company_profile',
        updated_at: new Date().toISOString(),
        profile: savedProfile
      });
    }

    if (action === 'workbook_state') {
      return jsonResponse_(buildFullWorkbookState_('workbook_state'));
    }

    if (action === 'save_client') {
      return jsonResponse_(saveClientWeb_(payload.client || payload));
    }

    if (action === 'set_client_active') {
      return jsonResponse_(setClientActiveWeb_(payload.id || payload.clientId, payload.active));
    }

    if (action === 'delete_client') {
      return jsonResponse_(deleteClientWeb_(payload.id || payload.clientId));
    }

    if (action === 'save_supplier') {
      return jsonResponse_(saveSupplierWeb_(payload.supplier || payload));
    }

    if (action === 'set_supplier_active') {
      return jsonResponse_(setSupplierActiveWeb_(payload.id || payload.supplierId, payload.active));
    }

    if (action === 'delete_supplier') {
      return jsonResponse_(deleteSupplierWeb_(payload.id || payload.supplierId));
    }

    if (action === 'register_purchase') {
      return jsonResponse_(registerPurchaseWeb_(payload.purchase || payload));
    }

    if (action === 'register_return') {
      return jsonResponse_(registerReturnWeb_(payload.returnEntry || payload.return || payload));
    }

    if (action === 'save_promotion') {
      return jsonResponse_(savePromotionWeb_(payload.promotion || payload));
    }

    if (action === 'set_promotion_active') {
      return jsonResponse_(setPromotionActiveWeb_(payload.id || payload.promotionId, payload.active));
    }

    if (action === 'delete_promotion') {
      return jsonResponse_(deletePromotionWeb_(payload.id || payload.promotionId));
    }

    if (action === 'add_audit_log') {
      return jsonResponse_(addAuditLogWeb_(payload.log || payload));
    }

    if (action === 'support_overview') {
      return jsonResponse_(getSupportOverviewWeb_(payload));
    }

    if (action === 'support_thread') {
      return jsonResponse_(getSupportThreadWeb_(payload.ticketId || payload.ticket_id));
    }

    if (action === 'support_create_ticket') {
      return jsonResponse_(createSupportTicketWeb_(payload));
    }

    if (action === 'support_send_message') {
      return jsonResponse_(sendSupportMessageWeb_(payload));
    }

    if (action === 'support_set_status') {
      return jsonResponse_(setSupportTicketStatusWeb_(payload.ticketId || payload.ticket_id, payload.status));
    }

    if (action === 'support_mark_read') {
      return jsonResponse_(markSupportTicketReadWeb_(payload.ticketId || payload.ticket_id, payload.readerScope || payload.reader_scope));
    }

    if (action === 'decrement_stock') {
      var sheet = getInventorySheet_();
      var salesItems = payload.items;
      if (!Array.isArray(salesItems) || !salesItems.length) {
        throw new Error('No se recibieron items para descontar stock.');
      }

      decrementStock_(sheet, salesItems);
      return jsonResponse_({
        ok: true,
        action: 'decrement_stock',
        updated_at: new Date().toISOString(),
        total: readInventoryItems_(sheet).length,
        items: readInventoryItems_(sheet)
      });
    }

    if (action === 'receive_order') {
      var sheet = getInventorySheet_();
      var receivedItems = payload.items;
      if (!Array.isArray(receivedItems) || !receivedItems.length) {
        throw new Error('No se recibieron items para ingresar al inventario.');
      }

      receiveOrder_(sheet, receivedItems);
      return jsonResponse_({
        ok: true,
        action: 'receive_order',
        updated_at: new Date().toISOString(),
        total: readInventoryItems_(sheet).length,
        items: readInventoryItems_(sheet)
      });
    }

    if (action === 'bulk_upsert') {
      var sheet = getInventorySheet_();
      var importItems = payload.items;
      if (!Array.isArray(importItems) || !importItems.length) {
        throw new Error('No se recibieron items para importar.');
      }

      var summary = bulkUpsertInventoryItems_(sheet, importItems);
      return jsonResponse_({
        ok: true,
        action: 'bulk_upsert',
        updated_at: new Date().toISOString(),
        summary: summary,
        total: readInventoryItems_(sheet).length,
        items: readInventoryItems_(sheet)
      });
    }

    if (action === 'register_sale') {
      var salesSheet = getSalesSheet_();
      var sale = normalizeIncomingSale_(payload.sale || payload);
      if (!Array.isArray(sale.items) || !sale.items.length) {
        throw new Error('La venta debe contener al menos un item.');
      }

      var savedSale = appendSale_(salesSheet, sale);
      var sales = readSalesItems_(salesSheet);
      return jsonResponse_({
        ok: true,
        action: 'register_sale',
        updated_at: new Date().toISOString(),
        sale: savedSale,
        total: sales.length,
        sales: sales
      });
    }

    if (action === 'anular') {
      return jsonResponse_(annulSaleWeb_(payload));
    }

    if (action === 'update_delivery_order_status') {
      return jsonResponse_(updateDeliveryOrderStatusWeb_(payload.id || payload.saleId || payload.sale_id, payload.status || payload.estado));
    }

    if (action === 'register_withdrawal') {
      var withdrawalsSheet = getWithdrawalsSheet_();
      var usersSheet = getUsersSheet_();
      var withdrawal = normalizeIncomingWithdrawal_(payload.withdrawal || payload);
      var supervisorAuth = authenticateUser_(usersSheet, {
        username: payload.supervisor_username || payload.supervisorUsername || '',
        password: payload.supervisor_password || payload.supervisorPassword || ''
      });

      if (!supervisorAuth.ok || !supervisorAuth.user) {
        throw new Error('No fue posible validar al supervisor.');
      }

      if (supervisorAuth.user.role !== 'admin' && supervisorAuth.user.role !== 'supervisor') {
        throw new Error('Solo un administrador o supervisor puede autorizar retiros.');
      }

      withdrawal.supervisorUsername = supervisorAuth.user.username;
      withdrawal.supervisorName = supervisorAuth.user.name;

      var savedWithdrawal = appendWithdrawal_(withdrawalsSheet, withdrawal);
      var withdrawals = readWithdrawalItems_(withdrawalsSheet);
      return jsonResponse_({
        ok: true,
        action: 'register_withdrawal',
        updated_at: new Date().toISOString(),
        withdrawal: savedWithdrawal,
        total: withdrawals.length,
        withdrawals: withdrawals
      });
    }

    if (action === 'update_withdrawal') {
      var updateWithdrawalsSheet = getWithdrawalsSheet_();
      var updateUsersSheet = getUsersSheet_();
      var updateWithdrawal = normalizeIncomingWithdrawal_(payload.withdrawal || payload);
      var updateSupervisorAuth = authenticateUser_(updateUsersSheet, {
        username: payload.supervisor_username || payload.supervisorUsername || '',
        password: payload.supervisor_password || payload.supervisorPassword || ''
      });

      if (!updateSupervisorAuth.ok || !updateSupervisorAuth.user) {
        throw new Error('No fue posible validar al supervisor.');
      }

      if (updateSupervisorAuth.user.role !== 'admin' && updateSupervisorAuth.user.role !== 'supervisor') {
        throw new Error('Solo un administrador o supervisor puede autorizar cambios en retiros.');
      }

      updateWithdrawal.supervisorUsername = updateSupervisorAuth.user.username;
      updateWithdrawal.supervisorName = updateSupervisorAuth.user.name;

      var updatedWithdrawal = updateWithdrawal_(updateWithdrawalsSheet, updateWithdrawal);
      var updatedWithdrawals = readWithdrawalItems_(updateWithdrawalsSheet);
      return jsonResponse_({
        ok: true,
        action: 'update_withdrawal',
        updated_at: new Date().toISOString(),
        withdrawal: updatedWithdrawal,
        total: updatedWithdrawals.length,
        withdrawals: updatedWithdrawals
      });
    }

    if (action === 'delete_withdrawal') {
      var deleteWithdrawalsSheet = getWithdrawalsSheet_();
      var deletedWithdrawal = deleteWithdrawal_(deleteWithdrawalsSheet, payload.withdrawal_id || payload.withdrawalId || payload.id || '');
      var remainingWithdrawals = readWithdrawalItems_(deleteWithdrawalsSheet);
      return jsonResponse_({
        ok: true,
        action: 'delete_withdrawal',
        updated_at: new Date().toISOString(),
        withdrawal: deletedWithdrawal,
        total: remainingWithdrawals.length,
        withdrawals: remainingWithdrawals
      });
    }

    if (action === 'register_cash_closure') {
      var cashClosuresSheet = getCashClosuresSheet_();
      var cashClosure = normalizeIncomingCashClosure_(payload.closure || payload);
      var savedCashClosure = appendCashClosure_(cashClosuresSheet, cashClosure);
      var cashClosures = readCashClosureItems_(cashClosuresSheet);
      return jsonResponse_({
        ok: true,
        action: 'register_cash_closure',
        updated_at: new Date().toISOString(),
        closure: savedCashClosure,
        total: cashClosures.length,
        closures: cashClosures
      });
    }

    if (action === 'update_cash_closure') {
      var cashClosuresSheet = getCashClosuresSheet_();
      var cashClosure = normalizeIncomingCashClosure_(payload.closure || payload);
      var updatedCashClosure = updateCashClosure_(cashClosuresSheet, cashClosure);
      var cashClosures = readCashClosureItems_(cashClosuresSheet);
      return jsonResponse_({
        ok: true,
        action: 'update_cash_closure',
        updated_at: new Date().toISOString(),
        closure: updatedCashClosure,
        total: cashClosures.length,
        closures: cashClosures
      });
    }

    if (action === 'delete_cash_closure') {
      var cashClosuresSheet = getCashClosuresSheet_();
      var deletedCashClosure = deleteCashClosure_(cashClosuresSheet, payload.closure_id || payload.closureId || payload.id || '');
      var cashClosures = readCashClosureItems_(cashClosuresSheet);
      return jsonResponse_({
        ok: true,
        action: 'delete_cash_closure',
        updated_at: new Date().toISOString(),
        closure: deletedCashClosure,
        total: cashClosures.length,
        closures: cashClosures
      });
    }

    if (action !== 'upsert') {
      throw new Error('Acción no soportada: ' + action);
    }

    var sheet = getInventorySheet_();
    var product = normalizeIncomingItem_(payload.item || payload);
    if (!product.nombre) throw new Error('El nombre del producto es obligatorio.');
    if (!product.sku) {
      product.sku = getNextInventorySku_(sheet);
    }
    if (!product.sku) throw new Error('El SKU del producto es obligatorio.');

    var saved = upsertInventoryItem_(sheet, product);
    var items = readInventoryItems_(sheet);

    return jsonResponse_({
      ok: true,
      action: 'upsert',
      updated_at: new Date().toISOString(),
      item: saved,
      total: items.length,
      items: items
    });
  } catch (error) {
    logError_('doPost', error);
    return jsonResponse_({
      ok: false,
      where: 'doPost',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function debugInfo_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet ? spreadsheet.getSheetByName(SHEET_NAME) : null;
  var allSheetNames = spreadsheet ? spreadsheet.getSheets().map(function(item) { return item.getName(); }) : [];
  var headers = [];
  var rowCount = 0;

  if (sheet) {
    rowCount = sheet.getLastRow();
    if (rowCount > 0) {
      headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), REQUIRED_HEADERS.length)).getValues()[0];
    }
  }

  return {
    ok: true,
    mode: 'debug',
    timestamp: new Date().toISOString(),
    spreadsheet_name: spreadsheet ? spreadsheet.getName() : null,
    spreadsheet_id: spreadsheet ? spreadsheet.getId() : null,
    target_sheet: SHEET_NAME,
    target_sheet_exists: !!sheet,
    available_sheets: allSheetNames,
    last_row: rowCount,
    last_column: sheet ? sheet.getLastColumn() : 0,
    headers: headers,
    required_headers: REQUIRED_HEADERS
  };
}

function getInventorySheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No se pudo abrir la hoja de cálculo activa.');
  }

  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('No existe la hoja "' + SHEET_NAME + '". Hojas disponibles: ' + spreadsheet.getSheets().map(function(item) {
      return item.getName();
    }).join(', '));
  }

  ensureHeaders_(sheet);
  return sheet;
}

function getSalesSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No se pudo abrir la hoja de cálculo activa.');
  }

  var sheet = spreadsheet.getSheetByName(SALES_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SALES_SHEET_NAME);
  }

  ensureSalesHeaders_(sheet);
  return sheet;
}

function getUsersSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No se pudo abrir la hoja de cálculo activa.');
  }

  var sheet = spreadsheet.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(USERS_SHEET_NAME);
  }

  ensureUsersHeaders_(sheet);
  return sheet;
}

function getWithdrawalsSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No se pudo abrir la hoja de cálculo activa.');
  }

  var sheet = spreadsheet.getSheetByName(WITHDRAWALS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(WITHDRAWALS_SHEET_NAME);
  }

  ensureWithdrawalsHeaders_(sheet);
  return sheet;
}

function getCashClosuresSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No se pudo abrir la hoja de cálculo activa.');
  }

  var sheet = null;
  for (var i = 0; i < CASH_CLOSURES_SHEET_CANDIDATES.length; i += 1) {
    sheet = spreadsheet.getSheetByName(CASH_CLOSURES_SHEET_CANDIDATES[i]);
    if (sheet) break;
  }

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CASH_CLOSURES_SHEET_CANDIDATES[0]);
  }

  ensureCashClosuresHeaders_(sheet);
  return sheet;
}

function getSettingsSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No se pudo abrir la hoja de cálculo activa.');
  }

  var sheet = spreadsheet.getSheetByName(SETTINGS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SETTINGS_SHEET_NAME);
  }

  ensureSettingsHeaders_(sheet);
  return sheet;
}

function getClientsSheet_() {
  return getOrCreateSheet_(CLIENTS_SHEET_NAME, CLIENT_HEADERS);
}

function getSuppliersSheet_() {
  return getOrCreateSheet_(SUPPLIERS_SHEET_NAME, SUPPLIER_HEADERS);
}

function getPurchasesSheet_() {
  return getOrCreateSheet_(PURCHASES_SHEET_NAME, PURCHASE_HEADERS);
}

function getReturnsSheet_() {
  return getOrCreateSheet_(RETURNS_SHEET_NAME, RETURN_HEADERS);
}

function getPromotionsSheet_() {
  return getOrCreateSheet_(PROMOTIONS_SHEET_NAME, PROMOTION_HEADERS);
}

function getAuditLogsSheet_() {
  var sheet = getOrCreateSheet_(AUDIT_LOGS_SHEET_NAME, AUDIT_LOG_HEADERS, ensureAuditLogHeaders_);
  return sheet;
}

function ensureHeaders_(sheet) {
  var lastColumn = Math.max(sheet.getLastColumn(), REQUIRED_HEADERS.length);
  var existingHeaders = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  var isEmptySheet = sheet.getLastRow() === 0;

  if (isEmptySheet) {
    sheet.getRange(1, 1, 1, REQUIRED_HEADERS.length).setValues([REQUIRED_HEADERS]);
    return;
  }

  var existingTrimmed = existingHeaders.map(function(header) {
    return String(header || '').trim();
  }).filter(function(header) {
    return header !== '';
  });

  var legacyInventoryHeaders = ['id', 'sku', 'nombre', 'categoria', 'precio', 'stock', 'lote', 'fecha_vencimiento', 'laboratorio', 'codigo_barras', 'descripcion', 'imagen_url', 'activo'];
  var legacyMatches = existingTrimmed.length === legacyInventoryHeaders.length;

  if (legacyMatches) {
    for (var legacyIndex = 0; legacyIndex < legacyInventoryHeaders.length; legacyIndex += 1) {
      if (existingTrimmed[legacyIndex] !== legacyInventoryHeaders[legacyIndex]) {
        legacyMatches = false;
        break;
      }
    }
  }

  if (legacyMatches) {
    sheet.getRange(1, 1, 1, REQUIRED_HEADERS.length).setValues([REQUIRED_HEADERS]);
    return;
  }

  for (var i = 0; i < REQUIRED_HEADERS.length; i += 1) {
    if (String(existingHeaders[i] || '').trim() !== REQUIRED_HEADERS[i]) {
      throw new Error('La fila de encabezados no coincide con el formato esperado. Debe ser: ' + REQUIRED_HEADERS.join(', '));
    }
  }
}

function ensureSalesHeaders_(sheet) {
  var lastColumn = Math.max(sheet.getLastColumn(), SALES_HEADERS.length);
  var existingHeaders = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  var isEmptySheet = sheet.getLastRow() === 0;

  if (isEmptySheet) {
    sheet.getRange(1, 1, 1, SALES_HEADERS.length).setValues([SALES_HEADERS]);
    return;
  }

  var legacyMatches = true;
  for (var j = 0; j < LEGACY_SALES_HEADERS.length; j += 1) {
    if (String(existingHeaders[j] || '').trim() !== LEGACY_SALES_HEADERS[j]) {
      legacyMatches = false;
      break;
    }
  }

  if (legacyMatches) {
    for (var k = LEGACY_SALES_HEADERS.length; k < SALES_HEADERS.length; k += 1) {
      sheet.getRange(1, k + 1).setValue(SALES_HEADERS[k]);
    }
    return;
  }

  for (var i = 0; i < SALES_HEADERS.length; i += 1) {
    if (String(existingHeaders[i] || '').trim() !== SALES_HEADERS[i]) {
      throw new Error('La fila de encabezados de ventas no coincide con el formato esperado. Debe ser: ' + SALES_HEADERS.join(', '));
    }
  }
}

function ensureUsersHeaders_(sheet) {
  var lastColumn = Math.max(sheet.getLastColumn(), WEB_USER_HEADERS.length);
  var existingHeaders = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  var isEmptySheet = sheet.getLastRow() === 0;

  if (isEmptySheet) {
    sheet.getRange(1, 1, 1, WEB_USER_HEADERS.length).setValues([WEB_USER_HEADERS]);
    return;
  }

  var legacyMatches = true;
  for (var j = 0; j < LEGACY_USER_HEADERS.length; j += 1) {
    if (normalizeHeaderKey_(existingHeaders[j]) !== normalizeHeaderKey_(LEGACY_USER_HEADERS[j])) {
      legacyMatches = false;
      break;
    }
  }

  if (legacyMatches) {
    var upgrades = ['EmpresaId', 'Rol', 'CreadoEn'];
    for (var k = 0; k < upgrades.length; k += 1) {
      sheet.getRange(1, LEGACY_USER_HEADERS.length + k + 1).setValue(upgrades[k]);
    }
    return;
  }

  var compatibleUserHeaders = [
    'Id',
    'EmpresaId',
    'Nombre',
    'Usuario',
    'contraseña',
    'Rol',
    'Estado',
    'CreadoEn'
  ];
  var compatibleMatches = true;
  for (var headerIndex = 0; headerIndex < compatibleUserHeaders.length; headerIndex += 1) {
    if (normalizeHeaderKey_(existingHeaders[headerIndex]) !== normalizeHeaderKey_(compatibleUserHeaders[headerIndex])) {
      compatibleMatches = false;
      break;
    }
  }

  if (compatibleMatches) {
    sheet.getRange(1, 5).setValue('contrasena');
    return;
  }

  for (var i = 0; i < WEB_USER_HEADERS.length; i += 1) {
    if (normalizeHeaderKey_(existingHeaders[i]) !== normalizeHeaderKey_(WEB_USER_HEADERS[i])) {
      throw new Error('La fila de encabezados de usuarios no coincide con el formato esperado. Debe ser: ' + WEB_USER_HEADERS.join(', '));
    }
  }
}

function ensureWithdrawalsHeaders_(sheet) {
  var lastColumn = Math.max(sheet.getLastColumn(), WITHDRAWALS_HEADERS.length);
  var existingHeaders = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  var isEmptySheet = sheet.getLastRow() === 0;

  if (isEmptySheet) {
    sheet.getRange(1, 1, 1, WITHDRAWALS_HEADERS.length).setValues([WITHDRAWALS_HEADERS]);
    return;
  }

  for (var i = 0; i < WITHDRAWALS_HEADERS.length; i += 1) {
    if (normalizeHeaderKey_(existingHeaders[i]) !== normalizeHeaderKey_(WITHDRAWALS_HEADERS[i])) {
      throw new Error('La fila de encabezados de retiros no coincide con el formato esperado. Debe ser: ' + WITHDRAWALS_HEADERS.join(', '));
    }
  }
}

function normalizeHeaderKey_(value) {
  return String(value || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseNumber_(value, fallback) {
  if (typeof value === 'number') {
    return isFinite(value) ? value : (fallback || 0);
  }
  if (value == null) return fallback || 0;

  var text = String(value).trim();
  if (!text) return fallback || 0;

  var cleaned = text.replace(/[^\d,.-]/g, '');
  if (!cleaned) return fallback || 0;

  var hasComma = cleaned.indexOf(',') !== -1;
  var hasDot = cleaned.indexOf('.') !== -1;
  var normalized = cleaned;

  if (hasComma && hasDot) {
    normalized = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '');
  } else if (hasComma) {
    normalized = /^-?\d{1,3}(,\d{3})+$/.test(cleaned)
      ? cleaned.replace(/,/g, '')
      : cleaned.replace(',', '.');
  } else if (hasDot && /^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '');
  }

  var parsed = Number(normalized);
  return isFinite(parsed) ? parsed : (fallback || 0);
}

function ensureCashClosuresHeaders_(sheet) {
  var lastColumn = Math.max(sheet.getLastColumn(), CASH_CLOSURES_HEADERS.length);
  var existingHeaders = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  var isEmptySheet = sheet.getLastRow() === 0;

  if (isEmptySheet) {
    sheet.getRange(1, 1, 1, CASH_CLOSURES_HEADERS.length).setValues([CASH_CLOSURES_HEADERS]);
    return;
  }

  for (var i = 0; i < CASH_CLOSURES_HEADERS.length; i += 1) {
    if (String(existingHeaders[i] || '').trim() !== CASH_CLOSURES_HEADERS[i]) {
      throw new Error('La fila de encabezados de cierres no coincide con el formato esperado. Debe ser: ' + CASH_CLOSURES_HEADERS.join(', '));
    }
  }
}

function ensureSettingsHeaders_(sheet) {
  var lastColumn = Math.max(sheet.getLastColumn(), SETTINGS_HEADERS.length);
  var existingHeaders = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  var isEmptySheet = sheet.getLastRow() === 0;

  if (isEmptySheet) {
    sheet.getRange(1, 1, 1, SETTINGS_HEADERS.length).setValues([SETTINGS_HEADERS]);
    return;
  }

  for (var i = 0; i < SETTINGS_HEADERS.length; i += 1) {
    if (String(existingHeaders[i] || '').trim() !== SETTINGS_HEADERS[i]) {
      throw new Error('La fila de encabezados de configuración no coincide con el formato esperado. Debe ser: ' + SETTINGS_HEADERS.join(', '));
    }
  }
}

function readInventoryItems_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });

  return values.slice(1)
    .filter(function(row) {
      return row.some(function(cell) {
        return String(cell).trim() !== '';
      });
    })
    .map(function(row) {
      var item = rowToItem_(headers, row);
      return normalizeStoredItem_(item);
    });
}

function readSalesItems_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });

  return values.slice(1)
    .filter(function(row) {
      return row.some(function(cell) {
        return String(cell).trim() !== '';
      });
    })
    .map(function(row) {
      return normalizeStoredSale_(rowToItem_(headers, row));
    });
}

function readWithdrawalItems_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });

  return values.slice(1)
    .filter(function(row) {
      return row.some(function(cell) {
        return String(cell).trim() !== '';
      });
    })
    .map(function(row) {
      return normalizeStoredWithdrawal_(rowToItem_(headers, row));
    });
}

function readCashClosureItems_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });

  return values.slice(1)
    .filter(function(row) {
      return row.some(function(cell) {
        return String(cell).trim() !== '';
      });
    })
    .map(function(row) {
      return normalizeStoredCashClosure_(rowToItem_(headers, row));
    });
}

function rowToItem_(headers, row) {
  var item = {};
  headers.forEach(function(header, index) {
    item[header] = row[index];
  });
  return item;
}

function normalizeStoredItem_(item) {
  return {
    id: String(item.id || '').trim(),
    sku: String(item.sku || '').trim(),
    nombre: String(item.nombre || '').trim(),
    categoria: String(item.categoria || '').trim().toLowerCase(),
    precio: parseNumber_(item.precio, 0),
    stock: parseNumber_(item.stock, 0),
    lote: String(item.lote || '').trim(),
    fecha_vencimiento: normalizeDateValue_(item.fecha_vencimiento),
    laboratorio: String(item.laboratorio || '').trim(),
    registro_invima: String(item.registro_invima || '').trim(),
    codigo_barras: String(item.codigo_barras || '').trim(),
    descripcion: String(item.descripcion || '').trim(),
    imagen_url: String(item.imagen_url || '').trim(),
    activo: String(item.activo || 'SI').trim().toUpperCase()
  };
}

function normalizeIncomingItem_(item) {
  var normalized = {
    id: String(item.id || '').trim(),
    sku: String(item.sku || '').trim(),
    nombre: String(item.nombre || item.name || '').trim(),
    categoria: String(item.categoria || item.category || 'general').trim().toLowerCase(),
    precio: parseNumber_(item.precio != null ? item.precio : item.price || 0, 0),
    stock: parseNumber_(item.stock != null ? item.stock : 0, 0),
    lote: String(item.lote || item.batch || '').trim(),
    fecha_vencimiento: normalizeDateValue_(item.fecha_vencimiento || item.expirationDate || item.expiration_date || ''),
    laboratorio: String(item.laboratorio || item.lab || '').trim(),
    registro_invima: String(item.registro_invima || item.invima || item.registroInvima || '').trim(),
    codigo_barras: String(item.codigo_barras || item.barcode || '').trim(),
    descripcion: String(item.descripcion || item.description || '').trim(),
    imagen_url: String(item.imagen_url || item.image_url || item.imageUrl || item.imagen || item.image || item.foto || '').trim(),
    activo: String(item.activo || item.active || 'SI').trim().toUpperCase()
  };

  if (!normalized.id) {
    normalized.id = normalized.nombre || normalized.sku;
  }

  if (!isFinite(normalized.precio)) normalized.precio = 0;
  if (!isFinite(normalized.stock)) normalized.stock = 0;
  if (normalized.activo !== 'NO') normalized.activo = 'SI';

  return normalized;
}

function getNextInventorySku_(sheet) {
  var items = readInventoryItems_(sheet);
  var maxNumber = 0;

  for (var i = 0; i < items.length; i += 1) {
    var sku = String(items[i].sku || '').trim().toUpperCase();
    var match = sku.match(/^NBM_(\d+)$/);
    if (match) {
      var number = Number(match[1]);
      if (isFinite(number) && number > maxNumber) {
        maxNumber = number;
      }
    }
  }

  return 'NBM_' + String(maxNumber + 1).padStart(2, '0');
}

function normalizeStoredSale_(sale) {
  var items = [];
  try {
    items = JSON.parse(String(sale.items_json || '[]'));
  } catch (error) {
    items = [];
  }

  return {
    id: String(sale.id || '').trim(),
    ticketNumber: String(sale.ticket_numero || '').trim(),
    clientName: String(sale.cliente_nombre || 'Cliente general').trim(),
    clientDocument: String(sale.cliente_documento || '').trim(),
    date: String(sale.fecha || '').trim(),
    time: String(sale.hora || '').trim(),
    paymentMethod: String(sale.metodo_pago || 'Efectivo').trim(),
    cashReceived: Number(sale.recibido || 0),
    change: Number(sale.cambio || 0),
    subtotal: Number(sale.subtotal || 0),
    tax: Number(sale.impuesto || 0),
    total: Number(sale.total || 0),
    redeemedPoints: Number(sale.puntos_usados || 0),
    loyaltyDiscount: Number(sale.descuento_puntos || 0),
    earnedPoints: Number(sale.puntos_ganados || 0),
    status: String(sale.estado || 'ACTIVA').trim().toUpperCase() === 'ANULADA' ? 'ANULADA' : 'ACTIVA',
    annulledAt: String(sale.anulado_en || '').trim(),
    annulledBy: String(sale.anulado_por || '').trim(),
    annulledReason: String(sale.motivo_anulacion || '').trim(),
    deliveryStatus: String(sale.domicilio_estado || '').trim(),
    deliveryUpdatedAt: String(sale.domicilio_actualizado_en || '').trim(),
    items: Array.isArray(items) ? items : []
  };
}

function normalizeStoredWithdrawal_(withdrawal) {
  return {
    id: String(withdrawal.id || '').trim(),
    withdrawalNumber: String(withdrawal.retiro_numero || '').trim(),
    date: normalizeSalesDateValue_(withdrawal.fecha || ''),
    time: normalizeTimeValue_(withdrawal.hora || ''),
    amount: Number(withdrawal.monto || 0),
    reason: String(withdrawal.motivo || '').trim(),
    cashierUsername: String(withdrawal.cajero_usuario || '').trim(),
    cashierName: String(withdrawal.cajero_nombre || '').trim(),
    supervisorUsername: String(withdrawal.supervisor_usuario || '').trim(),
    supervisorName: String(withdrawal.supervisor_nombre || '').trim(),
    createdAt: String(withdrawal.creado_en || '').trim()
  };
}

function normalizeStoredCashClosure_(closure) {
  var sales = [];
  try {
    sales = JSON.parse(String(closure.ventas_json || '[]'));
  } catch (error) {
    sales = [];
  }

  return {
    id: String(closure.id || '').trim(),
    closureNumber: String(closure.cierre_numero || '').trim(),
    date: normalizeSalesDateValue_(closure.fecha || ''),
    createdAt: String(closure.creado_en || '').trim(),
    user: String(closure.usuario || '').trim(),
    openingAmount: Number(closure.apertura || 0),
    cashSales: Number(closure.ventas_efectivo || 0),
    cardSales: Number(closure.ventas_tarjeta || 0),
    transferSales: Number(closure.ventas_transferencia || 0),
    withdrawalsTotal: Number(closure.retiros_total || 0),
    expenses: Number(closure.ajuste_manual || 0),
    countedCash: Number(closure.efectivo_contado || 0),
    expectedDrawer: Number(closure.efectivo_esperado || 0),
    difference: Number(closure.diferencia || 0),
    transactions: Number(closure.transacciones || 0),
    totalSales: Number(closure.ventas_total || 0),
    units: Number(closure.unidades || 0),
    observations: String(closure.observaciones || '').trim(),
    sales: Array.isArray(sales) ? sales : []
  };
}

function normalizeIncomingSale_(sale) {
  var now = new Date();
  var dateText = normalizeSalesDateValue_(sale.date || '');
  var timeText = String(sale.time || '').trim();

  return {
    id: String(sale.id || Utilities.getUuid()).trim(),
    ticketNumber: String(sale.ticketNumber || '').trim(),
    clientName: String(sale.clientName || 'Cliente general').trim(),
    clientDocument: String(sale.clientDocument || '').trim(),
    date: dateText || Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    time: timeText || Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm'),
    paymentMethod: String(sale.paymentMethod || 'Efectivo').trim(),
    cashReceived: Number(sale.cashReceived || 0),
    change: Number(sale.change || 0),
    subtotal: Number(sale.subtotal || 0),
    tax: Number(sale.tax || 0),
    total: Number(sale.total || 0),
    redeemedPoints: Number(sale.redeemedPoints || sale.pointsUsed || 0),
    loyaltyDiscount: Number(sale.loyaltyDiscount || sale.discountFromPoints || 0),
    earnedPoints: Number(sale.earnedPoints || 0),
    status: String(sale.status || sale.estado || 'ACTIVA').trim().toUpperCase() === 'ANULADA' ? 'ANULADA' : 'ACTIVA',
    annulledAt: String(sale.annulledAt || sale.anulado_en || '').trim(),
    annulledBy: String(sale.annulledBy || sale.anulado_por || '').trim(),
    annulledReason: String(sale.annulledReason || sale.motivo_anulacion || '').trim(),
    deliveryStatus: normalizeDeliveryStatus_(sale.deliveryStatus || sale.domicilio_estado || ''),
    deliveryUpdatedAt: String(sale.deliveryUpdatedAt || sale.domicilio_actualizado_en || '').trim(),
    items: Array.isArray(sale.items) ? sale.items : []
  };
}

function normalizeIncomingWithdrawal_(withdrawal) {
  var now = new Date();
  var dateText = normalizeSalesDateValue_(withdrawal.date || '');
  var timeText = normalizeTimeValue_(withdrawal.time || '');

  return {
    id: String(withdrawal.id || Utilities.getUuid()).trim(),
    withdrawalNumber: String(withdrawal.withdrawalNumber || '').trim(),
    date: dateText || Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    time: timeText || Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm'),
    amount: Number(withdrawal.amount || 0),
    reason: String(withdrawal.reason || '').trim(),
    cashierUsername: String(withdrawal.cashierUsername || '').trim(),
    cashierName: String(withdrawal.cashierName || '').trim(),
    supervisorUsername: String(withdrawal.supervisorUsername || '').trim(),
    supervisorName: String(withdrawal.supervisorName || '').trim(),
    createdAt: String(withdrawal.createdAt || now.toISOString()).trim()
  };
}

function normalizeTimeValue_(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  }

  var text = String(value).trim();
  if (!text) return '';

  var shortMatch = text.match(/^(\d{1,2}):(\d{2})/);
  if (shortMatch) {
    return ('0' + shortMatch[1]).slice(-2) + ':' + shortMatch[2];
  }

  var parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'HH:mm');
  }

  return text;
}

function normalizeIncomingCashClosure_(closure) {
  var now = new Date();
  var normalized = {
    id: String(closure.id || Utilities.getUuid()).trim(),
    closureNumber: String(closure.closureNumber || closure.cierre_numero || '').trim(),
    date: normalizeSalesDateValue_(closure.date || closure.fecha || '') || Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    createdAt: String(closure.createdAt || closure.creado_en || now.toISOString()).trim(),
    user: String(closure.user || closure.usuario || '').trim(),
    openingAmount: Number(closure.openingAmount || closure.apertura || 0),
    cashSales: Number(closure.cashSales || closure.ventas_efectivo || 0),
    cardSales: Number(closure.cardSales || closure.ventas_tarjeta || 0),
    transferSales: Number(closure.transferSales || closure.ventas_transferencia || 0),
    withdrawalsTotal: Number(closure.withdrawalsTotal || closure.retiros_total || 0),
    expenses: Number(closure.expenses || closure.ajuste_manual || 0),
    countedCash: Number(closure.countedCash || closure.efectivo_contado || 0),
    expectedDrawer: Number(closure.expectedDrawer || closure.efectivo_esperado || 0),
    difference: Number(closure.difference || closure.diferencia || 0),
    transactions: Number(closure.transactions || closure.transacciones || 0),
    totalSales: Number(closure.totalSales || closure.ventas_total || 0),
    units: Number(closure.units || closure.unidades || 0),
    observations: String(closure.observations || closure.observaciones || '').trim(),
    sales: Array.isArray(closure.sales) ? closure.sales : []
  };

  if (!normalized.closureNumber) {
    normalized.closureNumber = 'C-' + ('0000' + Math.max(1, 1)).slice(-4);
  }

  return normalized;
}

function normalizeCompanyProfile_(profile) {
  return {
    name: String(profile.name || '').trim(),
    nit: String(profile.nit || '').trim(),
    phone: String(profile.phone || '').trim(),
    email: String(profile.email || '').trim(),
    address: String(profile.address || '').trim(),
    city: String(profile.city || '').trim(),
    manager: String(profile.manager || '').trim(),
    logo_url: String(profile.logo_url || profile.logoUrl || '').trim()
  };
}

function readCompanyProfile_(sheet) {
  var values = sheet.getDataRange().getValues();
  var profile = normalizeCompanyProfile_({});

  if (values.length < 2) {
    return profile;
  }

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var key = String(values[rowIndex][0] || '').trim();
    if (!key || COMPANY_PROFILE_KEYS.indexOf(key) === -1) continue;
    profile[key] = String(values[rowIndex][1] || '').trim();
  }

  return profile;
}

function saveCompanyProfile_(sheet, profile) {
  var normalized = normalizeCompanyProfile_(profile);
  var rows = [SETTINGS_HEADERS];

  COMPANY_PROFILE_KEYS.forEach(function(key) {
    rows.push([key, normalized[key] || '']);
  });

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, SETTINGS_HEADERS.length).setValues(rows);
  return normalized;
}

function hashPasswordWeb_(password) {
  var normalizedPassword = String(password || '').trim();
  if (!normalizedPassword) return '';
  var iterations = 8000;
  var salt = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  var hash = sha256Hex_(salt + '|' + normalizedPassword);
  for (var i = 1; i < iterations; i += 1) {
    hash = sha256Hex_(hash + '|' + salt);
  }
  return 'sha256$' + iterations + '$' + salt + '$' + hash;
}

function verifyPasswordWeb_(password, storedPassword) {
  var normalizedPassword = String(password || '').trim();
  var currentHash = String(storedPassword || '').trim();
  if (!normalizedPassword || !currentHash) {
    return { ok: false, needsRehash: false };
  }

  if (currentHash.indexOf('sha256$') === 0) {
    var parts = currentHash.split('$');
    if (parts.length === 4) {
      var iterations = Math.max(1, Number(parts[1] || 1));
      var salt = String(parts[2] || '');
      var hash = sha256Hex_(salt + '|' + normalizedPassword);
      for (var i = 1; i < iterations; i += 1) {
        hash = sha256Hex_(hash + '|' + salt);
      }
      return { ok: hash === String(parts[3] || ''), needsRehash: false };
    }
  }

  var legacySha256 = sha256Hex_(normalizedPassword);
  var isLegacyMatch = currentHash === normalizedPassword || currentHash === legacySha256;
  return { ok: isLegacyMatch, needsRehash: isLegacyMatch };
}

function sha256Hex_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''), Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < bytes.length; i += 1) {
    var byte = bytes[i];
    if (byte < 0) byte += 256;
    var current = byte.toString(16);
    if (current.length === 1) current = '0' + current;
    hex += current;
  }
  return hex;
}

function isStrongPasswordWeb_(password) {
  var value = String(password || '');
  return value.length >= 10
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value);
}

function getPasswordResetPropertyKey_(username) {
  return 'password_reset_' + sha256Hex_(String(username || '').trim().toLowerCase()).slice(0, 32);
}

function getLoginAttemptPropertyKey_(username) {
  return 'login_attempt_' + sha256Hex_(String(username || '').trim().toLowerCase()).slice(0, 32);
}

function getUserRowByUsername_(sheet, username) {
  var normalizedUsername = String(username || '').trim().toLowerCase();
  if (!normalizedUsername) return null;
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;
  var headers = values[0].map(function(header) {
    return String(header).trim();
  });

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var user = rowToItem_(headers, values[rowIndex]);
    var storedUsername = String(getUserField_(user, ['Usuario', 'usuario', 'USUARIO', 'User', 'user', 'Login', 'login', 'Correo', 'correo', 'Email', 'email']) || '').trim().toLowerCase();
    if (storedUsername === normalizedUsername) {
      return {
        rowIndex: rowIndex + 1,
        headers: headers,
        user: user,
        username: storedUsername
      };
    }
  }
  return null;
}

function getLoginAttemptState_(username) {
  var key = getLoginAttemptPropertyKey_(username);
  var raw = PropertiesService.getScriptProperties().getProperty(key);
  if (!raw) return { key: key, count: 0, blockedUntil: 0 };
  try {
    var parsed = JSON.parse(raw);
    if (Number(parsed.blockedUntil || 0) && Date.now() > Number(parsed.blockedUntil || 0)) {
      PropertiesService.getScriptProperties().deleteProperty(key);
      return { key: key, count: 0, blockedUntil: 0 };
    }
    return {
      key: key,
      count: Number(parsed.count || 0),
      blockedUntil: Number(parsed.blockedUntil || 0)
    };
  } catch (error) {
    PropertiesService.getScriptProperties().deleteProperty(key);
    return { key: key, count: 0, blockedUntil: 0 };
  }
}

function registerLoginFailureWeb_(username) {
  var state = getLoginAttemptState_(username);
  state.count += 1;
  if (state.count >= 5) {
    state.blockedUntil = Date.now() + (10 * 60 * 1000);
  }
  PropertiesService.getScriptProperties().setProperty(state.key, JSON.stringify({
    count: state.count,
    blockedUntil: state.blockedUntil
  }));
}

function clearLoginFailureWeb_(username) {
  PropertiesService.getScriptProperties().deleteProperty(getLoginAttemptPropertyKey_(username));
}

function escapeHtmlWeb_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPasswordResetEmailHtml_(code, username, displayName) {
  var safeCode = escapeHtmlWeb_(code);
  var safeUsername = escapeHtmlWeb_(username);
  var safeName = escapeHtmlWeb_(displayName || username);
  return ''
    + '<div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">'
    + '  <div style="max-width:620px;margin:0 auto;padding:32px 16px;">'
    + '    <div style="background:#ffffff;border:1px solid #dde6f0;border-radius:14px;overflow:hidden;box-shadow:0 12px 32px rgba(15,31,55,0.10);">'
    + '      <div style="background:#0f6b63;padding:22px 28px;color:#ffffff;">'
    + '        <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">NubeFarma POS</div>'
    + '        <div style="font-size:22px;font-weight:700;margin-top:8px;">Recuperacion de contrasena</div>'
    + '      </div>'
    + '      <div style="padding:28px;">'
    + '        <p style="margin:0 0 14px;font-size:16px;line-height:1.55;">Hola ' + safeName + ',</p>'
    + '        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#42526a;">Recibimos una solicitud para crear una nueva contrasena de la cuenta <strong>' + safeUsername + '</strong>. Usa este codigo temporal en la app:</p>'
    + '        <div style="background:#eef8f6;border:1px solid #b9ddd7;border-radius:12px;padding:22px;text-align:center;margin:0 0 22px;">'
    + '          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#0f6b63;font-weight:700;margin-bottom:10px;">Codigo de verificacion</div>'
    + '          <div style="font-size:34px;line-height:1;font-weight:800;letter-spacing:0.22em;color:#102a43;">' + safeCode + '</div>'
    + '        </div>'
    + '        <div style="border-left:4px solid #f5a524;background:#fff8e8;padding:14px 16px;border-radius:8px;margin:0 0 22px;color:#5f4708;font-size:14px;line-height:1.55;">Este codigo vence en <strong>5 minutos</strong>. Si no solicitaste el cambio, puedes ignorar este correo y tu contrasena actual seguira igual.</div>'
    + '        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b778c;">Por seguridad, no compartas este codigo con nadie. El equipo de soporte nunca te pedira tu codigo ni tu contrasena.</p>'
    + '      </div>'
    + '      <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e6edf5;color:#7a869a;font-size:12px;line-height:1.5;">Mensaje automatico de NubeFarma POS. No respondas a este correo.</div>'
    + '    </div>'
    + '  </div>'
    + '</div>';
}

function requestPasswordResetWeb_(payload) {
  var username = String(payload.username || payload.usuario || '').trim().toLowerCase();
  if (!username) {
    throw new Error('Debes ingresar el correo registrado como usuario.');
  }
  if (!/@/.test(username)) {
    throw new Error('Ingresa un correo valido registrado como usuario.');
  }

  var sheet = getUsersSheet_();
  var match = getUserRowByUsername_(sheet, username);
  if (!match) {
    throw new Error('Este correo no aparece como usuario en la app.');
  }

  var active = String(getUserField_(match.user, ['Estado', 'estado', 'STATUS', 'Status', 'Activo', 'activo']) || 'Activo').trim().toUpperCase();
  if (active !== 'ACTIVO' && active !== 'SI') {
    throw new Error('Este usuario esta inactivo. No se puede enviar codigo.');
  }

  var propertyKey = getPasswordResetPropertyKey_(username);
  var existingRaw = PropertiesService.getScriptProperties().getProperty(propertyKey);
  if (existingRaw) {
    try {
      var existing = JSON.parse(existingRaw);
      if (Date.now() < Number(existing.createdAt || 0) + (3 * 60 * 1000)) {
        throw new Error('Ya se solicito un codigo hace poco. Espera unos minutos antes de pedir otro.');
      }
    } catch (error) {
      if (String(error.message || '').indexOf('Ya se solicito') === 0) throw error;
    }
  }

  var code = String(Math.floor(100000 + Math.random() * 900000));
  PropertiesService.getScriptProperties().setProperty(propertyKey, JSON.stringify({
    codeHash: sha256Hex_(code),
    createdAt: Date.now(),
    expiresAt: Date.now() + (5 * 60 * 1000),
    attempts: 0
  }));

  MailApp.sendEmail({
    to: username,
    name: 'NubeFarma POS',
    subject: 'Tu codigo de recuperacion de NubeFarma POS',
    body: 'Hola ' + String(getUserField_(match.user, ['Nombre', 'nombre', 'Name', 'name']) || username).trim() + ',\n\n'
      + 'Tu codigo temporal de recuperacion es: ' + code + '\n\n'
      + 'Vence en 5 minutos. Si no solicitaste este cambio, ignora este mensaje.\n\n'
      + 'Por seguridad, no compartas este codigo con nadie.',
    htmlBody: buildPasswordResetEmailHtml_(code, username, getUserField_(match.user, ['Nombre', 'nombre', 'Name', 'name']))
  });

  return {
    ok: true,
    action: 'request_password_reset',
    message: 'Codigo temporal enviado al correo registrado.'
  };
}

function confirmPasswordResetWeb_(payload) {
  var username = String(payload.username || payload.usuario || '').trim().toLowerCase();
  var code = String(payload.code || payload.codigo || '').trim();
  var newPassword = String(payload.newPassword || payload.password || payload.contrasena || '').trim();
  if (!username || !code || !newPassword) {
    throw new Error('Correo, codigo y nueva contrasena son requeridos.');
  }
  if (!/@/.test(username)) {
    throw new Error('Codigo invalido o vencido.');
  }
  if (!isStrongPasswordWeb_(newPassword)) {
    throw new Error('La nueva contrasena debe tener minimo 10 caracteres, mayuscula, minuscula, numero y simbolo.');
  }

  var propertyKey = getPasswordResetPropertyKey_(username);
  var raw = PropertiesService.getScriptProperties().getProperty(propertyKey);
  if (!raw) throw new Error('Codigo invalido o vencido.');
  var state = JSON.parse(raw);
  if (Date.now() > Number(state.expiresAt || 0)) {
    PropertiesService.getScriptProperties().deleteProperty(propertyKey);
    throw new Error('Codigo invalido o vencido.');
  }
  if (Number(state.attempts || 0) >= 5) {
    PropertiesService.getScriptProperties().deleteProperty(propertyKey);
    throw new Error('Demasiados intentos con el codigo. Solicita uno nuevo.');
  }
  if (sha256Hex_(code) !== String(state.codeHash || '')) {
    state.attempts = Number(state.attempts || 0) + 1;
    PropertiesService.getScriptProperties().setProperty(propertyKey, JSON.stringify(state));
    throw new Error('Codigo invalido o vencido.');
  }

  var sheet = getUsersSheet_();
  var match = getUserRowByUsername_(sheet, username);
  if (!match) throw new Error('Codigo invalido o vencido.');
  sheet.getRange(match.rowIndex, 5).setValue(hashPasswordWeb_(newPassword));
  PropertiesService.getScriptProperties().deleteProperty(propertyKey);
  clearLoginFailureWeb_(username);
  return {
    ok: true,
    action: 'confirm_password_reset',
    message: 'Contrasena actualizada correctamente.'
  };
}

function authenticateUser_(sheet, payload) {
  var username = String(payload.username || payload.usuario || '').trim().toLowerCase();
  var password = String(payload.password || payload.clave || '').trim();
  var licenseCode = String(payload.code || payload.licenseCode || '').trim();

  if (!username) {
    throw new Error('El usuario es obligatorio.');
  }
  if (!password) {
    throw new Error('La clave es obligatoria.');
  }

  var attemptState = getLoginAttemptState_(username);
  if (attemptState.blockedUntil && Date.now() < attemptState.blockedUntil) {
    throw new Error('Demasiados intentos fallidos. Espera 10 minutos antes de intentar de nuevo.');
  }

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('La hoja de usuarios no contiene registros.');
  }

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var user = rowToItem_(headers, values[rowIndex]);
    var storedUsername = String(getUserField_(user, ['Usuario', 'usuario', 'USUARIO', 'User', 'user', 'Login', 'login', 'Correo', 'correo', 'Email', 'email']) || '').trim().toLowerCase();
    var storedPassword = String(getUserField_(user, ['contrasena', 'Contraseña', 'contraseña', 'Contrasena', 'Password', 'password', 'Clave', 'clave']) || '').trim();
    var active = String(getUserField_(user, ['Estado', 'estado', 'STATUS', 'Status', 'Activo', 'activo']) || 'Activo').trim().toUpperCase();

    if (storedUsername !== username) continue;

    if (active !== 'ACTIVO' && active !== 'SI') {
      throw new Error('El usuario se encuentra inactivo.');
    }

    var passwordVerification = verifyPasswordWeb_(password, storedPassword);
    if (!passwordVerification.ok) {
      registerLoginFailureWeb_(username);
      throw new Error('Clave incorrecta.');
    }
    clearLoginFailureWeb_(username);
    if (passwordVerification.needsRehash) {
      sheet.getRange(rowIndex + 1, 5).setValue(hashPasswordWeb_(password));
    }

    var role = normalizeUserRole_(getUserRole_(user, storedUsername), storedUsername);
    var companyId = String(getUserField_(user, ['EmpresaId', 'empresa_id', 'empresaid', 'CompanyId', 'companyId', 'IdEmpresa']) || '').trim();
    var isGlobalAdmin = (role === 'admin' || role === 'operador') && !companyId;
    var license = null;

    if (!isGlobalAdmin) {
      if (!companyId) {
        throw new Error('El usuario no tiene una empresa asignada.');
      }
      if (licenseCode) {
        license = validateLicenseWeb_(licenseCode);
        if (String(license.companyId || '').trim() !== companyId) {
          throw new Error('La licencia no pertenece a la empresa del usuario.');
        }
      } else {
        license = findActiveLicenseByCompanyId_(companyId);
      }
    }

    return {
      ok: true,
      action: 'authenticate_user',
      user: {
        id: String(user.Id || '').trim(),
        companyId: companyId,
        username: storedUsername,
        name: String(user.Nombre || storedUsername).trim(),
        role: role,
        licenseCode: license ? String(license.code || '').trim() : '',
        license: license
      },
      timestamp: new Date().toISOString()
    };
  }

  throw new Error('Usuario no encontrado.');
}

function findActiveLicenseByCompanyId_(companyId) {
  var normalizedCompanyId = String(companyId || '').trim();
  if (!normalizedCompanyId) {
    throw new Error('El usuario no tiene una empresa asignada.');
  }

  var sheet = getLicensesSheet_();
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('La empresa del usuario no tiene una licencia registrada.');
  }

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });
  var hasAnyLicense = false;
  var bestLicense = null;
  var bestExpiration = 0;

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var row = values[rowIndex];
    if (String(getRowField_(headers, row, ['empresa_id', 'EmpresaId', 'companyId']) || '').trim() !== normalizedCompanyId) {
      continue;
    }

    hasAnyLicense = true;
    var license = mapLicenseWebRow_(headers, row);
    var status = String(license.status || '').trim().toUpperCase();
    if (status !== 'ACTIVA') continue;

    var expirationTime = 0;
    if (license.expiresAt) {
      var expiration = new Date(license.expiresAt);
      expirationTime = isNaN(expiration.getTime()) ? 0 : expiration.getTime();
      if (expirationTime && expirationTime < Date.now()) continue;
    }

    if (!bestLicense || expirationTime >= bestExpiration) {
      bestLicense = license;
      bestExpiration = expirationTime;
    }
  }

  if (!hasAnyLicense) {
    throw new Error('La empresa del usuario no tiene una licencia registrada.');
  }
  if (!bestLicense) {
    throw new Error('La empresa del usuario no tiene una licencia activa.');
  }

  return bestLicense;
}

function getUserField_(user, possibleKeys) {
  for (var index = 0; index < possibleKeys.length; index += 1) {
    var key = possibleKeys[index];
    if (!Object.prototype.hasOwnProperty.call(user, key)) continue;
    var value = user[key];
    if (String(value || '').trim()) return value;
  }
  return '';
}

function getRowField_(headers, row, possibleKeys) {
  for (var keyIndex = 0; keyIndex < possibleKeys.length; keyIndex += 1) {
    var expected = String(possibleKeys[keyIndex] || '').trim().toLowerCase();
    for (var headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
      if (String(headers[headerIndex] || '').trim().toLowerCase() === expected) {
        return row[headerIndex];
      }
    }
  }
  return '';
}

function mapLicenseWebRow_(headers, row) {
  return {
    id: String(getRowField_(headers, row, ['id']) || '').trim(),
    companyId: String(getRowField_(headers, row, ['empresa_id']) || '').trim(),
    code: String(getRowField_(headers, row, ['codigo_licencia']) || '').trim(),
    customerName: String(getRowField_(headers, row, ['cliente_nombre']) || '').trim(),
    customerDocument: String(getRowField_(headers, row, ['cliente_documento']) || '').trim(),
    companyName: String(getRowField_(headers, row, ['empresa_nombre']) || '').trim(),
    phone: String(getRowField_(headers, row, ['telefono']) || '').trim(),
    email: String(getRowField_(headers, row, ['email']) || '').trim(),
    installationId: String(getRowField_(headers, row, ['equipo_id']) || '').trim(),
    installationName: String(getRowField_(headers, row, ['equipo_nombre']) || '').trim(),
    plan: String(getRowField_(headers, row, ['plan']) || 'ANUAL').trim(),
    maxDevices: Number(getRowField_(headers, row, ['max_equipos']) || 1),
    activatedAt: String(getRowField_(headers, row, ['fecha_activacion']) || '').trim(),
    expiresAt: String(getRowField_(headers, row, ['fecha_vencimiento']) || '').trim(),
    status: String(getRowField_(headers, row, ['estado']) || 'ACTIVA').trim(),
    notes: String(getRowField_(headers, row, ['observaciones']) || '').trim()
  };
}

function getUserRole_(user, username) {
  var value = String(getUserField_(user, ['Rol', 'rol', 'ROLE', 'Perfil', 'perfil', 'Cargo', 'cargo', 'Tipo', 'tipo', 'Tipo usuario', 'tipo usuario', 'TipoUsuario', 'tipo_usuario', 'Permiso', 'permiso', 'Permisos', 'permisos', 'Nivel', 'nivel', 'Administrador', 'administrador', 'Admin', 'admin', 'Acceso', 'acceso']) || '').trim();
  if (value) return value;

  if (username === 'admin' || username === 'administrador') return 'admin';
  if (username === 'supervisor') return 'supervisor';
  return 'cajero';
}

function normalizeUserRole_(role, username) {
  var value = String(role || '').trim().toLowerCase();
  var normalizedUsername = String(username || '').trim().toLowerCase();
  var isGlobalAdminUser = normalizedUsername === 'admin' || normalizedUsername === 'administrador' || normalizedUsername === 'operador';

  if (!value) return 'cajero';
  if (
    value.indexOf('admin_empresa') !== -1 ||
    value.indexOf('empresa') !== -1 ||
    value.indexOf('farmacia') !== -1 ||
    value.indexOf('sucursal') !== -1 ||
    value.indexOf('negocio') !== -1 ||
    value.indexOf('local') !== -1
  ) {
    return 'admin_empresa';
  }
  if (value.indexOf('operador') !== -1) return 'operador';
  if (value.indexOf('admin') !== -1) return isGlobalAdminUser ? 'admin' : 'admin_empresa';
  if (value.indexOf('super') !== -1) return 'supervisor';
  if (value.indexOf('caj') !== -1 || value.indexOf('cash') !== -1 || value.indexOf('user') !== -1 || value.indexOf('usuario') !== -1 || value.indexOf('caja') !== -1) return 'cajero';
  return 'cajero';
}

function normalizeSalesDateValue_(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  var text = String(value).trim();
  if (!text) return '';

  var isoValue = normalizeDateValue_(text);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoValue)) {
    return isoValue;
  }

  var latinMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (latinMatch) {
    return latinMatch[3] + '-' + latinMatch[2] + '-' + latinMatch[1];
  }

  return text;
}

function upsertInventoryItem_(sheet, item) {
  var values = sheet.getDataRange().getValues();
  var headers = values.length ? values[0].map(function(header) {
    return String(header).trim();
  }) : REQUIRED_HEADERS.slice();

  var targetRowIndex = -1;
  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var current = normalizeStoredItem_(rowToItem_(headers, values[rowIndex]));
    if ((item.id && current.id === item.id) || (item.sku && current.sku === item.sku)) {
      targetRowIndex = rowIndex + 1;
      break;
    }
  }

  var rowValues = headers.map(function(header) {
    return item[header] != null ? item[header] : '';
  });

  if (targetRowIndex === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(targetRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  }

  return item;
}

function buildSaleTicketNumber_(values, saleDate) {
  var date = saleDate ? new Date(saleDate) : new Date();
  if (isNaN(date.getTime())) date = new Date();

  var dateCode = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyyMMdd');
  var maxSequence = 0;

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var ticket = String(values[rowIndex][1] || '').trim();
    if (ticket.indexOf(dateCode) === -1) continue;

    var match = ticket.match(/(\d+)$/);
    if (match) {
      maxSequence = Math.max(maxSequence, Number(match[1]) || 0);
    }
  }

  return 'FAC-' + dateCode + '-' + ('000000' + (maxSequence + 1)).slice(-6);
}

function appendSale_(sheet, sale) {
  var values = sheet.getDataRange().getValues();
  var normalized = normalizeIncomingSale_(sale);
  if (!normalized.ticketNumber) {
    normalized.ticketNumber = buildSaleTicketNumber_(values, normalized.date);
  }

  var createdAt = new Date().toISOString();
  var rowValues = [
    normalized.id,
    normalized.ticketNumber,
    normalized.date,
    normalized.time,
    normalized.clientName,
    normalized.clientDocument,
    normalized.paymentMethod,
    normalized.cashReceived,
    normalized.change,
    normalized.subtotal,
    normalized.tax,
    normalized.total,
    JSON.stringify(normalized.items),
    createdAt,
    normalized.redeemedPoints,
    normalized.loyaltyDiscount,
    normalized.earnedPoints,
    normalized.status,
    normalized.annulledAt,
    normalized.annulledBy,
    normalized.annulledReason,
    normalized.deliveryStatus,
    normalized.deliveryUpdatedAt
  ];

  sheet.appendRow(rowValues);
  return normalized;
}

function normalizeDeliveryStatus_(status) {
  var value = String(status || '').trim().toLowerCase().replace(/\s+/g, '_');
  if (value === 'camino') value = 'en_camino';
  var allowed = ['pendiente', 'preparando', 'despachado', 'en_camino', 'entregado', 'cancelado'];
  return allowed.indexOf(value) >= 0 ? value : '';
}

function findSaleRow_(sheet, saleId) {
  var target = String(saleId || '').trim();
  if (!target) return null;

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;
  var headers = values[0].map(function(header) {
    return String(header).trim();
  });

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var row = values[rowIndex];
    var sale = normalizeStoredSale_(rowToItem_(headers, row));
    if (sale.id === target || sale.ticketNumber === target) {
      return {
        rowNumber: rowIndex + 1,
        headers: headers,
        values: row,
        sale: sale
      };
    }
  }
  return null;
}

function writeSaleFields_(sheet, rowNumber, headers, fields) {
  Object.keys(fields).forEach(function(field) {
    var index = headers.indexOf(field);
    if (index >= 0) {
      sheet.getRange(rowNumber, index + 1).setValue(fields[field]);
    }
  });
}

function annulSaleWeb_(payload) {
  var sheet = getSalesSheet_();
  var match = findSaleRow_(sheet, payload.saleId || payload.id || payload.ticketNumber || payload.ticket_numero);
  if (!match) throw new Error('No se encontro la venta para anular.');
  if (match.sale.status === 'ANULADA') throw new Error('La venta ya estaba anulada.');

  var supervisor = String(payload.annulledBy || payload.anulado_por || 'Supervisor').trim() || 'Supervisor';
  var reason = String(payload.annulledReason || payload.motivo_anulacion || '').trim();
  if (!reason) throw new Error('El motivo de anulacion es obligatorio.');

  var annulledAt = new Date().toISOString();
  writeSaleFields_(sheet, match.rowNumber, match.headers, {
    estado: 'ANULADA',
    anulado_en: annulledAt,
    anulado_por: supervisor,
    motivo_anulacion: reason,
    domicilio_estado: 'cancelado',
    domicilio_actualizado_en: annulledAt
  });

  var inventorySheet = getInventorySheet_();
  var restoreItems = (match.sale.items || []).map(function(item) {
    return {
      id: item.id || item.inventario_id || '',
      sku: item.sku || '',
      quantity: Number(item.quantity || item.cantidad || 0)
    };
  }).filter(function(item) {
    return (item.id || item.sku) && item.quantity > 0;
  });
  if (restoreItems.length) receiveOrder_(inventorySheet, restoreItems);

  var sales = readSalesItems_(sheet);
  var savedSale = null;
  sales.forEach(function(sale) {
    if (sale.id === match.sale.id) savedSale = sale;
  });

  return {
    ok: true,
    action: 'anular',
    updated_at: annulledAt,
    sale: savedSale || match.sale,
    sales: sales,
    inventory: readInventoryItems_(inventorySheet)
  };
}

function updateDeliveryOrderStatusWeb_(saleId, status) {
  var normalizedStatus = normalizeDeliveryStatus_(status);
  if (!normalizedStatus) throw new Error('Estado de domicilio no valido.');
  if (normalizedStatus === 'cancelado') {
    return annulSaleWeb_({
      saleId: saleId,
      annulledBy: 'Modulo domicilios',
      annulledReason: 'Pedido de domicilio cancelado'
    });
  }

  var sheet = getSalesSheet_();
  var match = findSaleRow_(sheet, saleId);
  if (!match) throw new Error('No se encontro el pedido de domicilio.');

  var updatedAt = new Date().toISOString();
  writeSaleFields_(sheet, match.rowNumber, match.headers, {
    domicilio_estado: normalizedStatus,
    domicilio_actualizado_en: updatedAt
  });

  var sales = readSalesItems_(sheet);
  var savedSale = null;
  sales.forEach(function(sale) {
    if (sale.id === match.sale.id) savedSale = sale;
  });

  return {
    ok: true,
    action: 'update_delivery_order_status',
    updated_at: updatedAt,
    sale: savedSale || match.sale,
    sales: sales
  };
}

function appendWithdrawal_(sheet, withdrawal) {
  var values = sheet.getDataRange().getValues();
  var nextNumber = Math.max(values.length, 1);
  var normalized = normalizeIncomingWithdrawal_(withdrawal);
  if (!normalized.withdrawalNumber) {
    normalized.withdrawalNumber = 'R-' + ('0000' + nextNumber).slice(-4);
  }

  var rowValues = [
    normalized.id,
    normalized.withdrawalNumber,
    normalized.date,
    normalized.time,
    normalized.amount,
    normalized.reason,
    normalized.cashierUsername,
    normalized.cashierName,
    normalized.supervisorUsername,
    normalized.supervisorName,
    normalized.createdAt
  ];

  sheet.appendRow(rowValues);
  return normalized;
}

function updateWithdrawal_(sheet, withdrawal) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('La hoja de retiros no contiene registros.');
  }

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });
  var normalized = normalizeIncomingWithdrawal_(withdrawal);
  var targetRowIndex = -1;

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][0] || '').trim() === normalized.id) {
      targetRowIndex = rowIndex + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('No se encontró el retiro que intentas actualizar.');
  }

  var storedCurrent = normalizeStoredWithdrawal_(rowToItem_(headers, values[targetRowIndex - 1]));
  if (!normalized.withdrawalNumber) normalized.withdrawalNumber = storedCurrent.withdrawalNumber;
  if (!normalized.createdAt) normalized.createdAt = storedCurrent.createdAt;

  var rowValues = [
    normalized.id,
    normalized.withdrawalNumber,
    normalized.date,
    normalized.time,
    normalized.amount,
    normalized.reason,
    normalized.cashierUsername,
    normalized.cashierName,
    normalized.supervisorUsername,
    normalized.supervisorName,
    normalized.createdAt
  ];

  sheet.getRange(targetRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  return normalized;
}

function deleteWithdrawal_(sheet, withdrawalId) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('La hoja de retiros no contiene registros.');
  }

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });
  var targetRowIndex = -1;

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][0] || '').trim() === String(withdrawalId || '').trim()) {
      targetRowIndex = rowIndex + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('No se encontró el retiro que intentas eliminar.');
  }

  var deleted = normalizeStoredWithdrawal_(rowToItem_(headers, values[targetRowIndex - 1]));
  sheet.deleteRow(targetRowIndex);
  return deleted;
}

function appendCashClosure_(sheet, closure) {
  var values = sheet.getDataRange().getValues();
  var nextNumber = Math.max(values.length, 1);
  var normalized = normalizeIncomingCashClosure_(closure);
  if (!normalized.closureNumber) {
    normalized.closureNumber = 'C-' + ('0000' + nextNumber).slice(-4);
  }

  var rowValues = [
    normalized.id,
    normalized.closureNumber,
    normalized.date,
    normalized.createdAt,
    normalized.user,
    normalized.openingAmount,
    normalized.cashSales,
    normalized.cardSales,
    normalized.transferSales,
    normalized.withdrawalsTotal,
    normalized.expenses,
    normalized.countedCash,
    normalized.expectedDrawer,
    normalized.difference,
    normalized.transactions,
    normalized.totalSales,
    normalized.units,
    normalized.observations,
    JSON.stringify(normalized.sales)
  ];

  sheet.appendRow(rowValues);
  return normalized;
}

function updateCashClosure_(sheet, closure) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('La hoja de cierres no contiene registros.');
  }

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });
  var normalized = normalizeIncomingCashClosure_(closure);
  var targetRowIndex = -1;

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][0] || '').trim() === normalized.id) {
      targetRowIndex = rowIndex + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('No se encontró el cierre que intentas actualizar.');
  }

  var storedCurrent = normalizeStoredCashClosure_(rowToItem_(headers, values[targetRowIndex - 1]));
  if (!normalized.closureNumber) normalized.closureNumber = storedCurrent.closureNumber;
  if (!normalized.createdAt) normalized.createdAt = storedCurrent.createdAt;

  var rowValues = [
    normalized.id,
    normalized.closureNumber,
    normalized.date,
    normalized.createdAt,
    normalized.user,
    normalized.openingAmount,
    normalized.cashSales,
    normalized.cardSales,
    normalized.transferSales,
    normalized.withdrawalsTotal,
    normalized.expenses,
    normalized.countedCash,
    normalized.expectedDrawer,
    normalized.difference,
    normalized.transactions,
    normalized.totalSales,
    normalized.units,
    normalized.observations,
    JSON.stringify(normalized.sales)
  ];

  sheet.getRange(targetRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  return normalized;
}

function deleteCashClosure_(sheet, closureId) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('La hoja de cierres no contiene registros.');
  }

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });
  var targetRowIndex = -1;

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][0] || '').trim() === String(closureId || '').trim()) {
      targetRowIndex = rowIndex + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('No se encontró el cierre que intentas eliminar.');
  }

  var deleted = normalizeStoredCashClosure_(rowToItem_(headers, values[targetRowIndex - 1]));
  sheet.deleteRow(targetRowIndex);
  return deleted;
}

function bulkUpsertInventoryItems_(sheet, items) {
  var values = sheet.getDataRange().getValues();
  var headers = values.length ? values[0].map(function(header) {
    return String(header).trim();
  }) : REQUIRED_HEADERS.slice();
  var created = 0;
  var updated = 0;

  items.forEach(function(rawItem, index) {
    var item = normalizeIncomingItem_(rawItem);
    if (!item.nombre) throw new Error('El nombre del producto es obligatorio en la fila ' + (index + 2) + '.');
    if (!item.sku) throw new Error('El SKU del producto es obligatorio en la fila ' + (index + 2) + '.');

    var targetRowIndex = -1;
    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      var current = normalizeStoredItem_(rowToItem_(headers, values[rowIndex]));
      if ((item.id && current.id === item.id) || (item.sku && current.sku === item.sku)) {
        targetRowIndex = rowIndex;
        break;
      }
    }

    var rowValues = headers.map(function(header) {
      return item[header] != null ? item[header] : '';
    });

    if (targetRowIndex === -1) {
      values.push(rowValues);
      created += 1;
    } else {
      values[targetRowIndex] = rowValues;
      updated += 1;
    }
  });

  if (values.length === 1) {
    sheet.getRange(1, 1, 1, headers.length).setValues(values);
  } else {
    sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  }

  return {
    created: created,
    updated: updated,
    processed: items.length
  };
}

function decrementStock_(sheet, items) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('La hoja no contiene productos para descontar.');
  }

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });
  var stockIndex = headers.indexOf('stock');
  if (stockIndex === -1) {
    throw new Error('No existe la columna "stock" en la hoja.');
  }

  var updates = items.map(function(item) {
    return {
      id: String(item.id || '').trim(),
      sku: String(item.sku || '').trim(),
      quantity: Number(item.quantity || 0)
    };
  });

  updates.forEach(function(update) {
    if (!update.id && !update.sku) {
      throw new Error('Cada item debe incluir id o sku para descontar stock.');
    }
    if (!isFinite(update.quantity) || update.quantity <= 0) {
      throw new Error('La cantidad a descontar debe ser mayor que cero.');
    }
  });

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var current = normalizeStoredItem_(rowToItem_(headers, values[rowIndex]));
    var matchedUpdate = null;

    for (var updateIndex = 0; updateIndex < updates.length; updateIndex += 1) {
      var update = updates[updateIndex];
      if ((update.id && current.id === update.id) || (update.sku && current.sku === update.sku)) {
        matchedUpdate = update;
        break;
      }
    }

    if (!matchedUpdate) continue;

    if (current.stock < matchedUpdate.quantity) {
      throw new Error('Stock insuficiente para "' + current.nombre + '". Disponible: ' + current.stock + ', solicitado: ' + matchedUpdate.quantity);
    }

    values[rowIndex][stockIndex] = current.stock - matchedUpdate.quantity;
    matchedUpdate.applied = true;
  }

  updates.forEach(function(update) {
    if (!update.applied) {
      throw new Error('No se encontró el producto para descontar stock: ' + (update.sku || update.id));
    }
  });

  sheet.getRange(2, 1, values.length - 1, headers.length).setValues(values.slice(1));
}

function receiveOrder_(sheet, items) {
  var values = sheet.getDataRange().getValues();
  var headers = values.length ? values[0].map(function(header) {
    return String(header).trim();
  }) : REQUIRED_HEADERS.slice();

  var normalizedItems = items.map(function(item) {
    var normalized = normalizeIncomingItem_(item);
    normalized.quantity = Number(item.quantity != null ? item.quantity : item.cantidad != null ? item.cantidad : item.stock != null ? item.stock : 0);
    if (!isFinite(normalized.quantity) || normalized.quantity <= 0) {
      throw new Error('Cada item del pedido debe traer una cantidad válida mayor que cero.');
    }
    if (!normalized.sku) {
      throw new Error('Cada item del pedido debe traer SKU.');
    }
    return normalized;
  });

  normalizedItems.forEach(function(incoming) {
    var targetRowIndex = -1;

    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      var current = normalizeStoredItem_(rowToItem_(headers, values[rowIndex]));
      if ((incoming.id && current.id === incoming.id) || (incoming.sku && current.sku === incoming.sku)) {
        targetRowIndex = rowIndex;
        break;
      }
    }

    if (targetRowIndex === -1) {
      var newItem = {
        id: incoming.id || incoming.nombre || incoming.sku,
        sku: incoming.sku,
        nombre: incoming.nombre || incoming.sku,
        categoria: incoming.categoria || 'general',
        precio: incoming.precio || 0,
        stock: incoming.quantity,
        lote: incoming.lote || '',
        fecha_vencimiento: incoming.fecha_vencimiento || '',
        laboratorio: incoming.laboratorio || '',
        registro_invima: incoming.registro_invima || '',
        codigo_barras: incoming.codigo_barras || '',
        descripcion: incoming.descripcion || '',
        imagen_url: incoming.imagen_url || '',
        activo: incoming.activo || 'SI'
      };

      values.push(headers.map(function(header) {
        return newItem[header] != null ? newItem[header] : '';
      }));
      return;
    }

    var currentItem = normalizeStoredItem_(rowToItem_(headers, values[targetRowIndex]));
    var updatedItem = {
      id: incoming.id || currentItem.id,
      sku: incoming.sku || currentItem.sku,
      nombre: incoming.nombre || currentItem.nombre,
      categoria: incoming.categoria || currentItem.categoria,
      precio: incoming.precio || currentItem.precio,
      stock: Number(currentItem.stock || 0) + incoming.quantity,
      lote: incoming.lote || currentItem.lote,
      fecha_vencimiento: incoming.fecha_vencimiento || currentItem.fecha_vencimiento,
      laboratorio: incoming.laboratorio || currentItem.laboratorio,
      registro_invima: incoming.registro_invima || currentItem.registro_invima,
      codigo_barras: incoming.codigo_barras || currentItem.codigo_barras,
      descripcion: incoming.descripcion || currentItem.descripcion,
      imagen_url: incoming.imagen_url || currentItem.imagen_url,
      activo: incoming.activo || currentItem.activo || 'SI'
    };

    values[targetRowIndex] = headers.map(function(header) {
      return updatedItem[header] != null ? updatedItem[header] : '';
    });
  });

  if (values.length === 1) {
    sheet.getRange(1, 1, 1, headers.length).setValues(values);
  } else {
    sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  }
}

function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  var raw = String(e.postData.contents || '').trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('No se pudo leer el cuerpo JSON de la solicitud.');
  }
}

function getParam_(e, key, fallback) {
  if (!e || !e.parameter) return fallback;
  var value = e.parameter[key];
  return value == null || value === '' ? fallback : String(value);
}

function normalizeDateValue_(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  var text = String(value).trim();
  if (!text) return '';

  var isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  var parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  return text;
}

function logError_(where, error) {
  console.error(where + ': ' + (error && error.stack ? error.stack : error));
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupWebApp_(payload) {
  var dryRun = Boolean(payload && payload.dryRun);
  var summary = {
    ok: true,
    action: 'setup_web_app',
    dryRun: dryRun,
    spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
    spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
    sheets: []
  };

  summary.sheets.push(describeSetupSheet_(SHEET_NAME, REQUIRED_HEADERS, getInventorySheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(SALES_SHEET_NAME, SALES_HEADERS, getSalesSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(USERS_SHEET_NAME, WEB_USER_HEADERS, getUsersSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(WITHDRAWALS_SHEET_NAME, WITHDRAWALS_HEADERS, getWithdrawalsSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(CASH_CLOSURES_SHEET_CANDIDATES[0], CASH_CLOSURES_HEADERS, getCashClosuresSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(SETTINGS_SHEET_NAME, SETTINGS_HEADERS, getSettingsSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(COMPANIES_SHEET_NAME, COMPANY_HEADERS, getCompaniesSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(LICENSES_SHEET_NAME, LICENSE_HEADERS, getLicensesSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(LICENSE_DEVICES_SHEET_NAME, LICENSE_DEVICE_HEADERS, getLicenseDevicesSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(LICENSE_HISTORY_SHEET_NAME, LICENSE_HISTORY_HEADERS, getLicenseHistorySheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(CLIENTS_SHEET_NAME, CLIENT_HEADERS, getClientsSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(SUPPLIERS_SHEET_NAME, SUPPLIER_HEADERS, getSuppliersSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(PURCHASES_SHEET_NAME, PURCHASE_HEADERS, getPurchasesSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(RETURNS_SHEET_NAME, RETURN_HEADERS, getReturnsSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(PROMOTIONS_SHEET_NAME, PROMOTION_HEADERS, getPromotionsSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(AUDIT_LOGS_SHEET_NAME, AUDIT_LOG_HEADERS, getAuditLogsSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(SUPPORT_TICKETS_SHEET_NAME, SUPPORT_TICKET_HEADERS, getSupportTicketsSheet_, dryRun));
  summary.sheets.push(describeSetupSheet_(SUPPORT_MESSAGES_SHEET_NAME, SUPPORT_MESSAGE_HEADERS, getSupportMessagesSheet_, dryRun));

  if (!dryRun && payload && payload.admin) {
    saveUserWeb_({
      name: payload.admin.name || 'Administrador Web',
      username: payload.admin.username || 'adminweb',
      password: payload.admin.password || 'admin12345',
      role: payload.admin.role || 'admin',
      active: 'SI'
    });
    summary.seededAdmin = String(payload.admin.username || 'adminweb');
  }

  return summary;
}

function describeSetupSheet_(name, headers, resolver, dryRun) {
  if (!dryRun) resolver();
  return {
    name: name,
    headers: headers.slice(),
    ensured: true
  };
}

function getSpreadsheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No se pudo abrir la hoja de calculo activa.');
  }
  return spreadsheet;
}

function getOrCreateSheet_(sheetName, headers, ensureFn) {
  var spreadsheet = getSpreadsheet_();
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  (ensureFn || ensureSimpleHeaders_)(sheet, headers);
  return sheet;
}

function getCompaniesSheet_() {
  return getOrCreateSheet_(COMPANIES_SHEET_NAME, COMPANY_HEADERS);
}

function getLicensesSheet_() {
  return getOrCreateSheet_(LICENSES_SHEET_NAME, LICENSE_HEADERS);
}

function getLicenseDevicesSheet_() {
  return getOrCreateSheet_(LICENSE_DEVICES_SHEET_NAME, LICENSE_DEVICE_HEADERS);
}

function getLicenseHistorySheet_() {
  return getOrCreateSheet_(LICENSE_HISTORY_SHEET_NAME, LICENSE_HISTORY_HEADERS);
}

function getSupportTicketsSheet_() {
  return getOrCreateSheet_(SUPPORT_TICKETS_SHEET_NAME, SUPPORT_TICKET_HEADERS);
}

function getSupportMessagesSheet_() {
  return getOrCreateSheet_(SUPPORT_MESSAGES_SHEET_NAME, SUPPORT_MESSAGE_HEADERS);
}

function ensureSimpleHeaders_(sheet, headers) {
  var lastColumn = Math.max(sheet.getLastColumn(), headers.length);
  var existingHeaders = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  var isEmptySheet = sheet.getLastRow() === 0;
  if (isEmptySheet) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  for (var i = 0; i < headers.length; i += 1) {
    if (normalizeHeaderKey_(existingHeaders[i]) !== normalizeHeaderKey_(headers[i])) {
      throw new Error('La fila de encabezados no coincide con el formato esperado de ' + sheet.getName() + '.');
    }
  }
}

function ensureAuditLogHeaders_(sheet) {
  var lastColumn = Math.max(sheet.getLastColumn(), AUDIT_LOG_HEADERS.length);
  var existingHeaders = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  var isEmptySheet = sheet.getLastRow() === 0;
  if (isEmptySheet) {
    sheet.getRange(1, 1, 1, AUDIT_LOG_HEADERS.length).setValues([AUDIT_LOG_HEADERS]);
    return;
  }

  var legacyHeaders = ['id', 'modulo', 'accion', 'entity_id', 'entity_name', 'detalle', 'usuario', 'creado_en'];
  var legacyMatches = true;
  for (var i = 0; i < legacyHeaders.length; i += 1) {
    if (normalizeHeaderKey_(existingHeaders[i]) !== normalizeHeaderKey_(legacyHeaders[i])) {
      legacyMatches = false;
      break;
    }
  }

  if (legacyMatches) {
    sheet.insertColumnBefore(8);
    sheet.getRange(1, 8).setValue('usuario_login');
    return;
  }

  ensureSimpleHeaders_(sheet, AUDIT_LOG_HEADERS);
}

function readSimpleItems_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function(header) { return String(header).trim(); });
  return values.slice(1).filter(function(row) {
    return row.some(function(cell) { return String(cell).trim() !== ''; });
  }).map(function(row) {
    return rowToItem_(headers, row);
  });
}

function safeWorkbookSection_(errors, section, sheetName, reader) {
  try {
    return reader();
  } catch (error) {
    errors.push({
      section: section,
      sheet: sheetName,
      error: error.message
    });
    return [];
  }
}

function buildFullWorkbookState_(mode) {
  var errors = [];
  var inventory = safeWorkbookSection_(errors, 'inventory', SHEET_NAME, function() {
    return readInventoryItems_(getInventorySheet_());
  });
  var sales = safeWorkbookSection_(errors, 'sales', SALES_SHEET_NAME, function() {
    return readSalesItems_(getSalesSheet_());
  });
  var clients = safeWorkbookSection_(errors, 'clients', CLIENTS_SHEET_NAME, readClientsWeb_);
  var suppliers = safeWorkbookSection_(errors, 'suppliers', SUPPLIERS_SHEET_NAME, readSuppliersWeb_);
  var purchases = safeWorkbookSection_(errors, 'purchases', PURCHASES_SHEET_NAME, readPurchasesWeb_);
  var returns = safeWorkbookSection_(errors, 'returns', RETURNS_SHEET_NAME, readReturnsWeb_);
  var promotions = safeWorkbookSection_(errors, 'promotions', PROMOTIONS_SHEET_NAME, readPromotionsWeb_);
  var auditLogs = safeWorkbookSection_(errors, 'auditLogs', AUDIT_LOGS_SHEET_NAME, readAuditLogsWeb_);
  var withdrawals = safeWorkbookSection_(errors, 'withdrawals', WITHDRAWALS_SHEET_NAME, function() {
    return readWithdrawalItems_(getWithdrawalsSheet_());
  });
  var closures = safeWorkbookSection_(errors, 'closures', CASH_CLOSURES_SHEET_CANDIDATES[0], function() {
    return readCashClosureItems_(getCashClosuresSheet_());
  });
  var profile = {};
  try {
    profile = readCompanyProfile_(getSettingsSheet_());
  } catch (profileError) {
    errors.push({
      section: 'profile',
      sheet: SETTINGS_SHEET_NAME,
      error: profileError.message
    });
  }

  return {
    ok: true,
    mode: mode || 'all',
    updated_at: new Date().toISOString(),
    total: inventory.length,
    items: inventory,
    inventory: inventory,
    sales: sales,
    clients: clients,
    suppliers: suppliers,
    purchases: purchases,
    returns: returns,
    promotions: promotions,
    auditLogs: auditLogs,
    withdrawals: withdrawals,
    closures: closures,
    profile: profile,
    sync_errors: errors
  };
}

function getSheetHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0].map(function(header) {
    return String(header || '').trim();
  });
}

function findSimpleRowIndex_(items, id) {
  var normalizedId = String(id || '').trim();
  if (!normalizedId) return -1;
  for (var i = 0; i < items.length; i += 1) {
    if (String(items[i].id || items[i].Id || '').trim() === normalizedId) return i + 2;
  }
  return -1;
}

function writeSimpleRow_(sheet, headers, rowIndex, record) {
  var row = headers.map(function(header) {
    return record[header] != null ? record[header] : '';
  });
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function deleteSimpleRow_(sheet, id) {
  var items = readSimpleItems_(sheet);
  var rowIndex = findSimpleRowIndex_(items, id);
  if (rowIndex < 0) throw new Error('No se encontro el registro solicitado.');
  var headers = getSheetHeaders_(sheet);
  var deleted = rowToItem_(headers, sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0]);
  sheet.deleteRow(rowIndex);
  return deleted;
}

function readClientsWeb_() {
  return readSimpleItems_(getClientsSheet_()).map(function(item) {
    return {
      id: String(item.id || '').trim(),
      name: String(item.nombre || '').trim(),
      document: String(item.documento || '').trim(),
      phone: String(item.telefono || '').trim(),
      purchases: Number(item.compras || 0),
      points: Number(item.puntos || 0),
      totalSpent: Number(item.total_gastado || 0),
      active: String(item.activo || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI'
    };
  });
}

function readSuppliersWeb_() {
  return readSimpleItems_(getSuppliersSheet_()).map(function(item) {
    return {
      id: String(item.id || '').trim(),
      name: String(item.nombre || '').trim(),
      document: String(item.documento || '').trim(),
      phone: String(item.telefono || '').trim(),
      contact: String(item.contacto || '').trim(),
      city: String(item.ciudad || '').trim(),
      notes: String(item.notas || '').trim(),
      active: String(item.activo || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI'
    };
  });
}

function readPurchasesWeb_() {
  return readSimpleItems_(getPurchasesSheet_()).map(function(item) {
    return {
      id: String(item.id || '').trim(),
      supplierId: String(item.proveedor_id || '').trim(),
      supplierName: String(item.proveedor_nombre || '').trim(),
      inventoryItemId: String(item.inventario_id || '').trim(),
      productName: String(item.producto_nombre || '').trim(),
      sku: String(item.sku || '').trim(),
      quantity: Number(item.cantidad || 0),
      unitCost: Number(item.costo_unitario || 0),
      total: Number(item.total || 0),
      batch: String(item.lote || '').trim(),
      date: normalizeDateValue_(item.fecha || ''),
      notes: String(item.notas || '').trim(),
      createdAt: String(item.creado_en || '').trim()
    };
  });
}

function readReturnsWeb_() {
  return readSimpleItems_(getReturnsSheet_()).map(function(item) {
    return {
      id: String(item.id || '').trim(),
      saleId: String(item.venta_id || '').trim(),
      saleLineId: String(item.detalle_venta_id || '').trim(),
      ticketNumber: String(item.ticket_numero || '').trim(),
      clientName: String(item.cliente_nombre || '').trim(),
      inventoryItemId: String(item.inventario_id || '').trim(),
      productName: String(item.producto_nombre || '').trim(),
      quantity: Number(item.cantidad || 0),
      unitPrice: Number(item.precio_unitario || 0),
      total: Number(item.total || 0),
      reason: String(item.motivo || '').trim(),
      restock: String(item.repone_stock || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI',
      date: normalizeDateValue_(item.fecha || ''),
      createdAt: String(item.creado_en || '').trim(),
      processedBy: String(item.procesado_por || '').trim()
    };
  });
}

function readPromotionsWeb_() {
  return readSimpleItems_(getPromotionsSheet_()).map(function(item) {
    return {
      id: String(item.id || '').trim(),
      name: String(item.nombre || '').trim(),
      scope: String(item.alcance || 'product').trim(),
      targetValue: String(item.objetivo || '').trim(),
      discountType: String(item.tipo_descuento || 'percent').trim(),
      discountValue: Number(item.valor_descuento || 0),
      active: String(item.activo || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI'
    };
  });
}

function readAuditLogsWeb_() {
  return readSimpleItems_(getAuditLogsSheet_()).map(function(item) {
    return {
      id: String(item.id || '').trim(),
      module: String(item.modulo || '').trim(),
      action: String(item.accion || '').trim(),
      entityId: String(item.entity_id || '').trim(),
      entityName: String(item.entity_name || '').trim(),
      detail: String(item.detalle || '').trim(),
      user: String(item.usuario || '').trim(),
      username: String(item.usuario_login || '').trim(),
      createdAt: String(item.creado_en || '').trim()
    };
  });
}

function saveClientWeb_(payload) {
  var sheet = getClientsSheet_();
  var items = readSimpleItems_(sheet);
  var id = String(payload.id || '').trim() || Utilities.getUuid();
  var record = {
    id: id,
    nombre: String(payload.name || payload.nombre || '').trim(),
    documento: String(payload.document || payload.documento || '').trim(),
    telefono: String(payload.phone || payload.telefono || '').trim(),
    compras: Number(payload.purchases || payload.compras || 0),
    puntos: Number(payload.points || payload.puntos || 0),
    total_gastado: Number(payload.totalSpent || payload.total_gastado || 0),
    activo: String(payload.active || payload.activo || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI'
  };
  if (!record.nombre) throw new Error('El nombre del cliente es obligatorio.');
  writeSimpleRow_(sheet, CLIENT_HEADERS, findSimpleRowIndex_(items, id), record);
  return { ok: true, action: 'save_client', updated_at: new Date().toISOString(), clients: readClientsWeb_() };
}

function setClientActiveWeb_(id, active) {
  var clients = readClientsWeb_();
  var current = null;
  clients.forEach(function(item) { if (String(item.id) === String(id)) current = item; });
  if (!current) throw new Error('Cliente no encontrado.');
  current.active = String(active || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI';
  return saveClientWeb_(current);
}

function deleteClientWeb_(id) {
  deleteSimpleRow_(getClientsSheet_(), id);
  return { ok: true, action: 'delete_client', updated_at: new Date().toISOString(), clients: readClientsWeb_() };
}

function saveSupplierWeb_(payload) {
  var sheet = getSuppliersSheet_();
  var items = readSimpleItems_(sheet);
  var id = String(payload.id || '').trim() || Utilities.getUuid();
  var record = {
    id: id,
    nombre: String(payload.name || payload.nombre || '').trim(),
    documento: String(payload.document || payload.documento || payload.nit || '').trim(),
    telefono: String(payload.phone || payload.telefono || '').trim(),
    contacto: String(payload.contact || payload.contacto || '').trim(),
    ciudad: String(payload.city || payload.ciudad || '').trim(),
    notas: String(payload.notes || payload.notas || '').trim(),
    activo: String(payload.active || payload.activo || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI'
  };
  if (!record.nombre) throw new Error('El nombre del proveedor es obligatorio.');
  writeSimpleRow_(sheet, SUPPLIER_HEADERS, findSimpleRowIndex_(items, id), record);
  return { ok: true, action: 'save_supplier', updated_at: new Date().toISOString(), suppliers: readSuppliersWeb_() };
}

function setSupplierActiveWeb_(id, active) {
  var suppliers = readSuppliersWeb_();
  var current = null;
  suppliers.forEach(function(item) { if (String(item.id) === String(id)) current = item; });
  if (!current) throw new Error('Proveedor no encontrado.');
  current.active = String(active || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI';
  return saveSupplierWeb_(current);
}

function deleteSupplierWeb_(id) {
  deleteSimpleRow_(getSuppliersSheet_(), id);
  return { ok: true, action: 'delete_supplier', updated_at: new Date().toISOString(), suppliers: readSuppliersWeb_() };
}

function registerPurchaseWeb_(payload) {
  var sheet = getPurchasesSheet_();
  var id = String(payload.id || '').trim() || Utilities.getUuid();
  var record = {
    id: id,
    proveedor_id: String(payload.supplierId || payload.proveedor_id || '').trim(),
    proveedor_nombre: String(payload.supplierName || payload.proveedor_nombre || '').trim(),
    inventario_id: String(payload.inventoryItemId || payload.inventario_id || '').trim(),
    producto_nombre: String(payload.productName || payload.producto_nombre || '').trim(),
    sku: String(payload.sku || '').trim(),
    cantidad: Number(payload.quantity || payload.cantidad || 0),
    costo_unitario: Number(payload.unitCost || payload.costo_unitario || 0),
    total: Number(payload.total || 0),
    lote: String(payload.batch || payload.lote || '').trim(),
    fecha: normalizeDateValue_(payload.date || payload.fecha || new Date()),
    notas: String(payload.notes || payload.notas || '').trim(),
    creado_en: String(payload.createdAt || payload.creado_en || new Date().toISOString()).trim()
  };
  if (!record.inventario_id || record.cantidad <= 0) throw new Error('La compra debe tener producto y cantidad.');
  writeSimpleRow_(sheet, PURCHASE_HEADERS, -1, record);
  var inventoryForPurchase = readInventoryItems_(getInventorySheet_());
  var purchaseSku = record.sku;
  inventoryForPurchase.forEach(function(item) {
    if (!purchaseSku && String(item.id || '').trim() === record.inventario_id) purchaseSku = item.sku;
  });
  receiveOrder_(getInventorySheet_(), [{ id: record.inventario_id, sku: purchaseSku, quantity: record.cantidad, batch: record.lote }]);
  return { ok: true, action: 'register_purchase', updated_at: new Date().toISOString(), purchases: readPurchasesWeb_(), inventory: readInventoryItems_(getInventorySheet_()) };
}

function registerReturnWeb_(payload) {
  var sheet = getReturnsSheet_();
  var id = String(payload.id || '').trim() || Utilities.getUuid();
  var record = {
    id: id,
    venta_id: String(payload.saleId || payload.venta_id || '').trim(),
    detalle_venta_id: String(payload.saleLineId || payload.detalle_venta_id || '').trim(),
    ticket_numero: String(payload.ticketNumber || payload.ticket_numero || '').trim(),
    cliente_nombre: String(payload.clientName || payload.cliente_nombre || '').trim(),
    inventario_id: String(payload.inventoryItemId || payload.inventario_id || '').trim(),
    producto_nombre: String(payload.productName || payload.producto_nombre || '').trim(),
    cantidad: Number(payload.quantity || payload.cantidad || 0),
    precio_unitario: Number(payload.unitPrice || payload.precio_unitario || 0),
    total: Number(payload.total || 0),
    motivo: String(payload.reason || payload.motivo || '').trim(),
    repone_stock: String(payload.restock || payload.repone_stock || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI',
    fecha: normalizeDateValue_(payload.date || payload.fecha || new Date()),
    creado_en: String(payload.createdAt || payload.creado_en || new Date().toISOString()).trim(),
    procesado_por: String(payload.processedBy || payload.procesado_por || '').trim()
  };
  if (!record.venta_id || !record.inventario_id || record.cantidad <= 0) throw new Error('La devolucion debe tener venta, producto y cantidad.');
  writeSimpleRow_(sheet, RETURN_HEADERS, -1, record);
  if (record.repone_stock !== 'NO') {
    var inventoryForReturn = readInventoryItems_(getInventorySheet_());
    var returnSku = '';
    inventoryForReturn.forEach(function(item) {
      if (String(item.id || '').trim() === record.inventario_id) returnSku = item.sku;
    });
    receiveOrder_(getInventorySheet_(), [{ id: record.inventario_id, sku: returnSku, quantity: record.cantidad }]);
  }
  return { ok: true, action: 'register_return', updated_at: new Date().toISOString(), returns: readReturnsWeb_(), inventory: readInventoryItems_(getInventorySheet_()) };
}

function savePromotionWeb_(payload) {
  var sheet = getPromotionsSheet_();
  var items = readSimpleItems_(sheet);
  var id = String(payload.id || '').trim() || Utilities.getUuid();
  var record = {
    id: id,
    nombre: String(payload.name || payload.nombre || '').trim(),
    alcance: String(payload.scope || payload.alcance || 'product').trim(),
    objetivo: String(payload.targetValue || payload.target_value || payload.objetivo || '').trim(),
    tipo_descuento: String(payload.discountType || payload.discount_type || payload.tipo_descuento || 'percent').trim(),
    valor_descuento: Number(payload.discountValue || payload.discount_value || payload.valor_descuento || 0),
    activo: String(payload.active || payload.activo || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI'
  };
  if (!record.nombre) throw new Error('El nombre de la promocion es obligatorio.');
  writeSimpleRow_(sheet, PROMOTION_HEADERS, findSimpleRowIndex_(items, id), record);
  return { ok: true, action: 'save_promotion', updated_at: new Date().toISOString(), promotions: readPromotionsWeb_() };
}

function setPromotionActiveWeb_(id, active) {
  var promotions = readPromotionsWeb_();
  var current = null;
  promotions.forEach(function(item) { if (String(item.id) === String(id)) current = item; });
  if (!current) throw new Error('Promocion no encontrada.');
  current.active = String(active || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI';
  return savePromotionWeb_(current);
}

function deletePromotionWeb_(id) {
  deleteSimpleRow_(getPromotionsSheet_(), id);
  return { ok: true, action: 'delete_promotion', updated_at: new Date().toISOString(), promotions: readPromotionsWeb_() };
}

function addAuditLogWeb_(payload) {
  var record = {
    id: String(payload.id || '').trim() || Utilities.getUuid(),
    modulo: String(payload.module || payload.modulo || 'general').trim(),
    accion: String(payload.action || payload.accion || 'actualizar').trim(),
    entity_id: String(payload.entityId || payload.entity_id || '').trim(),
    entity_name: String(payload.entityName || payload.entity_name || '').trim(),
    detalle: String(payload.detail || payload.detalle || '').trim(),
    usuario: String(payload.user || payload.usuario || 'Sistema').trim(),
    usuario_login: String(payload.username || payload.usuario_login || '').trim(),
    creado_en: String(payload.createdAt || payload.creado_en || new Date().toISOString()).trim()
  };
  writeSimpleRow_(getAuditLogsSheet_(), AUDIT_LOG_HEADERS, -1, record);
  return { ok: true, action: 'add_audit_log', updated_at: new Date().toISOString(), auditLogs: readAuditLogsWeb_() };
}

function normalizeSupportTicketWeb_(item) {
  return {
    id: String(item.id || '').trim(),
    ticketCode: String(item.ticket_code || '').trim(),
    companyId: String(item.empresa_id || '').trim(),
    companyName: String(item.empresa_nombre || '').trim(),
    licenseCode: String(item.licencia_codigo || '').trim(),
    contactName: String(item.contacto_nombre || '').trim(),
    contactEmail: String(item.contacto_email || '').trim(),
    contactPhone: String(item.contacto_telefono || '').trim(),
    title: String(item.titulo || '').trim(),
    category: String(item.categoria || 'GENERAL').trim(),
    priority: String(item.prioridad || 'MEDIA').trim().toUpperCase(),
    status: String(item.estado || 'ABIERTO').trim().toUpperCase(),
    createdByUsername: String(item.creado_por_usuario || '').trim(),
    createdByName: String(item.creado_por_nombre || '').trim(),
    createdAt: String(item.creado_en || '').trim(),
    lastMessageAt: String(item.ultimo_mensaje_en || item.creado_en || '').trim(),
    unreadCompany: Number(item.no_leidos_empresa || 0),
    unreadInternal: Number(item.no_leidos_interno || 0)
  };
}

function normalizeSupportMessageWeb_(item) {
  return {
    id: String(item.id || '').trim(),
    ticketId: String(item.ticket_id || '').trim(),
    authorScope: String(item.autor_scope || 'EMPRESA').trim().toUpperCase(),
    authorUsername: String(item.autor_usuario || '').trim(),
    authorName: String(item.autor_nombre || '').trim(),
    message: String(item.mensaje || '').trim(),
    createdAt: String(item.creado_en || '').trim()
  };
}

function readSupportTicketsWeb_() {
  return readSimpleItems_(getSupportTicketsSheet_()).map(normalizeSupportTicketWeb_);
}

function readSupportMessagesWeb_() {
  return readSimpleItems_(getSupportMessagesSheet_()).map(normalizeSupportMessageWeb_);
}

function getSupportOverviewWeb_(payload) {
  var isInternal = Boolean(payload && payload.isInternal);
  var companyId = String(payload && payload.companyId || '').trim();
  var tickets = readSupportTicketsWeb_().filter(function(ticket) {
    return isInternal || !companyId || ticket.companyId === companyId;
  }).sort(function(a, b) {
    return new Date(b.lastMessageAt || b.createdAt || 0).getTime() - new Date(a.lastMessageAt || a.createdAt || 0).getTime();
  });

  return {
    ok: true,
    action: 'support_overview',
    updated_at: new Date().toISOString(),
    tickets: tickets,
    unreadCompanyTotal: tickets.reduce(function(sum, ticket) { return sum + Number(ticket.unreadCompany || 0); }, 0),
    unreadInternalTotal: tickets.reduce(function(sum, ticket) { return sum + Number(ticket.unreadInternal || 0); }, 0)
  };
}

function getSupportThreadWeb_(ticketId) {
  var normalizedTicketId = String(ticketId || '').trim();
  var ticket = null;
  readSupportTicketsWeb_().forEach(function(item) {
    if (String(item.id) === normalizedTicketId) ticket = item;
  });
  if (!ticket) throw new Error('No se encontro el ticket de soporte.');

  var messages = readSupportMessagesWeb_().filter(function(message) {
    return String(message.ticketId) === normalizedTicketId;
  });

  return {
    ok: true,
    action: 'support_thread',
    updated_at: new Date().toISOString(),
    ticket: ticket,
    messages: messages
  };
}

function getNextSupportTicketCode_() {
  var tickets = readSupportTicketsWeb_();
  var maxNumber = 0;
  tickets.forEach(function(ticket) {
    var match = String(ticket.ticketCode || '').match(/SOP-(\d+)/i);
    if (match) maxNumber = Math.max(maxNumber, Number(match[1]) || 0);
  });
  return 'SOP-' + ('00000' + (maxNumber + 1)).slice(-5);
}

function createSupportTicketWeb_(payload) {
  var title = String(payload.title || '').trim();
  var message = String(payload.message || '').trim();
  if (!title) throw new Error('El asunto del ticket es obligatorio.');
  if (!message) throw new Error('El mensaje del ticket es obligatorio.');

  var now = new Date().toISOString();
  var ticketId = Utilities.getUuid();
  var ticket = {
    id: ticketId,
    ticket_code: getNextSupportTicketCode_(),
    empresa_id: String(payload.companyId || '').trim(),
    empresa_nombre: String(payload.companyName || 'Empresa').trim(),
    licencia_codigo: String(payload.licenseCode || '').trim(),
    contacto_nombre: String(payload.contactName || payload.createdByName || 'Usuario').trim(),
    contacto_email: String(payload.contactEmail || '').trim(),
    contacto_telefono: String(payload.contactPhone || '').trim(),
    titulo: title,
    categoria: String(payload.category || 'GENERAL').trim(),
    prioridad: String(payload.priority || 'MEDIA').trim().toUpperCase(),
    estado: 'ABIERTO',
    creado_por_usuario: String(payload.createdByUsername || '').trim(),
    creado_por_nombre: String(payload.createdByName || 'Usuario').trim(),
    creado_en: now,
    ultimo_mensaje_en: now,
    no_leidos_empresa: 0,
    no_leidos_interno: 1
  };
  writeSimpleRow_(getSupportTicketsSheet_(), SUPPORT_TICKET_HEADERS, -1, ticket);
  writeSimpleRow_(getSupportMessagesSheet_(), SUPPORT_MESSAGE_HEADERS, -1, {
    id: Utilities.getUuid(),
    ticket_id: ticketId,
    autor_scope: 'EMPRESA',
    autor_usuario: ticket.creado_por_usuario,
    autor_nombre: ticket.creado_por_nombre,
    mensaje: message,
    creado_en: now
  });

  return getSupportThreadWeb_(ticketId);
}

function updateSupportTicketRow_(ticketId, updater) {
  var sheet = getSupportTicketsSheet_();
  var items = readSimpleItems_(sheet);
  var rowIndex = findSimpleRowIndex_(items, ticketId);
  if (rowIndex < 0) throw new Error('No se encontro el ticket de soporte.');
  var headers = getSheetHeaders_(sheet);
  var current = rowToItem_(headers, sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0]);
  var next = updater(current) || current;
  writeSimpleRow_(sheet, headers, rowIndex, next);
  return normalizeSupportTicketWeb_(next);
}

function sendSupportMessageWeb_(payload) {
  var ticketId = String(payload.ticketId || payload.ticket_id || '').trim();
  var message = String(payload.message || payload.mensaje || '').trim();
  var authorScope = String(payload.authorScope || payload.autor_scope || 'EMPRESA').trim().toUpperCase();
  if (!ticketId) throw new Error('Selecciona un ticket para responder.');
  if (!message) throw new Error('Escribe un mensaje para enviar.');

  var now = new Date().toISOString();
  writeSimpleRow_(getSupportMessagesSheet_(), SUPPORT_MESSAGE_HEADERS, -1, {
    id: Utilities.getUuid(),
    ticket_id: ticketId,
    autor_scope: authorScope,
    autor_usuario: String(payload.authorUsername || payload.autor_usuario || '').trim(),
    autor_nombre: String(payload.authorName || payload.autor_nombre || 'Usuario').trim(),
    mensaje: message,
    creado_en: now
  });
  updateSupportTicketRow_(ticketId, function(ticket) {
    ticket.ultimo_mensaje_en = now;
    if (authorScope === 'INTERNO') {
      ticket.no_leidos_empresa = Number(ticket.no_leidos_empresa || 0) + 1;
    } else {
      ticket.no_leidos_interno = Number(ticket.no_leidos_interno || 0) + 1;
    }
    return ticket;
  });
  return getSupportThreadWeb_(ticketId);
}

function setSupportTicketStatusWeb_(ticketId, status) {
  var normalizedStatus = String(status || 'ABIERTO').trim().toUpperCase();
  updateSupportTicketRow_(ticketId, function(ticket) {
    ticket.estado = normalizedStatus;
    ticket.ultimo_mensaje_en = new Date().toISOString();
    return ticket;
  });
  return getSupportThreadWeb_(ticketId);
}

function markSupportTicketReadWeb_(ticketId, readerScope) {
  var scope = String(readerScope || 'EMPRESA').trim().toUpperCase();
  updateSupportTicketRow_(ticketId, function(ticket) {
    if (scope === 'INTERNO') ticket.no_leidos_interno = 0;
    else ticket.no_leidos_empresa = 0;
    return ticket;
  });
  return getSupportOverviewWeb_({});
}

function getNextNumericId_(items) {
  var maxId = 0;
  items.forEach(function(item) {
    maxId = Math.max(maxId, Number(item.id || item.Id || 0) || 0);
  });
  return String(maxId + 1);
}

function listUsersWeb_() {
  var sheet = getUsersSheet_();
  var items = readSimpleItems_(sheet);
  return items.map(function(user) {
    return {
      id: String(user.Id || '').trim(),
      companyId: String(user.EmpresaId || '').trim(),
      name: String(user.Nombre || '').trim(),
      username: String(user.Usuario || '').trim().toLowerCase(),
      role: normalizeUserRole_(String(user.Rol || ''), String(user.Usuario || '').trim().toLowerCase()),
      active: String(user.Estado || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI',
      createdAt: String(user.CreadoEn || '').trim()
    };
  });
}

function saveUserWeb_(payload) {
  var sheet = getUsersSheet_();
  var items = readSimpleItems_(sheet);
  var userId = String(payload.id || '').trim();
  var username = String(payload.username || payload.Usuario || '').trim().toLowerCase();
  var headers = WEB_USER_HEADERS.slice();
  var rowIndex = -1;

  if (!username) throw new Error('Debes indicar el nombre de usuario.');
  if (!String(payload.name || payload.Nombre || '').trim()) throw new Error('Debes indicar el nombre del usuario.');

  items.forEach(function(item, index) {
    var currentUsername = String(item.Usuario || '').trim().toLowerCase();
    var currentId = String(item.Id || '').trim();
    if (currentUsername === username && currentId !== userId) {
      throw new Error('Ya existe un usuario con ese nombre de usuario.');
    }
    if (currentId === userId && userId) {
      rowIndex = index + 2;
    }
  });

  var nextId = userId || getNextNumericId_(items);
  var currentPassword = '';
  if (rowIndex > 0) {
    currentPassword = String(sheet.getRange(rowIndex, 5).getValue() || '').trim();
  }

  var normalized = {
    Id: nextId,
    EmpresaId: String(payload.companyId || payload.EmpresaId || '').trim(),
    Nombre: String(payload.name || payload.Nombre || '').trim(),
    Usuario: username,
    contrasena: String(payload.password || payload.contrasena || '').trim() ? hashPasswordWeb_(payload.password || payload.contrasena || '') : currentPassword,
    Rol: normalizeUserRole_(String(payload.role || payload.Rol || ''), username),
    Estado: String(payload.active || payload.Estado || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI',
    CreadoEn: rowIndex > 0 ? String(sheet.getRange(rowIndex, 8).getValue() || '').trim() : new Date().toISOString()
  };

  if (!normalized.contrasena) {
    throw new Error('Debes indicar la clave del usuario.');
  }

  var rowValues = headers.map(function(header) { return normalized[header] != null ? normalized[header] : ''; });
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return listUsersWeb_();
}

function setUserActiveWeb_(id, active) {
  var sheet = getUsersSheet_();
  var items = readSimpleItems_(sheet);
  var targetRow = -1;
  for (var i = 0; i < items.length; i += 1) {
    if (String(items[i].Id || '').trim() === String(id || '').trim()) {
      targetRow = i + 2;
      break;
    }
  }
  if (targetRow === -1) throw new Error('No se encontro el usuario.');
  sheet.getRange(targetRow, 7).setValue(String(active || 'SI').trim().toUpperCase() === 'NO' ? 'NO' : 'SI');
  return listUsersWeb_();
}

function readCompaniesWeb_() {
  return readSimpleItems_(getCompaniesSheet_()).map(function(item) {
    return {
      id: String(item.id || '').trim(),
      name: String(item.nombre || '').trim(),
      nit: String(item.nit || '').trim(),
      phone: String(item.telefono || '').trim(),
      email: String(item.email || '').trim(),
      contact: String(item.contacto || '').trim(),
      status: String(item.estado || 'ACTIVA').trim()
    };
  });
}

function readLicensesWeb_() {
  return readSimpleItems_(getLicensesSheet_()).map(function(item) {
    return {
      id: String(item.id || '').trim(),
      companyId: String(item.empresa_id || '').trim(),
      code: String(item.codigo_licencia || '').trim(),
      customerName: String(item.cliente_nombre || '').trim(),
      customerDocument: String(item.cliente_documento || '').trim(),
      companyName: String(item.empresa_nombre || '').trim(),
      phone: String(item.telefono || '').trim(),
      email: String(item.email || '').trim(),
      installationId: String(item.equipo_id || '').trim(),
      installationName: String(item.equipo_nombre || '').trim(),
      plan: String(item.plan || 'ANUAL').trim(),
      maxDevices: Number(item.max_equipos || 1),
      activatedAt: String(item.fecha_activacion || '').trim(),
      expiresAt: String(item.fecha_vencimiento || '').trim(),
      status: String(item.estado || 'ACTIVA').trim(),
      notes: String(item.observaciones || '').trim()
    };
  });
}

function readLicenseDevicesWeb_() {
  return readSimpleItems_(getLicenseDevicesSheet_()).map(function(item) {
    return {
      id: String(item.id || '').trim(),
      licenseId: String(item.licencia_id || '').trim(),
      installationId: String(item.equipo_id || '').trim(),
      installationName: String(item.equipo_nombre || '').trim(),
      firstActivatedAt: String(item.primera_activacion || '').trim(),
      lastValidatedAt: String(item.ultima_validacion || '').trim(),
      status: String(item.estado || 'ACTIVO').trim()
    };
  });
}

function readLicenseHistoryWeb_() {
  return readSimpleItems_(getLicenseHistorySheet_()).map(function(item) {
    return {
      id: String(item.id || '').trim(),
      licenseId: String(item.licencia_id || '').trim(),
      eventType: String(item.tipo_evento || '').trim(),
      detail: String(item.detalle || '').trim(),
      installationId: String(item.equipo_id || '').trim(),
      installationName: String(item.equipo_nombre || '').trim(),
      createdAt: String(item.creado_en || '').trim()
    };
  });
}

function getLicensingOverviewWeb_() {
  return {
    companies: readCompaniesWeb_(),
    licenses: readLicensesWeb_(),
    devices: readLicenseDevicesWeb_(),
    history: readLicenseHistoryWeb_(),
    users: listUsersWeb_()
  };
}

function saveCompanyWeb_(payload) {
  var sheet = getCompaniesSheet_();
  var items = readSimpleItems_(sheet);
  var id = String(payload.id || '').trim();
  var rowIndex = -1;
  var now = new Date().toISOString();
  for (var i = 0; i < items.length; i += 1) {
    if (String(items[i].id || '').trim() === id && id) {
      rowIndex = i + 2;
      break;
    }
  }
  var nextId = id || getNextNumericId_(items);
  var normalized = {
    id: nextId,
    nombre: String(payload.name || payload.nombre || '').trim(),
    nit: String(payload.nit || '').trim(),
    telefono: String(payload.phone || payload.telefono || '').trim(),
    email: String(payload.email || '').trim(),
    contacto: String(payload.contact || payload.contacto || '').trim(),
    estado: String(payload.status || payload.estado || 'ACTIVA').trim().toUpperCase() === 'INACTIVA' ? 'INACTIVA' : 'ACTIVA',
    creada_en: rowIndex > 0 ? String(sheet.getRange(rowIndex, 8).getValue() || '').trim() : now,
    actualizada_en: now
  };
  if (!normalized.nombre) throw new Error('Debes indicar el nombre de la empresa.');
  var rowValues = COMPANY_HEADERS.map(function(header) { return normalized[header] != null ? normalized[header] : ''; });
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return getLicensingOverviewWeb_();
}

function saveLicenseWeb_(payload) {
  var sheet = getLicensesSheet_();
  var items = readSimpleItems_(sheet);
  var id = String(payload.id || '').trim();
  var code = String(payload.code || payload.codigo_licencia || '').trim();
  var rowIndex = -1;
  var now = new Date().toISOString();
  if (!code) throw new Error('Debes indicar el codigo de licencia.');
  for (var i = 0; i < items.length; i += 1) {
    var currentId = String(items[i].id || '').trim();
    var currentCode = String(items[i].codigo_licencia || '').trim();
    if (currentCode === code && currentId !== id) {
      throw new Error('Ya existe una licencia con ese codigo.');
    }
    if (currentId === id && id) {
      rowIndex = i + 2;
    }
  }
  var nextId = id || getNextNumericId_(items);
  var normalized = {
    id: nextId,
    empresa_id: String(payload.companyId || payload.empresa_id || '').trim(),
    codigo_licencia: code,
    cliente_nombre: String(payload.customerName || payload.cliente_nombre || 'Cliente licencia').trim(),
    cliente_documento: String(payload.customerDocument || payload.cliente_documento || '').trim(),
    empresa_nombre: String(payload.companyName || payload.empresa_nombre || '').trim(),
    telefono: String(payload.phone || payload.telefono || '').trim(),
    email: String(payload.email || '').trim(),
    equipo_id: rowIndex > 0 ? String(sheet.getRange(rowIndex, 9).getValue() || '').trim() : '',
    equipo_nombre: rowIndex > 0 ? String(sheet.getRange(rowIndex, 10).getValue() || '').trim() : '',
    plan: String(payload.plan || 'ANUAL').trim().toUpperCase() || 'ANUAL',
    max_equipos: Math.max(1, Number(payload.maxDevices || payload.max_equipos || 1)),
    fecha_activacion: rowIndex > 0 ? String(sheet.getRange(rowIndex, 13).getValue() || '').trim() : '',
    fecha_vencimiento: normalizeDateValue_(payload.expiresAt || payload.fecha_vencimiento || '') || Utilities.formatDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    estado: normalizeLicenseStatus_(payload.status || payload.estado || 'ACTIVA'),
    observaciones: String(payload.notes || payload.observaciones || '').trim(),
    creada_en: rowIndex > 0 ? String(sheet.getRange(rowIndex, 17).getValue() || '').trim() : now,
    actualizada_en: now
  };
  if (!normalized.empresa_nombre && normalized.empresa_id) {
    var companies = readCompaniesWeb_();
    var company = companies.filter(function(item) { return String(item.id || '').trim() === normalized.empresa_id; })[0];
    normalized.empresa_nombre = company ? String(company.name || '').trim() : '';
  }
  // La empresa es opcional para la licencia; permitimos guardar sin asociar una empresa.
  var rowValues = LICENSE_HEADERS.map(function(header) { return normalized[header] != null ? normalized[header] : ''; });
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  appendLicenseHistoryWeb_(normalized.id, 'GUARDADO', 'Licencia guardada/actualizada.', '', '');
  return getLicensingOverviewWeb_();
}

function validateLicenseWeb_(code) {
  var normalizedCode = String(code || '').trim();
  if (!normalizedCode) throw new Error('Debes ingresar un codigo de licencia.');
  var sheet = getLicensesSheet_();
  var values = sheet.getDataRange().getValues();
  var license = null;

  if (values.length >= 2) {
    var headers = values[0].map(function(header) {
      return String(header).trim();
    });
    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      var row = values[rowIndex];
      var currentCode = String(getRowField_(headers, row, ['codigo_licencia']) || '').trim();
      if (currentCode === normalizedCode) {
        license = mapLicenseWebRow_(headers, row);
        break;
      }
    }
  }

  if (!license) throw new Error('La licencia indicada no existe.');
  if (String(license.status || '').trim().toUpperCase() !== 'ACTIVA') {
    throw new Error('La licencia existe, pero no se encuentra activa.');
  }
  if (license.expiresAt) {
    var expiration = new Date(license.expiresAt);
    if (!isNaN(expiration.getTime()) && expiration.getTime() < Date.now()) {
      throw new Error('La licencia ya se encuentra vencida.');
    }
  }
  return license;
}

function normalizeLicenseStatus_(value) {
  var normalized = String(value || 'ACTIVA').trim().toUpperCase();
  if (normalized === 'PENDIENTE' || normalized === 'BLOQUEADA' || normalized === 'VENCIDA') {
    return normalized;
  }
  if (normalized === 'INACTIVA') {
    return 'BLOQUEADA';
  }
  return 'ACTIVA';
}

function setLicenseStatusWeb_(id, status) {
  var sheet = getLicensesSheet_();
  var items = readSimpleItems_(sheet);
  var rowIndex = -1;
  for (var i = 0; i < items.length; i += 1) {
    if (String(items[i].id || '').trim() === String(id || '').trim()) {
      rowIndex = i + 2;
      break;
    }
  }
  if (rowIndex === -1) throw new Error('No se encontro la licencia indicada.');
  var normalizedStatus = normalizeLicenseStatus_(status || 'ACTIVA');
  sheet.getRange(rowIndex, 15).setValue(normalizedStatus);
  sheet.getRange(rowIndex, 18).setValue(new Date().toISOString());
  appendLicenseHistoryWeb_(id, 'CAMBIO_ESTADO', 'Estado cambiado a ' + normalizedStatus + '.', '', '');
  return getLicensingOverviewWeb_();
}

function assignLicenseToInstallationWeb_(id, installationId, installationName) {
  var sheet = getLicensesSheet_();
  var items = readSimpleItems_(sheet);
  var rowIndex = -1;
  var row = null;
  for (var i = 0; i < items.length; i += 1) {
    if (String(items[i].id || '').trim() === String(id || '').trim()) {
      rowIndex = i + 2;
      row = items[i];
      break;
    }
  }
  if (rowIndex === -1 || !row) throw new Error('No se encontro la licencia indicada.');

  var normalizedInstallationId = String(installationId || '').trim();
  var normalizedInstallationName = String(installationName || '').trim();
  if (!normalizedInstallationId) {
    normalizedInstallationId = 'web-' + String(id || '').trim();
  }
  if (!normalizedInstallationName) {
    normalizedInstallationName = 'Equipo web';
  }

  sheet.getRange(rowIndex, 9).setValue(normalizedInstallationId);
  sheet.getRange(rowIndex, 10).setValue(normalizedInstallationName);
  sheet.getRange(rowIndex, 13).setValue(String(sheet.getRange(rowIndex, 13).getValue() || '').trim() || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
  sheet.getRange(rowIndex, 15).setValue('ACTIVA');
  sheet.getRange(rowIndex, 18).setValue(new Date().toISOString());

  var devicesSheet = getLicenseDevicesSheet_();
  var values = devicesSheet.getDataRange().getValues();
  var headers = values.length ? values[0].map(function(header) { return String(header).trim(); }) : LICENSE_DEVICE_HEADERS.slice();
  var existingRowIndex = -1;
  for (var j = 1; j < values.length; j += 1) {
    var deviceRow = rowToItem_(headers, values[j]);
    if (String(deviceRow.licencia_id || '').trim() === String(id || '').trim() && String(deviceRow.equipo_id || '').trim() === normalizedInstallationId) {
      existingRowIndex = j + 1;
      break;
    }
  }

  if (existingRowIndex > 0) {
    devicesSheet.getRange(existingRowIndex, 4).setValue(normalizedInstallationName);
    devicesSheet.getRange(existingRowIndex, 6).setValue(new Date().toISOString());
    devicesSheet.getRange(existingRowIndex, 7).setValue('ACTIVO');
  } else {
    var nextDeviceId = getNextNumericId_(readSimpleItems_(devicesSheet));
    devicesSheet.appendRow([
      nextDeviceId,
      String(id || '').trim(),
      normalizedInstallationId,
      normalizedInstallationName,
      new Date().toISOString(),
      new Date().toISOString(),
      'ACTIVO'
    ]);
  }

  appendLicenseHistoryWeb_(id, 'ASIGNACION', 'Licencia asignada a ' + normalizedInstallationName + '.', normalizedInstallationId, normalizedInstallationName);
  return {
    assigned: true,
    overview: getLicensingOverviewWeb_()
  };
}

function renewLicenseWeb_(id) {
  var sheet = getLicensesSheet_();
  var items = readSimpleItems_(sheet);
  var rowIndex = -1;
  var row = null;
  for (var i = 0; i < items.length; i += 1) {
    if (String(items[i].id || '').trim() === String(id || '').trim()) {
      rowIndex = i + 2;
      row = items[i];
      break;
    }
  }
  if (rowIndex === -1 || !row) throw new Error('No se encontro la licencia indicada.');
  var baseDate = row.fecha_vencimiento ? new Date(row.fecha_vencimiento) : new Date();
  if (isNaN(baseDate.getTime()) || baseDate.getTime() < Date.now()) {
    baseDate = new Date();
  }
  baseDate.setFullYear(baseDate.getFullYear() + 1);
  sheet.getRange(rowIndex, 14).setValue(Utilities.formatDate(baseDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'));
  sheet.getRange(rowIndex, 15).setValue('ACTIVA');
  sheet.getRange(rowIndex, 18).setValue(new Date().toISOString());
  appendLicenseHistoryWeb_(id, 'RENOVACION', 'Licencia renovada manualmente.', '', '');
  return getLicensingOverviewWeb_();
}

function releaseLicenseDeviceWeb_(licenseId, installationId) {
  var devicesSheet = getLicenseDevicesSheet_();
  var values = devicesSheet.getDataRange().getValues();
  var headers = values.length ? values[0].map(function(header) { return String(header).trim(); }) : LICENSE_DEVICE_HEADERS.slice();
  for (var i = values.length - 1; i >= 1; i -= 1) {
    var row = rowToItem_(headers, values[i]);
    if (String(row.licencia_id || '').trim() === String(licenseId || '').trim() && String(row.equipo_id || '').trim() === String(installationId || '').trim()) {
      devicesSheet.deleteRow(i + 1);
    }
  }
  appendLicenseHistoryWeb_(licenseId, 'LIBERACION_EQUIPO', 'Equipo liberado manualmente.', installationId, '');
  return getLicensingOverviewWeb_();
}

function appendLicenseHistoryWeb_(licenseId, eventType, detail, installationId, installationName) {
  var sheet = getLicenseHistorySheet_();
  var items = readSimpleItems_(sheet);
  var nextId = getNextNumericId_(items);
  sheet.appendRow([
    nextId,
    String(licenseId || '').trim(),
    String(eventType || '').trim(),
    String(detail || '').trim(),
    String(installationId || '').trim(),
    String(installationName || '').trim(),
    new Date().toISOString()
  ]);
}
