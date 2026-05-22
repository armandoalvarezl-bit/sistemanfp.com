const http = require('http');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const { createMongoStore } = require('./mongo-store');

const MYSQL_CONFIG_PATH = path.join(__dirname, '..', '..', 'db.config.json');
const MONGODB_CONFIG_PATH = path.join(__dirname, '..', '..', 'mongodb.config.json');
const PORT = 8787;
const PASSWORD_RESET_TTL_MS = 5 * 60 * 1000;
const PASSWORD_RESET_LOG_CODES = String(process.env.PASSWORD_RESET_LOG_CODES || '').toLowerCase() === 'true';
const LOGIN_BLOCK_MS = 10 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map();
const passwordResetTokens = new Map();

function loadDbConfig() {
  if (!fs.existsSync(MYSQL_CONFIG_PATH)) {
    throw new Error(`No se encontro el archivo de configuracion de base de datos en ${MYSQL_CONFIG_PATH}`);
  }
  const raw = fs.readFileSync(MYSQL_CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

function loadMongoConfig() {
  if (!fs.existsSync(MONGODB_CONFIG_PATH)) {
    return {};
  }
  const raw = fs.readFileSync(MONGODB_CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400'
};

function respondJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body, 'utf8')
  });
  res.end(body);
}

function respondOptions(res) {
  res.writeHead(204, CORS_HEADERS);
  res.end();
}

function normalizePathname(pathname) {
  const withoutTrailing = pathname.replace(/^\/+|\/+$/g, '');
  return withoutTrailing === '' ? '/' : `/${withoutTrailing}`;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (error) {
        reject(new Error('JSON invalido en el cuerpo de la peticion'));
      }
    });
  });
}

function hashVariants(password) {
  return [
    password,
    crypto.createHash('md5').update(password, 'utf8').digest('hex'),
    crypto.createHash('sha1').update(password, 'utf8').digest('hex'),
    crypto.createHash('sha256').update(password, 'utf8').digest('hex')
  ];
}

