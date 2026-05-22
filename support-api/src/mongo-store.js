const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

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
  const currentHash = trim(storedPassword);
  if (!currentHash.startsWith('pbkdf2$')) return false;
  const parts = currentHash.split('$');
  if (parts.length !== 4) return false;
  const iterations = Math.max(1, Number(parts[1] || 1));
  const salt = parts[2];
  const expected = Buffer.from(parts[3], 'hex');
  const actual = crypto.pbkdf2Sync(String(password || ''), salt, iterations, expected.length, 'sha256');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function trim(value) {
  return String(value || '').trim();
}

function toIsoDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toObjectId(id) {
  const raw = trim(id);
  if (!raw || !ObjectId.isValid(raw)) return null;
  return new ObjectId(raw);
}

function buildIdQuery(id) {
  const raw = trim(id);
  const objectId = toObjectId(raw);
  if (objectId) {
    return { _id: objectId };
  }
  return { id: raw };
}

function pickDbName(uri, explicitName) {
  if (trim(explicitName)) {
    return trim(explicitName);
  }

  const match = String(uri || '').match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/i);
  if (match && trim(match[1])) {
    return trim(match[1]);
  }

  return 'farmapos';
}

function mapCompanyDoc(doc) {
  return {
    id: trim(doc?._id || doc?.id),
    name: trim(doc?.nombre),
    nit: trim(doc?.nit),
    telefono: trim(doc?.telefono),
    email: trim(doc?.email),
    contacto: trim(doc?.contacto),
    estado: trim(doc?.estado || 'ACTIVA')
  };
}

function mapLicenseDoc(doc) {
  return {
    id: trim(doc?._id || doc?.id),
    companyId: trim(doc?.empresa_id),
    code: trim(doc?.codigo_licencia),
    clientName: trim(doc?.cliente_nombre),
    clientDocument: trim(doc?.cliente_documento),
    companyName: trim(doc?.empresa_nombre),
    telefono: trim(doc?.telefono),
    email: trim(doc?.email),
    deviceId: trim(doc?.equipo_id),
    deviceName: trim(doc?.equipo_nombre),
    plan: trim(doc?.plan),
    maxDevices: Number(doc?.max_equipos || 1),
    activatedAt: toIsoDate(doc?.fecha_activacion),
    expiresAt: toIsoDate(doc?.fecha_vencimiento),
    status: trim(doc?.estado),
    notes: trim(doc?.observaciones)
  };
}

function mapDeviceDoc(doc) {
  return {
    id: trim(doc?._id || doc?.id),
    licenseId: trim(doc?.licencia_id),
    deviceId: trim(doc?.equipo_id),
    deviceName: trim(doc?.equipo_nombre),
    firstActivation: toIsoDate(doc?.primera_activacion),
    lastValidation: toIsoDate(doc?.ultima_validacion),
    status: trim(doc?.estado)
  };
}

function mapHistoryDoc(doc) {
  return {
    id: trim(doc?._id || doc?.id),
    licenseId: trim(doc?.licencia_id),
    eventType: trim(doc?.tipo_evento),
    detail: trim(doc?.detalle),
    deviceId: trim(doc?.equipo_id),
    deviceName: trim(doc?.equipo_nombre),
    createdAt: toIsoDate(doc?.creado_en)
  };
}

