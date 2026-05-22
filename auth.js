const SESSION_STORAGE_KEY = "farmapos_session";
const LICENSE_STORAGE_KEY = "farmapos_license";
const PHARMACY_PROFILE_STORAGE_KEY = "farmapos_pharmacy_profile";
const WEB_DB_API_STORAGE_KEY = "farmapos_web_db_api_url";
const AUTH_DEBUG_STORAGE_KEY = "farmapos_auth_debug";
const AUTH_PROMO_SEEN_KEY = "farmapos_auth_promo_seen";
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const AUTH_REQUEST_TIMEOUT_MS = 45000;
const desktopDb = window.farmaposDesktop?.db || null;
const ONLINE_EXCEL_ONLY = true;
const browserStorage = window.sessionStorage;
const persistentStorage = window.localStorage;
const LOGIN_SCOPE = String(document.body?.dataset?.loginScope || "company").trim().toLowerCase();
const WEB_DB_API_URL = resolveWebDbApiUrl();
const DEFAULT_PUBLIC_LOGO = "assets/logo/logo-nubefarma-clean.png";
const DEFAULT_INTERNAL_LOGO = "assets/logo/logo-nubefarma-clean.png";
const AUTH_VERSION_LABEL = "App Nubefarma POS version 1.3.6.7.8";
const MONTHLY_PROMO_SLIDES = [
  {
    src: "assets/promo/nubefarma-promo-01.png",
    alt: "Anuncio promocional del sistema con beneficios y oferta de lanzamiento",
    title: "Nueva Farma POS",
    caption: "Gestion inteligente para ventas, inventario, caja y facturacion."
  },
  {
    src: "assets/promo/nubefarma-promo-02.png",
    alt: "Anuncio comercial del sistema con plataforma en la nube y plan mensual",
    title: "Nueva Farma Cloud",
    caption: "Opera tu farmacia en la nube con una experiencia simple, rapida y segura."
  }
];
let cachedAuthVersionLabel = "";
let cachedAuthRuntimeStatus = null;
let authPromoResolver = null;

function isAppsScriptWebDbUrl(url = WEB_DB_API_URL) {
  return /script\.google\.com\/macros\/s\//i.test(String(url || ""));
}

[SESSION_STORAGE_KEY, LICENSE_STORAGE_KEY].forEach((key) => {
  try {
    if (window.location.pathname.toLowerCase().endsWith("/pos.html") || window.location.pathname.toLowerCase().endsWith("pos.html")) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignoramos errores de limpieza del almacenamiento persistente.
  }
});

function resolveWebDbApiUrl() {
  const metaUrl = String(document.querySelector('meta[name="farmapos-web-db-api-url"]')?.content || "").trim();
  if (metaUrl) return metaUrl.replace(/\/+$/, "");
  try {
    const storedUrl = String(window.localStorage.getItem(WEB_DB_API_STORAGE_KEY) || "").trim();
    if (storedUrl) return storedUrl.replace(/\/+$/, "");
  } catch {
    // Ignoramos errores de lectura del almacenamiento.
  }

  const protocol = String(window.location?.protocol || "").toLowerCase();
  const hostname = String(window.location?.hostname || "").trim().toLowerCase();
  const origin = String(window.location?.origin || "").trim();

  if ((protocol === "http:" || protocol === "https:") && origin && hostname && hostname !== "127.0.0.1" && hostname !== "localhost") {
    return origin.replace(/\/+$/, "");
  }

  if (protocol === "http:" || protocol === "https:" || protocol === "file:") {
    return "http://127.0.0.1:8787";
  }

  return "";
}

function isWebDbApiEnabled() {
  return Boolean(WEB_DB_API_URL);
}

async function fetchWebDbApi(path, payload) {
  if (!isWebDbApiEnabled()) {
    throw new Error("No hay una API web configurada para Excel en linea. Inicia la API en http://127.0.0.1:8787 o configura la URL en pos.html.");
  }
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS)
    : null;

  try {
    const isAppsScript = isAppsScriptWebDbUrl();
    const requestUrl = isAppsScript ? WEB_DB_API_URL : `${WEB_DB_API_URL}${path}`;
    const requestBody = isAppsScript
      ? JSON.stringify(buildAppsScriptRequest(path, payload))
      : JSON.stringify(payload || {});
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": isAppsScript ? "text/plain;charset=utf-8" : "application/json"
      },
      signal: controller?.signal,
      body: requestBody
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "No fue posible completar la conexion con Excel en linea.");
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("La validacion esta tardando demasiado. Revisa tu conexion a internet, que el Apps Script este corriendo, y que haya permisos de acceso configurados.");
    }
    if (error instanceof TypeError) {
      throw new Error(`No fue posible conectarse a Excel en linea en ${WEB_DB_API_URL}. Verifica que el servidor este disponible y que la URL sea correcta.`);
    }
    throw error;
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

async function fetchWebDbStatus() {
  if (!isWebDbApiEnabled()) {
    return { ok: false, error: "No hay una API web configurada para Excel en linea." };
  }

  try {
    const requestUrl = isAppsScriptWebDbUrl()
      ? `${WEB_DB_API_URL}?mode=ping`
      : `${WEB_DB_API_URL}/v1/db/status`;
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      return { ok: false, error: data?.error || "No fue posible conectarse a la API web." };
    }
    if (isAppsScriptWebDbUrl()) {
      return {
        ok: true,
        provider: "apps_script",
        message: String(data?.message || "Apps Script responde").trim(),
        timestamp: String(data?.timestamp || "").trim()
      };
    }
    return data.status || { ok: false, error: "La API web no devolvio estado." };
  } catch {
    return {
      ok: false,
      error: `No fue posible conectarse a la API web de Excel en linea en ${WEB_DB_API_URL}. Verifica que el servidor este iniciado.`
    };
  }
}