function hashPasswordSecure(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(String(password || ''), salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPasswordSecure(password, storedPassword) {
  const currentHash = String(storedPassword || '').trim();
  if (!currentHash.startsWith('pbkdf2$')) return false;
  const parts = currentHash.split('$');
  if (parts.length !== 4) return false;
  const iterations = Math.max(1, Number(parts[1] || 1));
  const salt = parts[2];
  const expected = Buffer.from(parts[3], 'hex');
  const actual = crypto.pbkdf2Sync(String(password || ''), salt, iterations, expected.length, 'sha256');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function isStrongPassword(password) {
  const value = String(password || '');
  return value.length >= 10
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value);
}

function getClientKey(req, username = '') {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || 'local';
  return `${ip}::${normalizeUsername(username)}`;
}

function getLoginBlock(key) {
  const state = loginAttempts.get(key);
  if (!state) return null;
  if (state.blockedUntil && Date.now() < state.blockedUntil) return state;
  if (state.blockedUntil && Date.now() >= state.blockedUntil) {
    loginAttempts.delete(key);
    return null;
  }
  return state;
}

function registerLoginFailure(key) {
  const current = loginAttempts.get(key) || { count: 0, blockedUntil: 0 };
  current.count += 1;
  if (current.count >= MAX_LOGIN_ATTEMPTS) {
    current.blockedUntil = Date.now() + LOGIN_BLOCK_MS;
  }
  loginAttempts.set(key, current);
  return current;
}

function clearLoginFailures(key) {
  loginAttempts.delete(key);
}

async function getLicense(pool, code) {
  if (!code) return null;
  const [rows] = await pool.execute(
    'SELECT id, empresa_id, codigo_licencia, cliente_nombre, empresa_nombre, telefono, email, equipo_id, equipo_nombre, plan, max_equipos, fecha_activacion, fecha_vencimiento, estado FROM licencias WHERE codigo_licencia = ? LIMIT 1',
    [code]
  );
  return rows[0] || null;
}

async function authenticateUser(pool, username, password) {
  const [rows] = await pool.execute(
    'SELECT id, empresa_id, nombre, username, password_hash, rol, activo FROM usuarios WHERE username = ? LIMIT 1',
    [username]
  );
  const user = rows[0];
  if (!user || String(user.activo).toUpperCase() !== 'SI') {
    return null;
  }

  const storedPassword = String(user.password_hash || '');
  const candidates = hashVariants(String(password || ''));
  if (!verifyPasswordSecure(password, storedPassword) && !candidates.includes(storedPassword)) {
    return null;
  }

  return {
    id: String(user.id || '').trim(),
    companyId: String(user.empresa_id || '').trim(),
    username: String(user.username || '').trim(),
    name: String(user.nombre || user.username || '').trim(),
    role: String(user.rol || 'user').trim().toLowerCase()
  };
}

async function findUserForPasswordReset(pool, username) {
  const normalized = normalizeUsername(username);
  if (!normalized || !normalized.includes('@')) return null;
  const [rows] = await pool.execute(
    'SELECT id, nombre, username, activo FROM usuarios WHERE LOWER(username) = ? LIMIT 1',
    [normalized]
  );
  const user = rows[0];
  if (!user || String(user.activo).toUpperCase() !== 'SI') return null;
  return {
    id: String(user.id || '').trim(),
    username: String(user.username || '').trim(),
    name: String(user.nombre || user.username || '').trim()
  };
}

async function updateUserPassword(pool, username, passwordHash) {
  await pool.execute(
    'UPDATE usuarios SET password_hash = ? WHERE LOWER(username) = ? LIMIT 1',
    [passwordHash, normalizeUsername(username)]
  );
}

function mapCompanyRow(row) {
  return {
    id: String(row.id || '').trim(),
    name: String(row.nombre || '').trim(),
    nit: String(row.nit || '').trim(),
    telefono: String(row.telefono || '').trim(),
    email: String(row.email || '').trim(),
    contacto: String(row.contacto || '').trim(),
    estado: String(row.estado || 'ACTIVA').trim()
  };
}

function mapLicenseRow(row) {
  return {
    id: String(row.id || '').trim(),
    companyId: row.empresa_id != null ? String(row.empresa_id).trim() : '',
    code: String(row.codigo_licencia || '').trim(),
    clientName: String(row.cliente_nombre || '').trim(),
    clientDocument: String(row.cliente_documento || '').trim(),
    companyName: String(row.empresa_nombre || '').trim(),
    telefono: String(row.telefono || '').trim(),
    email: String(row.email || '').trim(),
    deviceId: String(row.equipo_id || '').trim(),
    deviceName: String(row.equipo_nombre || '').trim(),
    plan: String(row.plan || '').trim(),
    maxDevices: Number(row.max_equipos || 1),
    activatedAt: row.fecha_activacion ? new Date(row.fecha_activacion).toISOString() : null,
    expiresAt: row.fecha_vencimiento ? new Date(row.fecha_vencimiento).toISOString() : null,
    status: String(row.estado || '').trim(),
    notes: String(row.observaciones || '').trim()
  };
}

function mapDeviceRow(row) {
  return {
    id: String(row.id || '').trim(),
    licenseId: String(row.licencia_id || '').trim(),
    deviceId: String(row.equipo_id || '').trim(),
    deviceName: String(row.equipo_nombre || '').trim(),
    firstActivation: row.primera_activacion ? new Date(row.primera_activacion).toISOString() : null,
    lastValidation: row.ultima_validacion ? new Date(row.ultima_validacion).toISOString() : null,
    status: String(row.estado || '').trim()
  };
}

function mapHistoryRow(row) {
  return {
    id: String(row.id || '').trim(),
    licenseId: String(row.licencia_id || '').trim(),
    eventType: String(row.tipo_evento || '').trim(),
    detail: String(row.detalle || '').trim(),
    deviceId: String(row.equipo_id || '').trim(),
    deviceName: String(row.equipo_nombre || '').trim(),
    createdAt: row.creado_en ? new Date(row.creado_en).toISOString() : null
  };
}

async function loadLicensingOverview(pool) {
  const [companyRows] = await pool.execute('SELECT id, nombre, nit, telefono, email, contacto, estado FROM empresas');
  const [licenseRows] = await pool.execute('SELECT id, empresa_id, codigo_licencia, cliente_nombre, cliente_documento, empresa_nombre, telefono, email, equipo_id, equipo_nombre, plan, max_equipos, fecha_activacion, fecha_vencimiento, estado, observaciones FROM licencias');
  const [deviceRows] = await pool.execute('SELECT id, licencia_id, equipo_id, equipo_nombre, primera_activacion, ultima_validacion, estado FROM licencias_equipos');
  const [historyRows] = await pool.execute('SELECT id, licencia_id, tipo_evento, detalle, equipo_id, equipo_nombre, creado_en FROM licencias_historial ORDER BY creado_en DESC');

  return {
    companies: companyRows.map(mapCompanyRow),
    licenses: licenseRows.map(mapLicenseRow),
    devices: deviceRows.map(mapDeviceRow),
    history: historyRows.map(mapHistoryRow)
  };
}

async function saveCompany(pool, company) {
  const id = String(company?.id || '').trim();
  const name = String(company?.name || company?.nombre || '').trim();
  if (!name) {
    throw new Error('Nombre de empresa es requerido.');
  }
  const nit = String(company?.nit || '').trim();
  const telefono = String(company?.telefono || company?.phone || '').trim();
  const email = String(company?.email || '').trim();
  const contacto = String(company?.contacto || company?.contact || '').trim();
  const estado = String(company?.estado || company?.status || 'ACTIVA').trim().toUpperCase();

  if (id) {
    await pool.execute(
      'UPDATE empresas SET nombre = ?, nit = ?, telefono = ?, email = ?, contacto = ?, estado = ? WHERE id = ?',
      [name, nit, telefono, email, contacto, estado, id]
    );
  } else {
    await pool.execute(
      'INSERT INTO empresas (nombre, nit, telefono, email, contacto, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [name, nit, telefono, email, contacto, estado]
    );
  }

  return loadLicensingOverview(pool);
}

async function saveLicense(pool, license) {
  const id = String(license?.id || '').trim();
  const code = String(license?.code || license?.codigo || license?.codigo_licencia || '').trim();
  if (!code) {
    throw new Error('Codigo de licencia es requerido.');
  }
  const companyId = license?.companyId ? Number(license.companyId) : null;
  const clientName = String(license?.clientName || license?.customerName || license?.clienteNombre || license?.cliente_nombre || '').trim();
  const clientDocument = String(license?.clientDocument || license?.customerDocument || license?.clienteDocumento || license?.cliente_documento || '').trim();
  const companyName = String(license?.companyName || license?.empresaNombre || license?.empresa_nombre || '').trim();
  const telefono = String(license?.telefono || license?.phone || '').trim();
  const email = String(license?.email || '').trim();
  const deviceId = String(license?.deviceId || license?.equipoId || '').trim();
  const deviceName = String(license?.deviceName || license?.equipoNombre || '').trim();
  const plan = String(license?.plan || '').trim() || 'ANUAL';
  const maxDevices = Number(license?.maxDevices || license?.max_equipos || 1);
  const activatedAt = license?.activatedAt ? new Date(license.activatedAt) : null;
  const expiresAt = license?.expiresAt ? new Date(license.expiresAt) : null;
  const status = String(license?.status || license?.estado || 'PENDIENTE').trim().toUpperCase();
  const notes = String(license?.notes || license?.observations || license?.observaciones || '').trim();

  const activationValue = activatedAt ? activatedAt.toISOString().slice(0, 19).replace('T', ' ') : null;
  const expirationValue = expiresAt ? expiresAt.toISOString().slice(0, 10) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  if (id) {
    await pool.execute(
      `UPDATE licencias SET empresa_id = ?, codigo_licencia = ?, cliente_nombre = ?, cliente_documento = ?, empresa_nombre = ?, telefono = ?, email = ?, equipo_id = ?, equipo_nombre = ?, plan = ?, max_equipos = ?, fecha_activacion = ?, fecha_vencimiento = ?, estado = ?, observaciones = ? WHERE id = ?`,
      [companyId, code, clientName, clientDocument, companyName, telefono, email, deviceId, deviceName, plan, maxDevices, activationValue, expirationValue, status, notes, id]
    );
  } else {
    await pool.execute(
      `INSERT INTO licencias (empresa_id, codigo_licencia, cliente_nombre, cliente_documento, empresa_nombre, telefono, email, equipo_id, equipo_nombre, plan, max_equipos, fecha_activacion, fecha_vencimiento, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, code, clientName, clientDocument, companyName, telefono, email, deviceId, deviceName, plan, maxDevices, activationValue, expirationValue, status, notes]
    );
  }

  return loadLicensingOverview(pool);
}

async function assignLicenseToCurrentInstallation(pool, licenseId) {
  const [licenseRows] = await pool.execute('SELECT * FROM licencias WHERE id = ? LIMIT 1', [licenseId]);
  if (!licenseRows.length) {
    throw new Error('Licencia no encontrada.');
  }

  const installationId = process.env.SUPPORT_API_DEVICE_ID || 'local-device';
  const installationName = process.env.SUPPORT_API_DEVICE_NAME || 'Equipo local';

  await pool.execute(
    'UPDATE licencias SET equipo_id = ?, equipo_nombre = ?, estado = ?, fecha_activacion = IF(fecha_activacion IS NULL, NOW(), fecha_activacion) WHERE id = ?',
    [installationId, installationName, 'ACTIVA', licenseId]
  );

  const [existingRows] = await pool.execute(
    'SELECT id FROM licencias_equipos WHERE licencia_id = ? AND equipo_id = ? LIMIT 1',
    [licenseId, installationId]
  );

  if (existingRows.length) {
    await pool.execute(
      'UPDATE licencias_equipos SET equipo_nombre = ?, ultima_validacion = NOW(), estado = ? WHERE id = ?',
      [installationName, 'ACTIVO', existingRows[0].id]
    );
  } else {
    await pool.execute(
      'INSERT INTO licencias_equipos (licencia_id, equipo_id, equipo_nombre, primera_activacion, ultima_validacion, estado) VALUES (?, ?, ?, NOW(), NOW(), ?)',
      [licenseId, installationId, installationName, 'ACTIVO']
    );
  }

  await pool.execute(
    'INSERT INTO licencias_historial (licencia_id, tipo_evento, detalle, equipo_id, equipo_nombre, creado_en) VALUES (?, ?, ?, ?, ?, NOW())',
    [licenseId, 'ASIGNACION', `Licencia asignada a ${installationName}`, installationId, installationName]
  );

  return {
    assigned: true,
    overview: await loadLicensingOverview(pool)
  };
}

async function setLicenseStatus(pool, licenseId, status) {
  await pool.execute('UPDATE licencias SET estado = ? WHERE id = ?', [status, licenseId]);
  await pool.execute(
    'INSERT INTO licencias_historial (licencia_id, tipo_evento, detalle, creado_en) VALUES (?, ?, ?, NOW())',
    [licenseId, 'ESTADO', `Estado cambiado a ${status}`]
  );
  return loadLicensingOverview(pool);
}

async function renewLicense(pool, licenseId) {
  await pool.execute(
    'UPDATE licencias SET fecha_vencimiento = DATE_ADD(COALESCE(fecha_vencimiento, NOW()), INTERVAL 1 YEAR) WHERE id = ?',
    [licenseId]
  );
  await pool.execute(
    'INSERT INTO licencias_historial (licencia_id, tipo_evento, detalle, creado_en) VALUES (?, ?, ?, NOW())',
    [licenseId, 'RENOVACION', 'Fecha de vencimiento renovada']
  );
  return loadLicensingOverview(pool);
}

async function releaseLicenseDevice(pool, licenseId, installationId) {
  const [rows] = await pool.execute(
    'SELECT id FROM licencias_equipos WHERE licencia_id = ? AND equipo_id = ? LIMIT 1',
    [licenseId, installationId]
  );
  if (!rows.length) {
    throw new Error('Equipo de licencia no encontrado.');
  }

  await pool.execute('UPDATE licencias_equipos SET estado = ? WHERE id = ?', ['BLOQUEADO', rows[0].id]);
  await pool.execute(
    'INSERT INTO licencias_historial (licencia_id, tipo_evento, detalle, equipo_id, creado_en) VALUES (?, ?, ?, ?, NOW())',
    [licenseId, 'LIBERACION', `Equipo ${installationId} liberado`, installationId]
  );

  return loadLicensingOverview(pool);
}

async function createMysqlStore() {
  const dbConfig = loadDbConfig();
  const pool = mysql.createPool({
    host: dbConfig.host || '127.0.0.1',
    port: Number(dbConfig.port || 3306),
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    timezone: 'Z'
  });

  return {
    kind: 'mysql',
    ping: async () => {
      await pool.query('SELECT 1');
    },
    getLicense: (code) => getLicense(pool, code),
    authenticateUser: (username, password) => authenticateUser(pool, username, password),
    findUserForPasswordReset: (username) => findUserForPasswordReset(pool, username),
    updateUserPassword: (username, passwordHash) => updateUserPassword(pool, username, passwordHash),
    loadLicensingOverview: () => loadLicensingOverview(pool),
    saveCompany: (company) => saveCompany(pool, company),
    saveLicense: (license) => saveLicense(pool, license),
    assignLicenseToCurrentInstallation: (licenseId) => assignLicenseToCurrentInstallation(pool, licenseId),
    setLicenseStatus: (licenseId, status) => setLicenseStatus(pool, licenseId, status),
    renewLicense: (licenseId) => renewLicense(pool, licenseId),
    releaseLicenseDevice: (licenseId, installationId) => releaseLicenseDevice(pool, licenseId, installationId),
    getStatusInfo: () => ({
      ok: true,
      database: 'MariaDB',
      host: dbConfig.host || '127.0.0.1',
      databaseName: dbConfig.database || '',
      port: Number(dbConfig.port || 3306)
    })
  };
}

async function createDataStore() {
  const mongoConfig = loadMongoConfig();
  const mongoUri = String(process.env.MONGODB_URI || mongoConfig.uri || '').trim();

  if (mongoUri) {
    return createMongoStore({
      uri: mongoUri,
      dbName: String(process.env.MONGODB_DB_NAME || mongoConfig.dbName || '').trim(),
      deviceId: String(process.env.SUPPORT_API_DEVICE_ID || mongoConfig.deviceId || '').trim(),
      deviceName: String(process.env.SUPPORT_API_DEVICE_NAME || mongoConfig.deviceName || '').trim()
    });
  }

  return createMysqlStore();
}

async function createServer() {
  const store = await createDataStore();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const pathName = normalizePathname(url.pathname);

    if (req.method === 'OPTIONS') {
      return respondOptions(res);
    }

    try {
      if (req.method === 'GET' && pathName === '/v1/db/status') {
        await store.ping();
        return respondJson(res, 200, {
          ok: true,
          status: store.getStatusInfo()
        });
      }

      if (req.method === 'GET' && pathName === '/') {
        return respondJson(res, 200, {
          ok: true,
          message: `Support API de ${store.kind === 'mongo' ? 'MongoDB' : 'MariaDB'} funcionando`,
          endpoints: [
            'GET /v1/db/status',
            'POST /v1/auth/login',
            'POST /v1/auth/password-reset/request',
            'POST /v1/auth/password-reset/confirm',
            'POST /v1/licenses/validate',
            'GET /v1/licensing/overview',
            'POST /v1/licensing/companies',
            'POST /v1/licensing/licenses',
            'POST /v1/licensing/licenses/{id}/assign-current',
            'POST /v1/licensing/licenses/{id}/status',
            'POST /v1/licensing/licenses/{id}/renew',
            'POST /v1/licensing/licenses/{id}/devices/{installationId}/release'
          ]
        });
      }

      if (req.method === 'POST' && pathName === '/v1/auth/login') {
        const body = await parseJsonBody(req);
        const username = normalizeUsername(body.username);
        const password = String(body.password || '').trim();
        const code = String(body.code || body.licenseCode || '').trim();
        const loginKey = getClientKey(req, username);
        const loginBlock = getLoginBlock(loginKey);

        if (!username || !password) {
          return respondJson(res, 400, { ok: false, error: 'Usuario y contrasena son requeridos.' });
        }
        if (loginBlock?.blockedUntil) {
          return respondJson(res, 429, { ok: false, error: 'Demasiados intentos fallidos. Espera 10 minutos antes de intentar de nuevo.' });
        }

        const user = await store.authenticateUser(username, password);
        if (!user) {
          registerLoginFailure(loginKey);
          return respondJson(res, 401, { ok: false, error: 'Usuario o contrasena invalidos.' });
        }
        clearLoginFailures(loginKey);

        const license = await store.getLicense(code);
        return respondJson(res, 200, {
          ok: true,
          user: {
            ...user,
            licenseCode: license?.codigo_licencia || code,
            licenseCompanyId: String(license?.empresa_id || '').trim(),
            license: license
              ? {
                  id: String(license.id || license._id || '').trim(),
                  code: String(license.codigo_licencia || '').trim(),
                  companyId: String(license.empresa_id || '').trim(),
                  companyName: String(license.empresa_nombre || '').trim(),
                  status: String(license.estado || '').trim(),
                  expiresAt: license.fecha_vencimiento ? new Date(license.fecha_vencimiento).toISOString() : null,
                  plan: String(license.plan || '').trim(),
                  maxDevices: Number(license.max_equipos || 1)
                }
              : null
          }
        });
      }

      if (req.method === 'POST' && pathName === '/v1/auth/password-reset/request') {
        const body = await parseJsonBody(req);
        const username = normalizeUsername(body.username);

        if (!username) {
          return respondJson(res, 400, { ok: false, error: 'Debes ingresar el correo registrado como usuario.' });
        }

        if (!username.includes('@')) {
          return respondJson(res, 400, { ok: false, error: 'Ingresa un correo valido registrado como usuario.' });
        }

        if (!store.findUserForPasswordReset) {
          return respondJson(res, 501, { ok: false, error: 'Recuperacion de contrasena no disponible en este origen de datos.' });
        }

        const user = await store.findUserForPasswordReset(username);
        if (!user) {
          return respondJson(res, 404, { ok: false, error: 'Este correo no aparece como usuario activo en la app.' });
        }

        const resetKey = `reset::${username}`;
        const existing = passwordResetTokens.get(resetKey);
        if (existing && Date.now() < existing.expiresAt - 12 * 60 * 1000) {
          return respondJson(res, 429, { ok: false, error: 'Ya se solicito un codigo hace poco. Espera unos minutos antes de pedir otro.' });
        }

        const code = String(crypto.randomInt(100000, 1000000));
        passwordResetTokens.set(resetKey, {
          codeHash: crypto.createHash('sha256').update(code, 'utf8').digest('hex'),
          expiresAt: Date.now() + PASSWORD_RESET_TTL_MS,
          attempts: 0
        });
        if (PASSWORD_RESET_LOG_CODES) {
          console.log(`[password-reset] Codigo temporal generado para un correo registrado (vence en 5 minutos): ${code}`);
        }

        return respondJson(res, 200, {
          ok: true,
          message: 'Codigo temporal enviado al correo registrado.'
        });
      }

      if (req.method === 'POST' && pathName === '/v1/auth/password-reset/confirm') {
        const body = await parseJsonBody(req);
        const username = normalizeUsername(body.username);
        const code = String(body.code || '').trim();
        const newPassword = String(body.newPassword || body.password || '').trim();
        const resetKey = `reset::${username}`;
        const state = passwordResetTokens.get(resetKey);

        if (!username || !code || !newPassword) {
          return respondJson(res, 400, { ok: false, error: 'Correo, codigo y nueva contrasena son requeridos.' });
        }
        if (!username.includes('@')) {
          return respondJson(res, 400, { ok: false, error: 'Codigo invalido o vencido.' });
        }
        if (!isStrongPassword(newPassword)) {
          return respondJson(res, 400, { ok: false, error: 'La nueva contrasena debe tener minimo 10 caracteres, mayuscula, minuscula, numero y simbolo.' });
        }
        if (!state || Date.now() > state.expiresAt) {
          passwordResetTokens.delete(resetKey);
          return respondJson(res, 400, { ok: false, error: 'Codigo invalido o vencido.' });
        }
        if (state.attempts >= 5) {
          passwordResetTokens.delete(resetKey);
          return respondJson(res, 429, { ok: false, error: 'Demasiados intentos con el codigo. Solicita uno nuevo.' });
        }

        const codeHash = crypto.createHash('sha256').update(code, 'utf8').digest('hex');
        if (codeHash !== state.codeHash) {
          state.attempts += 1;
          passwordResetTokens.set(resetKey, state);
          return respondJson(res, 400, { ok: false, error: 'Codigo invalido o vencido.' });
        }

        if (!store.updateUserPassword) {
          return respondJson(res, 501, { ok: false, error: 'Recuperacion de contrasena no disponible en este origen de datos.' });
        }
        await store.updateUserPassword(username, hashPasswordSecure(newPassword));
        passwordResetTokens.delete(resetKey);
        clearLoginFailures(getClientKey(req, username));
        return respondJson(res, 200, { ok: true, message: 'Contrasena actualizada correctamente.' });
      }

      if (req.method === 'POST' && pathName === '/v1/licenses/validate') {
        const body = await parseJsonBody(req);
        const code = String(body.code || body.licenseCode || '').trim();
        if (!code) {
          return respondJson(res, 400, { ok: false, error: 'Codigo de licencia requerido.' });
        }
        const license = await store.getLicense(code);
        if (!license) {
          return respondJson(res, 404, { ok: false, error: 'Licencia no encontrada.' });
        }
        if (String(license.estado || '').toUpperCase() !== 'ACTIVA') {
          return respondJson(res, 403, { ok: false, error: `Licencia no valida: ${String(license.estado || '').toUpperCase()}` });
        }
        return respondJson(res, 200, {
          ok: true,
          license: {
            id: String(license.id || license._id || '').trim(),
            code: String(license.codigo_licencia || '').trim(),
            companyId: String(license.empresa_id || '').trim(),
            companyName: String(license.empresa_nombre || '').trim(),
            status: String(license.estado || '').trim(),
            expiresAt: license.fecha_vencimiento ? new Date(license.fecha_vencimiento).toISOString() : null,
            plan: String(license.plan || '').trim(),
            maxDevices: Number(license.max_equipos || 1)
          }
        });
      }

      if (req.method === 'GET' && pathName === '/v1/licensing/overview') {
        const overview = await store.loadLicensingOverview();
        return respondJson(res, 200, {
          ok: true,
          overview
        });
      }

      if (req.method === 'POST' && pathName === '/v1/licensing/companies') {
        const body = await parseJsonBody(req);
        const overview = await store.saveCompany(body);
        return respondJson(res, 200, {
          ok: true,
          overview
        });
      }

      if (req.method === 'POST' && pathName === '/v1/licensing/licenses') {
        const body = await parseJsonBody(req);
        const overview = await store.saveLicense(body);
        return respondJson(res, 200, {
          ok: true,
          overview
        });
      }

      const assignMatch = pathName.match(/^\/v1\/licensing\/licenses\/([^/]+)\/assign-current$/i);
      if (req.method === 'POST' && assignMatch) {
        const licenseId = decodeURIComponent(assignMatch[1]);
        const response = await store.assignLicenseToCurrentInstallation(licenseId);
        return respondJson(res, 200, {
          ok: true,
          response
        });
      }

      const statusMatch = pathName.match(/^\/v1\/licensing\/licenses\/([^/]+)\/status$/i);
      if (req.method === 'POST' && statusMatch) {
        const licenseId = decodeURIComponent(statusMatch[1]);
        const body = await parseJsonBody(req);
        const status = String(body.status || '').trim().toUpperCase();
        if (!status) {
          return respondJson(res, 400, { ok: false, error: 'Estado de licencia requerido.' });
        }
        const overview = await store.setLicenseStatus(licenseId, status);
        return respondJson(res, 200, {
          ok: true,
          overview
        });
      }

      const renewMatch = pathName.match(/^\/v1\/licensing\/licenses\/([^/]+)\/renew$/i);
      if (req.method === 'POST' && renewMatch) {
        const licenseId = decodeURIComponent(renewMatch[1]);
        const overview = await store.renewLicense(licenseId);
        return respondJson(res, 200, {
          ok: true,
          overview
        });
      }

      const releaseMatch = pathName.match(/^\/v1\/licensing\/licenses\/([^/]+)\/devices\/([^/]+)\/release$/i);
      if (req.method === 'POST' && releaseMatch) {
        const licenseId = decodeURIComponent(releaseMatch[1]);
        const installationId = decodeURIComponent(releaseMatch[2]);
        const overview = await store.releaseLicenseDevice(licenseId, installationId);
        return respondJson(res, 200, {
          ok: true,
          overview
        });
      }

      return respondJson(res, 404, { ok: false, error: 'Recurso no encontrado.' });
    } catch (error) {
      console.error('Error procesando solicitud:', error);
      return respondJson(res, 500, { ok: false, error: String(error.message || 'Error interno del servidor') });
    }
  });

  server.listen(PORT, () => {
    console.log(`Support API de ${store.kind === 'mongo' ? 'MongoDB' : 'MariaDB'} escuchando en http://127.0.0.1:${PORT}`);
  });
}

createServer().catch((error) => {
  console.error('No se pudo iniciar el servidor support-api:', error);
  process.exit(1);
});