async function createMongoStore({ uri, dbName, deviceId, deviceName }) {
  const client = new MongoClient(uri, {
    ignoreUndefined: false
  });
  await client.connect();

  const resolvedDbName = pickDbName(uri, dbName);
  const db = client.db(resolvedDbName);

  const companies = db.collection('empresas');
  const licenses = db.collection('licencias');
  const devices = db.collection('licencias_equipos');
  const history = db.collection('licencias_historial');
  const users = db.collection('usuarios');

  async function ping() {
    await db.command({ ping: 1 });
  }

  async function getLicense(code) {
    if (!trim(code)) return null;
    return licenses.findOne({ codigo_licencia: trim(code) });
  }

  async function authenticateUser(username, password) {
    const user = await users.findOne({ username: trim(username) });
    if (!user || trim(user.activo).toUpperCase() !== 'SI') {
      return null;
    }

    const candidates = hashVariants(trim(password));
    if (!verifyPasswordSecure(password, user.password_hash) && !candidates.includes(trim(user.password_hash))) {
      return null;
    }

    return {
      id: trim(user._id || user.id),
      companyId: trim(user.empresa_id),
      username: trim(user.username),
      name: trim(user.nombre || user.username),
      role: trim(user.rol || 'user').toLowerCase()
    };
  }

  async function findUserForPasswordReset(username) {
    const normalized = trim(username).toLowerCase();
    if (!normalized || !normalized.includes('@')) return null;
    const user = await users.findOne({ username: normalized });
    if (!user || trim(user.activo).toUpperCase() !== 'SI') return null;
    return {
      id: trim(user._id || user.id),
      username: trim(user.username),
      name: trim(user.nombre || user.username)
    };
  }

  async function updateUserPassword(username, passwordHash) {
    await users.updateOne(
      { username: trim(username).toLowerCase() },
      { $set: { password_hash: passwordHash || hashPasswordSecure('') } }
    );
  }

  async function loadLicensingOverview() {
    const [companyDocs, licenseDocs, deviceDocs, historyDocs] = await Promise.all([
      companies.find({}).sort({ nombre: 1 }).toArray(),
      licenses.find({}).sort({ empresa_nombre: 1, codigo_licencia: 1 }).toArray(),
      devices.find({}).sort({ ultima_validacion: -1 }).toArray(),
      history.find({}).sort({ creado_en: -1 }).toArray()
    ]);

    return {
      companies: companyDocs.map(mapCompanyDoc),
      licenses: licenseDocs.map(mapLicenseDoc),
      devices: deviceDocs.map(mapDeviceDoc),
      history: historyDocs.map(mapHistoryDoc)
    };
  }

  async function saveCompany(company) {
    const id = trim(company?.id);
    const name = trim(company?.name || company?.nombre);
    if (!name) {
      throw new Error('Nombre de empresa es requerido.');
    }

    const payload = {
      nombre: name,
      nit: trim(company?.nit),
      telefono: trim(company?.telefono || company?.phone),
      email: trim(company?.email),
      contacto: trim(company?.contacto || company?.contact),
      estado: trim(company?.estado || company?.status || 'ACTIVA').toUpperCase()
    };

    if (id) {
      await companies.updateOne(buildIdQuery(id), { $set: payload });
    } else {
      await companies.insertOne(payload);
    }

    return loadLicensingOverview();
  }

  async function saveLicense(license) {
    const id = trim(license?.id);
    const code = trim(license?.code || license?.codigo || license?.codigo_licencia);
    if (!code) {
      throw new Error('Codigo de licencia es requerido.');
    }

    const payload = {
      empresa_id: trim(license?.companyId || license?.empresa_id),
      codigo_licencia: code,
      cliente_nombre: trim(license?.clientName || license?.customerName || license?.clienteNombre || license?.cliente_nombre),
      cliente_documento: trim(license?.clientDocument || license?.customerDocument || license?.clienteDocumento || license?.cliente_documento),
      empresa_nombre: trim(license?.companyName || license?.empresaNombre || license?.empresa_nombre),
      telefono: trim(license?.telefono || license?.phone),
      email: trim(license?.email),
      equipo_id: trim(license?.deviceId || license?.equipoId),
      equipo_nombre: trim(license?.deviceName || license?.equipoNombre),
      plan: trim(license?.plan || 'ANUAL'),
      max_equipos: Number(license?.maxDevices || license?.max_equipos || 1),
      fecha_activacion: license?.activatedAt ? new Date(license.activatedAt) : null,
      fecha_vencimiento: license?.expiresAt ? new Date(license.expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      estado: trim(license?.status || license?.estado || 'PENDIENTE').toUpperCase(),
      observaciones: trim(license?.notes || license?.observations || license?.observaciones)
    };

    if (id) {
      await licenses.updateOne(buildIdQuery(id), { $set: payload });
    } else {
      await licenses.insertOne(payload);
    }

    return loadLicensingOverview();
  }

  async function assignLicenseToCurrentInstallation(licenseId) {
    const installationId = trim(deviceId || process.env.SUPPORT_API_DEVICE_ID || 'local-device');
    const installationName = trim(deviceName || process.env.SUPPORT_API_DEVICE_NAME || 'Equipo local');
    const now = new Date();

    await licenses.updateOne(buildIdQuery(licenseId), {
      $set: {
        equipo_id: installationId,
        equipo_nombre: installationName,
        estado: 'ACTIVA'
      },
      $setOnInsert: {
        fecha_activacion: now
      }
    });

    const existingDevice = await devices.findOne({
      licencia_id: trim(licenseId),
      equipo_id: installationId
    });

    if (existingDevice) {
      await devices.updateOne(
        { _id: existingDevice._id },
        {
          $set: {
            equipo_nombre: installationName,
            ultima_validacion: now,
            estado: 'ACTIVO'
          }
        }
      );
    } else {
      await devices.insertOne({
        licencia_id: trim(licenseId),
        equipo_id: installationId,
        equipo_nombre: installationName,
        primera_activacion: now,
        ultima_validacion: now,
        estado: 'ACTIVO'
      });
    }

    await history.insertOne({
      licencia_id: trim(licenseId),
      tipo_evento: 'ASIGNACION',
      detalle: `Licencia asignada a ${installationName}`,
      equipo_id: installationId,
      equipo_nombre: installationName,
      creado_en: now
    });

    return {
      assigned: true,
      overview: await loadLicensingOverview()
    };
  }

  async function setLicenseStatus(licenseId, status) {
    const normalizedStatus = trim(status).toUpperCase();
    await licenses.updateOne(buildIdQuery(licenseId), {
      $set: { estado: normalizedStatus }
    });
    await history.insertOne({
      licencia_id: trim(licenseId),
      tipo_evento: 'ESTADO',
      detalle: `Estado cambiado a ${normalizedStatus}`,
      creado_en: new Date()
    });
    return loadLicensingOverview();
  }

  async function renewLicense(licenseId) {
    const current = await licenses.findOne(buildIdQuery(licenseId));
    if (!current) {
      throw new Error('Licencia no encontrada.');
    }

    const baseDate = current.fecha_vencimiento ? new Date(current.fecha_vencimiento) : new Date();
    const nextExpiration = new Date(baseDate);
    nextExpiration.setFullYear(nextExpiration.getFullYear() + 1);

    await licenses.updateOne(buildIdQuery(licenseId), {
      $set: { fecha_vencimiento: nextExpiration }
    });
    await history.insertOne({
      licencia_id: trim(licenseId),
      tipo_evento: 'RENOVACION',
      detalle: 'Fecha de vencimiento renovada',
      creado_en: new Date()
    });
    return loadLicensingOverview();
  }

  async function releaseLicenseDevice(licenseId, installationId) {
    const normalizedLicenseId = trim(licenseId);
    const normalizedDeviceId = trim(installationId);

    const existingDevice = await devices.findOne({
      licencia_id: normalizedLicenseId,
      equipo_id: normalizedDeviceId
    });
    if (!existingDevice) {
      throw new Error('Equipo de licencia no encontrado.');
    }

    await devices.updateOne(
      { _id: existingDevice._id },
      {
        $set: {
          estado: 'LIBERADO',
          ultima_validacion: new Date()
        }
      }
    );

    const license = await licenses.findOne(buildIdQuery(normalizedLicenseId));
    if (license && trim(license.equipo_id) === normalizedDeviceId) {
      await licenses.updateOne(buildIdQuery(normalizedLicenseId), {
        $set: {
          equipo_id: '',
          equipo_nombre: ''
        }
      });
    }

    await history.insertOne({
      licencia_id: normalizedLicenseId,
      tipo_evento: 'LIBERACION',
      detalle: `Equipo ${normalizedDeviceId} liberado`,
      equipo_id: normalizedDeviceId,
      creado_en: new Date()
    });

    return loadLicensingOverview();
  }

  function getStatusInfo() {
    const safeHost = String(uri || '').replace(/\/\/([^:]+):([^@]+)@/i, '//$1:***@');
    return {
      ok: true,
      database: 'MongoDB',
      host: safeHost,
      databaseName: resolvedDbName
    };
  }

  return {
    kind: 'mongo',
    ping,
    getLicense,
    authenticateUser,
    findUserForPasswordReset,
    updateUserPassword,
    loadLicensingOverview,
    saveCompany,
    saveLicense,
    assignLicenseToCurrentInstallation,
    setLicenseStatus,
    renewLicense,
    releaseLicenseDevice,
    getStatusInfo
  };
}

module.exports = {
  createMongoStore
};