function getStoredPharmacyProfile() {
  try {
    return JSON.parse(persistentStorage.getItem(PHARMACY_PROFILE_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function buildAppsScriptRequest(path, payload = {}) {
  if (path === "/v1/licenses/validate") {
    return {
      action: "validate_license_web",
      code: String(payload.code || payload.licenseCode || "").trim()
    };
  }

  if (path === "/v1/auth/login") {
    return {
      action: "authenticate_user",
      username: String(payload.username || "").trim(),
      password: String(payload.password || "").trim(),
      code: String(payload.code || payload.licenseCode || "").trim()
    };
  }

  if (path === "/v1/auth/password-reset/request") {
    return {
      action: "request_password_reset",
      username: String(payload.username || "").trim()
    };
  }

  if (path === "/v1/auth/password-reset/confirm") {
    return {
      action: "confirm_password_reset",
      username: String(payload.username || "").trim(),
      code: String(payload.code || "").trim(),
      newPassword: String(payload.newPassword || "").trim()
    };
  }

  throw new Error(`La operacion web ${path} no esta disponible en Apps Script.`);
}

function normalizePharmacyProfile(profile) {
  return {
    name: String(profile?.name || "").trim(),
    logoUrl: normalizeImageSource(profile?.logoUrl || profile?.logo_url || "")
  };
}

function normalizeImageSource(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^file:\/\//i.test(source)) return "";
  if (/^[a-z]:[\\/]/i.test(source)) return "";
  if (/^\\\\/.test(source)) return "";
  return source;
}

function applyLogoWithFallback(imageNode, preferredSrc, fallbackSrc, altText) {
  if (!imageNode) return;
  const safePreferredSrc = normalizeImageSource(preferredSrc);
  const safeFallbackSrc = normalizeImageSource(fallbackSrc) || DEFAULT_PUBLIC_LOGO;
  imageNode.dataset.logoFallback = safeFallbackSrc;
  imageNode.onerror = () => {
    if (imageNode.src !== safeFallbackSrc) {
      imageNode.src = safeFallbackSrc;
    } else {
      imageNode.onerror = null;
    }
  };
  imageNode.src = safePreferredSrc || safeFallbackSrc;
  imageNode.alt = altText;
}

function applyAuthBrand(profile) {
  const normalized = normalizePharmacyProfile(profile);
  const logo = document.querySelector(".auth-card-logo-image");
  const brandNameNode = document.getElementById("authBrandName");

  if (LOGIN_SCOPE === "internal") {
    const logoSrc = DEFAULT_INTERNAL_LOGO;
    const brandName = "Sistema Interno";
    applyLogoWithFallback(logo, logoSrc, DEFAULT_INTERNAL_LOGO, `Logo ${brandName}`);
    if (brandNameNode) {
      brandNameNode.textContent = brandName;
    }
    return;
  }

  const logoSrc = normalized.logoUrl || DEFAULT_PUBLIC_LOGO;
  const brandName = normalized.name || "Sistema Facturacion";

  applyLogoWithFallback(logo, logoSrc, DEFAULT_PUBLIC_LOGO, `Logo ${brandName}`);

  if (brandNameNode) {
    brandNameNode.textContent = brandName;
  }
}

async function getAuthVersionLabel() {
  if (cachedAuthVersionLabel) return cachedAuthVersionLabel;
  cachedAuthVersionLabel = AUTH_VERSION_LABEL;
  return cachedAuthVersionLabel;
}

async function getAuthRuntimeStatus() {
  if (cachedAuthRuntimeStatus) return cachedAuthRuntimeStatus;
  if (!desktopDb?.status) return null;
  try {
    cachedAuthRuntimeStatus = await desktopDb.status();
    return cachedAuthRuntimeStatus;
  } catch {
    return null;
  }
}

function formatAuthRuntimeLabel(status) {
  const runtime = status?.runtime;
  if (!runtime?.backendFile) return "";
  const helper = runtime.hasNormalizeDateTimeValue ? "backend actualizado" : "backend viejo";
  const stamp = runtime.backendFileStamp
    ? new Date(runtime.backendFileStamp).toLocaleString("es-CO", {
        dateStyle: "short",
        timeStyle: "short"
      })
    : "";
  return [helper, stamp].filter(Boolean).join(" Ã‚Â· ");
}

async function renderAuthVersion() {
  const versionLabel = await getAuthVersionLabel();
  const runtimeStatus = await getAuthRuntimeStatus();
  const runtimeLabel = formatAuthRuntimeLabel(runtimeStatus);
  const runtimeTitle = runtimeStatus?.runtime?.backendFile
    ? `Backend: ${runtimeStatus.runtime.backendFile}${runtimeStatus.runtime.executablePath ? `\nEjecutable: ${runtimeStatus.runtime.executablePath}` : ""}`
    : "";
  document.querySelectorAll("[data-app-version]").forEach((node) => {
    node.textContent = versionLabel;
    node.title = runtimeTitle;
    let runtimeNode = node.parentElement?.querySelector("[data-app-runtime]");
    if (!runtimeNode && node.parentElement) {
      runtimeNode = document.createElement("small");
      runtimeNode.className = "auth-runtime";
      runtimeNode.setAttribute("data-app-runtime", "true");
      node.insertAdjacentElement("afterend", runtimeNode);
    }
    if (runtimeNode) {
      runtimeNode.textContent = runtimeLabel || "Runtime sin diagnostico";
      runtimeNode.title = runtimeTitle;
    }
  });
}

async function syncAuthBrandFromApi() {
  if (!ONLINE_EXCEL_ONLY && desktopDb) {
    try {
      const profile = await desktopDb.bootstrap();
      if (profile?.profile) {
        persistentStorage.setItem(PHARMACY_PROFILE_STORAGE_KEY, JSON.stringify(profile.profile));
        applyAuthBrand(profile.profile);
        return;
      }
    } catch {
      // Si falla SQL, intentamos el flujo anterior.
    }
  }

  if (isWebDbApiEnabled()) {
    try {
      const data = await fetchWebDbApi('/v1/auth/bootstrap', {});
      if (data?.profile) {
        persistentStorage.setItem(PHARMACY_PROFILE_STORAGE_KEY, JSON.stringify(data.profile));
        applyAuthBrand(data.profile);
        return;
      }
    } catch {
      // Si falla la API web, usamos lo guardado.
    }
  }
}

function ensureAuthFeedbackUi() {
  if (document.getElementById("appFeedbackModal")) return;

  const shell = document.createElement("div");
  shell.innerHTML = `
    <div class="app-feedback-modal" id="appFeedbackModal" hidden>
      <div class="app-feedback-backdrop"></div>
      <div class="app-feedback-card" role="dialog" aria-modal="true" aria-labelledby="appFeedbackTitle">
        <div class="app-feedback-icon is-success" id="appFeedbackIcon">
          <i class="bi bi-check2-circle"></i>
        </div>
        <div class="app-feedback-copy">
          <h3 id="appFeedbackTitle">Acceso correcto</h3>
          <p id="appFeedbackMessage"></p>
        </div>
        <div class="app-feedback-actions">
          <button type="button" class="btn btn-brand" id="appFeedbackConfirm">Continuar</button>
        </div>
      </div>
    </div>
    <div class="app-loading-overlay" id="appLoadingOverlay" hidden>
      <div class="app-loading-card" role="status" aria-live="polite">
        <div class="app-loading-orbit" aria-hidden="true">
          <span></span>
          <span></span>
          <div class="app-loading-logo">
            <img src="assets/logo/logo-nubefarma-clean.png" alt="">
          </div>
        </div>
        <div class="app-loading-copy">
          <span class="app-loading-kicker">Acceso seguro</span>
          <strong id="appLoadingTitle">Validando acceso</strong>
          <span id="appLoadingMessage">Consultando usuario en linea...</span>
        </div>
        <div class="app-loading-progress" aria-hidden="true"><span></span></div>
        <div class="app-loading-steps" aria-hidden="true">
          <span><i class="bi bi-shield-check"></i> Credenciales</span>
          <span><i class="bi bi-cloud-check"></i> Sesion</span>
          <span><i class="bi bi-speedometer2"></i> Dashboard</span>
        </div>
      </div>
    </div>
    <div class="auth-recovery-modal" id="authRecoveryModal" hidden>
      <div class="auth-recovery-backdrop" data-auth-recovery-close="true"></div>
      <div class="auth-recovery-card" role="dialog" aria-modal="true" aria-labelledby="authRecoveryTitle">
        <button type="button" class="auth-recovery-close" id="authRecoveryClose" aria-label="Cerrar recuperacion">
          <i class="bi bi-x-lg"></i>
        </button>
        <div class="auth-recovery-head">
          <div class="auth-recovery-icon"><i class="bi bi-key-fill"></i></div>
          <div>
            <span>Acceso seguro</span>
            <h3 id="authRecoveryTitle">Recuperar contrasena</h3>
            <p id="authRecoveryLead">Solicita un codigo temporal para crear una nueva clave.</p>
          </div>
        </div>
        <div class="auth-recovery-steps" aria-label="Proceso de recuperacion">
          <span class="is-active" data-recovery-step-pill="request">1. Correo</span>
          <span data-recovery-step-pill="confirm">2. Codigo</span>
          <span data-recovery-step-pill="done">3. Listo</span>
        </div>
        <form class="auth-recovery-form" id="authRecoveryRequestForm" data-recovery-panel="request">
          <label for="authRecoveryUsername">Correo registrado</label>
          <div class="auth-input-shell">
            <i class="bi bi-person-fill"></i>
            <input id="authRecoveryUsername" class="form-control" type="text" autocomplete="username" placeholder="usuario@correo.com" required>
          </div>
          <p class="auth-recovery-note">Solo enviaremos el codigo si ese correo existe como usuario activo.</p>
          <button class="btn btn-brand auth-recovery-submit" type="submit">
            <span>Enviar codigo</span>
            <i class="bi bi-arrow-right"></i>
          </button>
        </form>
        <form class="auth-recovery-form" id="authRecoveryConfirmForm" data-recovery-panel="confirm" hidden>
          <div class="auth-recovery-user">
            <span>Codigo enviado para</span>
            <strong id="authRecoveryTarget">--</strong>
          </div>
          <label for="authRecoveryCode">Codigo temporal</label>
          <div class="auth-input-shell">
            <i class="bi bi-shield-lock-fill"></i>
            <input id="authRecoveryCode" class="form-control" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" required>
          </div>
          <label for="authRecoveryNewPassword">Nueva contrasena</label>
          <div class="auth-password-wrap">
            <i class="bi bi-lock-fill"></i>
            <input id="authRecoveryNewPassword" class="form-control" type="password" autocomplete="new-password" placeholder="Minimo 10 caracteres" required>
            <button class="icon-action auth-password-toggle" id="toggleRecoveryPassword" type="button" aria-label="Mostrar contrasena nueva">
              <i class="bi bi-eye"></i>
            </button>
          </div>
          <p class="auth-recovery-note">El codigo vence en 5 minutos. La clave debe tener mayuscula, minuscula, numero y simbolo.</p>
          <button class="btn btn-brand auth-recovery-submit" type="submit">
            <span>Cambiar contrasena</span>
            <i class="bi bi-check2-circle"></i>
          </button>
        </form>
        <div class="auth-recovery-status" id="authRecoveryStatus" hidden></div>
      </div>
    </div>
    <div class="auth-promo-modal" id="authPromoModal" hidden>
      <div class="auth-promo-backdrop" data-auth-promo-close="true"></div>
      <div class="auth-promo-card" role="dialog" aria-modal="true" aria-labelledby="authPromoTitle">
        <button type="button" class="auth-promo-close" id="authPromoClose" aria-label="Cerrar anuncio">
          <i class="bi bi-x-lg"></i>
        </button>
        <div class="auth-promo-media-shell">
          <img id="authPromoImage" class="auth-promo-image" src="" alt="">
        </div>
        <div class="auth-promo-copy">
          <p class="auth-promo-kicker">Novedad del mes</p>
          <h3 id="authPromoTitle">Nueva Farma POS</h3>
          <p id="authPromoCaption"></p>
        </div>
        <div class="auth-promo-dots" id="authPromoDots" aria-label="Slides promocionales"></div>
        <div class="auth-promo-actions">
          <button type="button" class="btn btn-outline-secondary" id="authPromoPrev">Anterior</button>
          <button type="button" class="btn btn-outline-secondary" id="authPromoNext">Siguiente</button>
          <button type="button" class="btn btn-brand" id="authPromoContinue">Continuar</button>
        </div>
      </div>
    </div>
  `;

  document.body.append(...shell.children);
  document.getElementById("appFeedbackConfirm")?.addEventListener("click", () => {
    const modal = document.getElementById("appFeedbackModal");
    if (modal) modal.hidden = true;
  });
  document.getElementById("authRecoveryClose")?.addEventListener("click", closePasswordRecoveryModal);
  document.querySelector('[data-auth-recovery-close="true"]')?.addEventListener("click", closePasswordRecoveryModal);
  document.getElementById("authRecoveryRequestForm")?.addEventListener("submit", submitPasswordRecoveryRequest);
  document.getElementById("authRecoveryConfirmForm")?.addEventListener("submit", submitPasswordRecoveryConfirm);
  document.getElementById("toggleRecoveryPassword")?.addEventListener("click", () => {
    const input = document.getElementById("authRecoveryNewPassword");
    const button = document.getElementById("toggleRecoveryPassword");
    if (!input || !button) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.innerHTML = `<i class="bi bi-${isPassword ? "eye-slash" : "eye"}"></i>`;
  });
  document.getElementById("authPromoClose")?.addEventListener("click", closeMonthlyPromo);
  document.getElementById("authPromoContinue")?.addEventListener("click", closeMonthlyPromo);
  document.getElementById("authPromoPrev")?.addEventListener("click", () => stepMonthlyPromo(-1));
  document.getElementById("authPromoNext")?.addEventListener("click", () => stepMonthlyPromo(1));
  document.querySelector('[data-auth-promo-close="true"]')?.addEventListener("click", closeMonthlyPromo);
  document.addEventListener("keydown", (event) => {
    const promo = document.getElementById("authPromoModal");
    const recovery = document.getElementById("authRecoveryModal");
    if (recovery && !recovery.hidden && event.key === "Escape") {
      closePasswordRecoveryModal();
      return;
    }
    if (!promo || promo.hidden) return;
    if (event.key === "Escape") closeMonthlyPromo();
    if (event.key === "ArrowLeft") stepMonthlyPromo(-1);
    if (event.key === "ArrowRight") stepMonthlyPromo(1);
  });
}

function renderMonthlyPromoSlide(index = 0) {
  const promo = document.getElementById("authPromoModal");
  if (!promo) return;
  const totalSlides = MONTHLY_PROMO_SLIDES.length;
  if (!totalSlides) return;

  const normalizedIndex = ((Number(index) || 0) % totalSlides + totalSlides) % totalSlides;
  promo.dataset.slideIndex = String(normalizedIndex);
  const slide = MONTHLY_PROMO_SLIDES[normalizedIndex];

  const image = document.getElementById("authPromoImage");
  const title = document.getElementById("authPromoTitle");
  const caption = document.getElementById("authPromoCaption");
  const dots = document.getElementById("authPromoDots");
  const prevButton = document.getElementById("authPromoPrev");
  const nextButton = document.getElementById("authPromoNext");

  if (image) {
    image.classList.remove("is-fallback");
    image.onerror = () => {
      image.onerror = null;
      image.classList.add("is-fallback");
      image.src = "assets/logo/post.png";
      image.alt = "Imagen promocional de Nueva Farma";
    };
    image.src = slide.src;
    image.alt = slide.alt;
  }
  if (title) title.textContent = slide.title;
  if (caption) caption.textContent = slide.caption;
  if (dots) {
    dots.innerHTML = MONTHLY_PROMO_SLIDES.map((item, itemIndex) => `
      <button
        type="button"
        class="auth-promo-dot ${itemIndex === normalizedIndex ? "is-active" : ""}"
        data-auth-promo-index="${itemIndex}"
        aria-label="Ver anuncio ${itemIndex + 1}"
      ></button>
    `).join("");
    dots.querySelectorAll("[data-auth-promo-index]").forEach((button) => {
      button.addEventListener("click", () => {
        renderMonthlyPromoSlide(Number(button.dataset.authPromoIndex || 0));
      });
    });
  }
  if (prevButton) prevButton.disabled = totalSlides <= 1;
  if (nextButton) nextButton.disabled = totalSlides <= 1;
}

function stepMonthlyPromo(direction = 1) {
  const promo = document.getElementById("authPromoModal");
  if (!promo || promo.hidden) return;
  const currentIndex = Number(promo.dataset.slideIndex || 0);
  renderMonthlyPromoSlide(currentIndex + Number(direction || 0));
}

function closeMonthlyPromo() {
  const promo = document.getElementById("authPromoModal");
  if (!promo || promo.hidden) return;
  promo.hidden = true;
  if (authPromoResolver) {
    const resolve = authPromoResolver;
    authPromoResolver = null;
    resolve();
  }
}

async function showMonthlyPromoIfNeeded() {
  if (LOGIN_SCOPE === "internal") return;
  if (!MONTHLY_PROMO_SLIDES.length) return;

  var currentMonth = new Date().toISOString().slice(0, 7);
  try {
    if (persistentStorage.getItem(AUTH_PROMO_SEEN_KEY) === currentMonth) return;
  } catch {
    // Si localStorage falla, mostramos el anuncio igualmente.
  }

  ensureAuthFeedbackUi();
  renderMonthlyPromoSlide(0);

  const promo = document.getElementById("authPromoModal");
  if (!promo) return;

  promo.hidden = false;
  await new Promise((resolve) => {
    authPromoResolver = resolve;
  });

  try {
    persistentStorage.setItem(AUTH_PROMO_SEEN_KEY, currentMonth);
  } catch {
    // Ignoramos errores del almacenamiento local.
  }
}

function getStoredSession() {
  try {
    return JSON.parse(browserStorage.getItem(SESSION_STORAGE_KEY) || persistentStorage.getItem(SESSION_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveAuthDebug(event, payload = {}) {
  try {
    persistentStorage.setItem(AUTH_DEBUG_STORAGE_KEY, JSON.stringify({
      event,
      payload,
      at: new Date().toISOString()
    }));
  } catch {
    // Ignoramos errores de depuracion.
  }
}

function getStoredLicense() {
  try {
    return JSON.parse(browserStorage.getItem(LICENSE_STORAGE_KEY) || persistentStorage.getItem(LICENSE_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function getNormalizedRole(value, options = {}) {
  const role = String(value || "").trim().toLowerCase();
  const username = String(options.username || "").trim().toLowerCase();
  const companyId = String(options.companyId || "").trim();
  const licenseCode = String(options.licenseCode || "").trim();
  const loginScope = String(options.loginScope || LOGIN_SCOPE || "").trim().toLowerCase();
  const hasCompanyContext = Boolean(companyId || licenseCode);
  const isGlobalAdminUser = ["admin", "administrador", "operador"].includes(username);

  if (role.includes("operador")) return "operador";
  if (
    role.includes("admin_empresa") ||
    role.includes("empresa") ||
    role.includes("farmacia") ||
    role.includes("sucursal") ||
    role.includes("negocio") ||
    role.includes("local")
  ) {
    return "admin_empresa";
  }
  if (role.includes("admin")) {
    if (loginScope !== "internal" && hasCompanyContext && !isGlobalAdminUser) {
      return "admin_empresa";
    }
    return "admin";
  }
  if (role.includes("super")) return "supervisor";
  if (role.includes("caj") || role.includes("cash") || role.includes("user")) return "cajero";
  return "cajero";
}

function isSessionExpired(session) {
  const loginAt = String(session?.loginAt || "").trim();
  if (!loginAt) return true;
  const sessionDate = new Date(loginAt);
  if (Number.isNaN(sessionDate.getTime())) return true;
  return Date.now() - sessionDate.getTime() > SESSION_MAX_AGE_MS;
}

function saveLicense(license) {
  const payload = JSON.stringify({
    code: String(license.code || "").trim(),
    companyId: String(license.companyId || license.licenseCompanyId || "").trim(),
    customerName: String(license.customerName || "").trim(),
    companyName: String(license.companyName || "").trim(),
    plan: String(license.plan || "ANUAL").trim(),
    installationId: String(license.installationId || "").trim(),
    installationName: String(license.installationName || "").trim(),
    expiresAt: String(license.expiresAt || "").trim(),
    validatedAt: new Date().toISOString()
  });
  browserStorage.setItem(LICENSE_STORAGE_KEY, payload);
  persistentStorage.setItem(LICENSE_STORAGE_KEY, payload);
  saveAuthDebug("license_saved", JSON.parse(payload));
}

function clearSavedLicense() {
  browserStorage.removeItem(LICENSE_STORAGE_KEY);
  persistentStorage.removeItem(LICENSE_STORAGE_KEY);
}

function getFallbackLicense(user, licenseCode = "") {
  const resolvedCode = String(user?.licenseCode || user?.license?.code || licenseCode || "").trim();
  if (!resolvedCode) return null;

  return {
    code: resolvedCode,
    companyId: String(user?.license?.companyId || user?.licenseCompanyId || user?.companyId || "").trim(),
    customerName: String(user?.license?.customerName || "").trim(),
    companyName: String(user?.license?.companyName || "").trim(),
    plan: String(user?.license?.plan || "ANUAL").trim(),
    installationId: String(user?.license?.installationId || "").trim(),
    installationName: String(user?.license?.installationName || "").trim(),
    expiresAt: String(user?.license?.expiresAt || "").trim()
  };
}

function clearStoredAccess() {
  browserStorage.removeItem(SESSION_STORAGE_KEY);
  browserStorage.removeItem(LICENSE_STORAGE_KEY);
  persistentStorage.removeItem(SESSION_STORAGE_KEY);
  persistentStorage.removeItem(LICENSE_STORAGE_KEY);
  saveAuthDebug("access_cleared");
}

function resetLoginForm(options = {}) {
  const clearLicense = Boolean(options.clearLicense);
  const licenseInput = document.getElementById("loginLicense");
  const usernameInput = document.getElementById("loginUsername");
  const passwordInput = document.getElementById("loginPassword");

  if (clearLicense && licenseInput) {
    licenseInput.value = "";
  }
  if (usernameInput) {
    usernameInput.value = "";
  }
  if (passwordInput) {
    passwordInput.value = "";
    passwordInput.type = "password";
  }

  const togglePassword = document.getElementById("togglePassword");
  if (togglePassword) {
    togglePassword.innerHTML = '<i class="bi bi-eye"></i>';
  }

  const focusTarget = clearLicense && licenseInput ? licenseInput : usernameInput;
  focusTarget?.focus();
}

function renderAssignedLicenseState(license) {
  const field = document.getElementById("loginLicenseField");
  const input = document.getElementById("loginLicense");
  const hint = document.getElementById("loginLicenseHint");
  if (!field || !input || !hint) return;

  field.hidden = true;

  if (LOGIN_SCOPE === "internal") {
    input.value = "";
    hint.textContent = "Usa aqui solo usuarios internos globales del equipo interno.";
    return;
  }

  if (license?.code) {
    input.value = String(license.code || "").trim();
    hint.textContent = `Equipo activado para ${String(license.companyName || "la empresa").trim()}. Solo debes ingresar usuario y contrasena.`;
    return;
  }

  input.value = "";
  hint.textContent = "La licencia se asigna internamente. Si este equipo aun no fue activado, debes hacerlo desde el panel de licencias.";
}

async function validateLicenseWithApi(code) {
  if (!desktopDb && !isWebDbApiEnabled()) {
    throw new Error("La validacion de licencias requiere la app desktop o una Excel en linea conectado.");
  }

  if (!ONLINE_EXCEL_ONLY && desktopDb) {
    try {
      return await desktopDb.validateLicense({ code });
    } catch (error) {
      throw new Error(String(error?.message || error || "").replace(/^Error invoking remote method '[^']+': Error:\s*/i, "").trim());
    }
  }

  try {
    const data = await fetchWebDbApi("/v1/licenses/validate", { code });
    return data.license || null;
  } catch (error) {
    throw new Error(String(error?.message || error || "").trim());
  }
}

async function authenticateWithApi(username, password, code = "") {
  if (!desktopDb && !isWebDbApiEnabled()) {
    throw new Error("Este acceso requiere la app desktop o una Excel en linea conectado.");
  }

  if (desktopDb) {
    let user;
    try {
      user = await desktopDb.authenticate({ username, password, code, loginScope: LOGIN_SCOPE });
    } catch (error) {
      throw new Error(String(error?.message || error || "").replace(/^Error invoking remote method '[^']+': Error:\s*/i, "").trim());
    }

    return {
      id: String(user.id || "").trim(),
      companyId: String(user.companyId || "").trim(),
      username: String(user.username || username).trim(),
      name: String(user.name || username).trim(),
      role: getNormalizedRole(user.role || "user", {
        companyId: user.companyId
      }),
      licenseCode: String(user.licenseCode || user.license?.code || code || "").trim(),
      licenseCompanyId: String(user.licenseCompanyId || "").trim(),
      license: user.license || null
    };
  }

  let user;
  try {
    const data = await fetchWebDbApi("/v1/auth/login", { username, password, code });
    user = data.user || {};
  } catch (error) {
    throw new Error(String(error?.message || error || "").trim());
  }

  return {
    id: String(user.id || "").trim(),
    companyId: String(user.companyId || "").trim(),
    username: String(user.username || username).trim(),
    name: String(user.name || username).trim(),
    role: getNormalizedRole(user.role || "user", {
      username: String(user.username || username).trim(),
      companyId: String(user.companyId || "").trim(),
      licenseCode: String(user.license?.code || code || "").trim(),
      loginScope: LOGIN_SCOPE
    }),
    licenseCode: String(user.licenseCode || user.license?.code || code || "").trim(),
    licenseCompanyId: String(user.licenseCompanyId || "").trim(),
    license: user.license || null
  };
}

function saveSession(user) {
  const payload = JSON.stringify({
    user: user.name,
    userId: user.id,
    companyId: user.companyId || "",
    username: user.username,
    role: user.role,
    loginScope: LOGIN_SCOPE,
    loginAt: new Date().toISOString()
  });
  browserStorage.setItem(SESSION_STORAGE_KEY, payload);
  persistentStorage.setItem(SESSION_STORAGE_KEY, payload);
  saveAuthDebug("session_saved", JSON.parse(payload));
}

function showLoginError(message) {
  const errorBox = document.getElementById("loginError");
  if (!errorBox) return;
  errorBox.hidden = !message;
  errorBox.textContent = message || "";
}

function isStrongPassword(password) {
  const value = String(password || "");
  return value.length >= 10
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value);
}

async function requestPasswordReset(username) {
  return fetchWebDbApi("/v1/auth/password-reset/request", { username });
}

async function confirmPasswordReset(username, code, newPassword) {
  return fetchWebDbApi("/v1/auth/password-reset/confirm", { username, code, newPassword });
}

function setPasswordRecoveryStep(step = "request") {
  const modal = document.getElementById("authRecoveryModal");
  const requestPanel = document.querySelector('[data-recovery-panel="request"]');
  const confirmPanel = document.querySelector('[data-recovery-panel="confirm"]');
  const lead = document.getElementById("authRecoveryLead");
  const status = document.getElementById("authRecoveryStatus");
  if (!modal || !requestPanel || !confirmPanel) return;

  const normalizedStep = String(step || "request");
  requestPanel.hidden = normalizedStep !== "request";
  confirmPanel.hidden = normalizedStep !== "confirm";
  document.querySelectorAll("[data-recovery-step-pill]").forEach((pill) => {
    const value = String(pill.dataset.recoveryStepPill || "");
    const isActive = value === normalizedStep || (normalizedStep === "confirm" && value === "request");
    pill.classList.toggle("is-active", isActive);
  });
  if (lead) {
    lead.textContent = normalizedStep === "confirm"
      ? "Ingresa el codigo de 6 digitos y crea una contrasena nueva."
      : "Solicita un codigo temporal para crear una nueva clave.";
  }
  if (status) {
    status.hidden = true;
    status.textContent = "";
    status.className = "auth-recovery-status";
  }
}

function setPasswordRecoveryStatus(message, variant = "info") {
  const status = document.getElementById("authRecoveryStatus");
  if (!status) return;
  status.hidden = !message;
  status.textContent = message || "";
  status.className = `auth-recovery-status is-${variant}`;
}

function closePasswordRecoveryModal() {
  const modal = document.getElementById("authRecoveryModal");
  if (modal) modal.hidden = true;
}

function openPasswordRecoveryModal() {
  ensureAuthFeedbackUi();
  const currentUsername = String(document.getElementById("loginUsername")?.value || "").trim();
  const modal = document.getElementById("authRecoveryModal");
  const usernameInput = document.getElementById("authRecoveryUsername");
  const codeInput = document.getElementById("authRecoveryCode");
  const passwordInput = document.getElementById("authRecoveryNewPassword");
  if (!modal || !usernameInput) return;

  modal.dataset.recoveryUsername = "";
  usernameInput.value = currentUsername;
  if (codeInput) codeInput.value = "";
  if (passwordInput) {
    passwordInput.value = "";
    passwordInput.type = "password";
  }
  setPasswordRecoveryStep("request");
  modal.hidden = false;
  window.setTimeout(() => usernameInput.focus(), 50);
}

async function submitPasswordRecoveryRequest(event) {
  event.preventDefault();
  const modal = document.getElementById("authRecoveryModal");
  const usernameInput = document.getElementById("authRecoveryUsername");
  const targetNode = document.getElementById("authRecoveryTarget");
  const submitButton = event.currentTarget?.querySelector('button[type="submit"]');
  const username = String(usernameInput?.value || "").trim();
  if (!username) return;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<span>Enviando...</span><i class="bi bi-hourglass-split"></i>';
  }
  try {
    setPasswordRecoveryStatus("Generando codigo temporal...", "info");
    await requestPasswordReset(username);
    if (modal) modal.dataset.recoveryUsername = username;
    if (targetNode) targetNode.textContent = username;
    setPasswordRecoveryStep("confirm");
    setPasswordRecoveryStatus("Codigo temporal enviado al correo registrado. Vence en 5 minutos.", "success");
    window.setTimeout(() => document.getElementById("authRecoveryCode")?.focus(), 50);
  } catch (error) {
    setPasswordRecoveryStatus(error.message || "No fue posible generar el codigo.", "danger");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = '<span>Enviar codigo</span><i class="bi bi-arrow-right"></i>';
    }
  }
}

async function submitPasswordRecoveryConfirm(event) {
  event.preventDefault();
  const modal = document.getElementById("authRecoveryModal");
  const codeInput = document.getElementById("authRecoveryCode");
  const passwordInput = document.getElementById("authRecoveryNewPassword");
  const submitButton = event.currentTarget?.querySelector('button[type="submit"]');
  const username = String(modal?.dataset?.recoveryUsername || "").trim();
  const code = String(codeInput?.value || "").trim();
  const newPassword = String(passwordInput?.value || "").trim();

  if (!username || !code || !newPassword) {
    setPasswordRecoveryStatus("Completa usuario, codigo y nueva contrasena.", "danger");
    return;
  }
  if (!/^\d{6}$/.test(code)) {
    setPasswordRecoveryStatus("El codigo debe tener 6 digitos.", "danger");
    codeInput?.focus();
    return;
  }
  if (!isStrongPassword(newPassword)) {
    setPasswordRecoveryStatus("Usa minimo 10 caracteres con mayuscula, minuscula, numero y simbolo.", "danger");
    passwordInput?.focus();
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<span>Validando...</span><i class="bi bi-hourglass-split"></i>';
  }
  try {
    setPasswordRecoveryStatus("Validando codigo temporal...", "info");
    await confirmPasswordReset(username, code, newPassword);
    document.querySelector('[data-recovery-step-pill="done"]')?.classList.add("is-active");
    setPasswordRecoveryStatus("Contrasena actualizada correctamente.", "success");
    const usernameInput = document.getElementById("loginUsername");
    const loginPasswordInput = document.getElementById("loginPassword");
    if (usernameInput) usernameInput.value = username;
    window.setTimeout(() => {
      closePasswordRecoveryModal();
      if (loginPasswordInput) {
        loginPasswordInput.value = "";
        loginPasswordInput.focus();
      }
    }, 1100);
  } catch (error) {
    setPasswordRecoveryStatus(error.message || "No fue posible cambiar la contrasena.", "danger");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = '<span>Cambiar contrasena</span><i class="bi bi-check2-circle"></i>';
    }
  }
}

async function handlePasswordRecovery() {
  openPasswordRecoveryModal();
}

async function handlePasswordRecoveryLegacy() {
  const currentUsername = String(document.getElementById("loginUsername")?.value || "").trim();
  const username = String(window.prompt("Ingresa tu correo registrado para recuperar la contrasena:", currentUsername) || "").trim();
  if (!username) return;

  try {
    setAuthLoadingState(true, "Generando codigo", "Preparando recuperacion segura...");
    await requestPasswordReset(username);
    setAuthLoadingState(false);
    await showLoginDialog(
      "Codigo temporal",
      "Codigo temporal enviado al correo registrado. Vence en 5 minutos.",
      "warn"
    );

    const code = String(window.prompt("Ingresa el codigo temporal de 6 digitos:") || "").trim();
    if (!code) return;
    const newPassword = String(window.prompt("Nueva contrasena: minimo 10 caracteres, mayuscula, minuscula, numero y simbolo.") || "").trim();
    if (!newPassword) return;
    if (!isStrongPassword(newPassword)) {
      await showLoginDialog("Contrasena debil", "Usa minimo 10 caracteres con mayuscula, minuscula, numero y simbolo.", "danger");
      return;
    }

    setAuthLoadingState(true, "Actualizando clave", "Validando codigo temporal...");
    await confirmPasswordReset(username, code, newPassword);
    setAuthLoadingState(false);
    await showLoginDialog("Contrasena actualizada", "Ya puedes iniciar sesion con tu nueva contrasena.", "success");
    const usernameInput = document.getElementById("loginUsername");
    const passwordInput = document.getElementById("loginPassword");
    if (usernameInput) usernameInput.value = username;
    if (passwordInput) {
      passwordInput.value = "";
      passwordInput.focus();
    }
  } catch (error) {
    setAuthLoadingState(false);
    await showLoginDialog("No fue posible recuperar", error.message || "Intenta de nuevo o contacta al administrador.", "danger");
  }
}

function renderLastAuthDebug() {
  const errorBox = document.getElementById("loginError");
  if (!errorBox) return;
  try {
    const debug = JSON.parse(persistentStorage.getItem(AUTH_DEBUG_STORAGE_KEY) || "null");
    if (!debug?.event) return;
    if (!String(debug.event).startsWith("dashboard_redirect_")) return;
    errorBox.hidden = false;
    errorBox.textContent = `Debug: ${debug.event}`;
  } catch {
    // Ignoramos errores de depuracion.
  }
}

async function showLoginDialog(title, message, variant = "danger") {
  ensureAuthFeedbackUi();
  const modal = document.getElementById("appFeedbackModal");
  const titleNode = document.getElementById("appFeedbackTitle");
  const messageNode = document.getElementById("appFeedbackMessage");
  const iconNode = document.getElementById("appFeedbackIcon");
  if (!modal || !titleNode || !messageNode || !iconNode) return;

  titleNode.textContent = title || "Acceso";
  messageNode.textContent = message || "";
  iconNode.className = `app-feedback-icon is-${variant}`;
  const iconName = variant === "success"
    ? "check2-circle"
    : variant === "warn"
      ? "exclamation-triangle"
      : "shield-exclamation";
  iconNode.innerHTML = `<i class="bi bi-${iconName}"></i>`;
  modal.hidden = false;
}

function getFriendlyLoginError(error) {
  const rawMessage = String(error?.message || "").trim();

  if (rawMessage.includes("Debes ingresar un codigo de licencia")) {
    return {
      title: "Licencia requerida",
      message: "Sistema no reconoce una empresa con licencia activa. Ingresa el codigo de licencia asignado a la empresa.",
      variant: "warn"
    };
  }

  if (rawMessage.includes("La licencia indicada no existe")) {
    return {
      title: "Licencia no reconocida",
      message: "Sistema no reconoce una empresa asociada a esa licencia. Verifica el codigo o contacta al operador.",
      variant: "danger"
    };
  }

  if (rawMessage.includes("no tiene una licencia registrada")) {
    return {
      title: "Empresa sin licencia",
      message: "La empresa de este usuario aun no tiene una licencia registrada en el sistema.",
      variant: "danger"
    };
  }

  if (rawMessage.includes("no tiene una licencia activa")) {
    return {
      title: "Licencia no activa",
      message: "La empresa de este usuario no tiene una licencia activa disponible para operar.",
      variant: "danger"
    };
  }

  if (rawMessage.includes("no se encuentra activa")) {
    return {
      title: "Licencia no activada",
      message: "La empresa existe, pero su licencia aun no esta activada para operar en este equipo.",
      variant: "warn"
    };
  }

  if (rawMessage.includes("ya se encuentra vencida")) {
    return {
      title: "Licencia vencida",
      message: "La licencia de esta empresa ya vencio. Debes renovarla para continuar usando el sistema.",
      variant: "danger"
    };
  }

  if (rawMessage.includes("ya esta asignada a otro equipo")) {
    return {
      title: "Equipo no autorizado",
      message: "Esta licencia ya fue vinculada a otro equipo. Si necesitas moverla, debes liberarla desde el panel de licencias.",
      variant: "danger"
    };
  }

  if (rawMessage.includes("alcanzo el limite")) {
    return {
      title: "Limite de equipos alcanzado",
      message: "La licencia ya uso todos los equipos permitidos. Libera uno desde el panel comercial o amplia la licencia.",
      variant: "danger"
    };
  }

  if (rawMessage.includes("no tiene una empresa asignada")) {
    return {
      title: "Usuario sin empresa",
      message: "Este usuario aun no esta asociado a una empresa. Debes asignarlo desde el panel de administracion.",
      variant: "danger"
    };
  }

  if (rawMessage.includes("no pertenece a la empresa asociada")) {
    return {
      title: "Usuario no autorizado",
      message: "El usuario ingresado no pertenece a la empresa de la licencia suministrada.",
      variant: "danger"
    };
  }

  if (rawMessage.includes("esta asignado a otra empresa")) {
    return {
      title: "Equipo asignado a otra empresa",
      message: "Este equipo esta vinculado a otra empresa. Debes ingresar con el usuario correcto o reasignar la licencia desde el panel comercial.",
      variant: "danger"
    };
  }

  if (rawMessage.includes("tardando demasiado") || rawMessage.includes("conexion a internet")) {
    return {
      title: "Problema de conexion",
      message: "La conexion con Excel en linea (Apps Script) esta tardando. Verifica tu conexion a internet, que Google Apps Script tenga permisos de acceso, y que la URL sea correcta. Intenta de nuevo en unos momentos.",
      variant: "danger"
    };
  }

  if (rawMessage.includes("No fue posible conectarse")) {
    return {
      title: "Servidor no disponible",
      message: "No se puede alcanzar Excel en linea. Verifica que la URL sea correcta y que Google Apps Script este accesible. Si el problema persiste, contacta al administrador.",
      variant: "danger"
    };
  }

  return {
    title: "Acceso no permitido",
    message: rawMessage || "No fue posible validar el acceso. Intenta de nuevo o contacta al administrador.",
    variant: "danger"
  };
}

function setAuthLoadingState(active, title = "Validando acceso", message = "Consultando usuario en linea...") {
  ensureAuthFeedbackUi();
  const overlay = document.getElementById("appLoadingOverlay");
  const titleNode = document.getElementById("appLoadingTitle");
  const messageNode = document.getElementById("appLoadingMessage");
  if (!overlay || !titleNode || !messageNode) return;

  titleNode.textContent = title;
  messageNode.textContent = message;
  overlay.hidden = !active;
}

async function showLoginSuccess(user) {
  ensureAuthFeedbackUi();
  const modal = document.getElementById("appFeedbackModal");
  const titleNode = document.getElementById("appFeedbackTitle");
  const messageNode = document.getElementById("appFeedbackMessage");
  const iconNode = document.getElementById("appFeedbackIcon");
  if (!modal || !titleNode || !messageNode || !iconNode) return;

  titleNode.textContent = "Inicio exitoso";
  messageNode.textContent = `Bienvenido, ${user.name}. Estamos preparando tu dashboard.`;
  iconNode.className = "app-feedback-icon is-success";
  iconNode.innerHTML = '<i class="bi bi-check2-circle"></i>';
  modal.hidden = false;

  await new Promise((resolve) => window.setTimeout(resolve, 900));
  modal.hidden = true;
}

function redirectToDashboard() {
  const dashboardUrl = new URL("dashboard.html", window.location.href).toString();
  saveAuthDebug("redirect_dashboard", {
    dashboardUrl,
    sessionStorageSession: browserStorage.getItem(SESSION_STORAGE_KEY),
    localStorageSession: persistentStorage.getItem(SESSION_STORAGE_KEY),
    sessionStorageLicense: browserStorage.getItem(LICENSE_STORAGE_KEY),
    localStorageLicense: persistentStorage.getItem(LICENSE_STORAGE_KEY)
  });
  try {
    window.location.replace(dashboardUrl);
  } catch {
    window.location.href = dashboardUrl;
  }
}

function setSubmitting(isSubmitting) {
  const submitButton = document.querySelector('#loginForm button[type="submit"]');
  if (!submitButton) return;
  const defaultLabel = LOGIN_SCOPE === "internal" ? "Entrar al panel interno" : "Entrar al sistema";
  submitButton.disabled = isSubmitting;
  submitButton.innerHTML = isSubmitting
    ? '<span>Validando...</span><i class="bi bi-hourglass-split"></i>'
    : `<span>${defaultLabel}</span><i class="bi bi-arrow-right"></i>`;
}

async function setupLoginPage() {
  ensureAuthFeedbackUi();
  applyAuthBrand(getStoredPharmacyProfile());
  syncAuthBrandFromApi();
  renderAuthVersion();
  let existingSession = getStoredSession();
  let existingLicense = getStoredLicense();

  if (existingSession && isSessionExpired(existingSession)) {
    clearStoredAccess();
    existingSession = null;
  }

  const form = document.getElementById("loginForm");
  const licenseInput = document.getElementById("loginLicense");
  const passwordInput = document.getElementById("loginPassword");
  const togglePassword = document.getElementById("togglePassword");
  const recoveryButton = document.getElementById("passwordRecoveryButton");
  let assignedLicense = null;

  if (LOGIN_SCOPE === "internal") {
    clearSavedLicense();
    existingLicense = null;
  }

  if (!ONLINE_EXCEL_ONLY && desktopDb?.assignedLicense && LOGIN_SCOPE !== "internal") {
    desktopDb.assignedLicense()
      .then((license) => {
        assignedLicense = license || null;
        if (assignedLicense?.code) {
          saveLicense(assignedLicense);
          existingLicense = assignedLicense;
        }
        renderAssignedLicenseState(assignedLicense);
        if (LOGIN_SCOPE !== "internal" && licenseInput && existingLicense?.code) {
          licenseInput.value = existingLicense.code;
        }
      })
      .catch(() => {
        renderAssignedLicenseState(null);
      });
  } else {
    renderAssignedLicenseState(null);
  }

  if (LOGIN_SCOPE !== "internal" && licenseInput && existingLicense?.code) {
    licenseInput.value = existingLicense.code;
  }

  await showMonthlyPromoIfNeeded();

  const existingRole = getNormalizedRole(existingSession?.role);
  if (existingSession?.user && ["admin", "operador"].includes(existingRole)) {
    if (LOGIN_SCOPE === "internal") {
      redirectToDashboard();
      return;
    }
    clearStoredAccess();
    existingSession = null;
    existingLicense = null;
  }

  if (LOGIN_SCOPE !== "internal" && existingSession?.user && existingLicense?.code && (desktopDb || isWebDbApiEnabled())) {
    setAuthLoadingState(true, "Validando licencia", "Comprobando licencia activa en Excel en linea...");
    validateLicenseWithApi(existingLicense.code)
      .then(() => {
        redirectToDashboard();
      })
      .catch(() => {
        clearStoredAccess();
      })
      .finally(() => {
        setAuthLoadingState(false);
      });
  }

  togglePassword?.addEventListener("click", () => {
    if (!passwordInput) return;
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.innerHTML = `<i class="bi bi-${isPassword ? "eye-slash" : "eye"}"></i>`;
  });

  recoveryButton?.addEventListener("click", handlePasswordRecovery);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    showLoginError("");
    setSubmitting(true);
    setAuthLoadingState(true);

    const licenseCode = assignedLicense?.code || "";
    const username = document.getElementById("loginUsername")?.value || "";
    const password = passwordInput?.value || "";

    try {
      const user = await authenticateWithApi(username, password, licenseCode);
      if (LOGIN_SCOPE === "internal" && !["admin", "operador"].includes(getNormalizedRole(user.role))) {
        throw new Error("Este acceso interno solo permite usuarios globales del equipo interno.");
      }
      if (LOGIN_SCOPE !== "internal" && ["admin", "operador"].includes(getNormalizedRole(user.role))) {
        throw new Error("Los usuarios globales del equipo interno solo pueden ingresar desde el acceso interno.");
      }
      if (!["admin", "operador"].includes(getNormalizedRole(user.role))) {
        const license = user.license
          || assignedLicense
          || (licenseCode ? await validateLicenseWithApi(licenseCode) : null)
          || getFallbackLicense(user, licenseCode);
        if (!license) {
          throw new Error("Este equipo no tiene una licencia asignada para operar.");
        }
        saveLicense(license);
      } else {
        clearSavedLicense();
      }
      saveSession(user);
      setAuthLoadingState(false);
      redirectToDashboard();
      return;
    } catch (error) {
      const friendlyError = getFriendlyLoginError(error);
      const shouldClearLicense = friendlyError.title !== "Licencia no activada" && friendlyError.title !== "Licencia vencida";
      resetLoginForm({ clearLicense: shouldClearLicense });
      showLoginError("");
      await showLoginDialog(friendlyError.title, friendlyError.message, friendlyError.variant);
    } finally {
      setAuthLoadingState(false);
      setSubmitting(false);
    }
  });
}

setupLoginPage();
