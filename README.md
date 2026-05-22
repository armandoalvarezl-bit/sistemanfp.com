<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="farmapos-web-db-api-url" content="https://script.google.com/macros/s/AKfycby36Qa2zAAwPYRfKKMqoIwV0RRvICzGtbiWt0rl2PeDZjxNTEtnhVVnLimO1jZBPgbt5Q/exec">
  <title>Nube Farma | Acceso Interno</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="pos.css">
</head>
<body class="auth-body" data-login-scope="internal">
  <main class="login-page-container">
    <section class="login-hero">
      <div class="login-hero-overlay login-hero-overlay-internal"></div>
      <div class="login-hero-content">
        <div class="login-hero-brand">
          <div class="login-hero-brandmark">
            <img src="assets/logo/logo-nubefarma-clean.png" alt="Nueva Farma" />
          </div>
          <h1 class="login-hero-tag"><span>Panel interno</span><span class="hero-accent">Nube Farma</span></h1>
          <p class="login-hero-subtitle">Soporte, licencias y operacion central</p>
        </div>

        <p class="login-hero-copy">Gestiona empresas, usuarios, licencias y solicitudes de soporte desde el centro de control.</p>

        <div class="login-hero-features">
          <article class="feature-card">
            <div class="feature-icon"><i class="bi bi-shield-check"></i></div>
            <strong>Acceso privado</strong>
            <p>Entrada reservada para el equipo autorizado de administracion y soporte.</p>
          </article>
          <article class="feature-card">
            <div class="feature-icon"><i class="bi bi-bar-chart-line"></i></div>
            <strong>Control central</strong>
            <p>Administra clientes, licencias y usuarios desde una misma vista.</p>
          </article>
          <article class="feature-card">
            <div class="feature-icon"><i class="bi bi-speedometer2"></i></div>
            <strong>Respuesta rapida</strong>
            <p>Entra al panel y atiende solicitudes sin interrumpir la operacion.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="auth-card auth-card-internal auth-card-login">
      <div class="auth-card-frame">
        <div class="auth-card-header">
          <img class="auth-card-header-logo" src="assets/logo/logo-nubefarma-clean.png" alt="Nueva Farma">
        </div>

        <div class="auth-head">
          <h2>Equipo Nube Farma</h2>
          <p>Ingresa con tu cuenta interna para administrar soporte, licencias y empresas.</p>
        </div>

        <form id="loginForm" class="form-stack auth-form">
          <div class="auth-form-panel">
            <div class="auth-form-fields">
              <div class="form-field">
                <label for="loginUsername">Usuario interno</label>
                <div class="auth-input-shell">
                  <i class="bi bi-person-fill"></i>
                  <input id="loginUsername" class="form-control" type="text" autocomplete="username" placeholder="correo interno" required>
                </div>
              </div>
              <div class="form-field">
                <label for="loginPassword">Contrasena</label>
                <div class="auth-password-wrap">
                  <i class="bi bi-lock-fill"></i>
                  <input id="loginPassword" class="form-control" type="password" autocomplete="current-password" placeholder="Ingresa tu contrasena" required>
                  <button class="icon-action auth-password-toggle" id="togglePassword" type="button" aria-label="Mostrar contrasena">
                    <i class="bi bi-eye"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="auth-form-bottom">
              <div class="auth-form-hint">
                <i class="bi bi-lock-fill"></i>
                <span id="loginLicenseHint">Este acceso es exclusivo del equipo interno y no requiere licencia de empresa.</span>
              </div>
              <button class="btn btn-brand w-100 auth-submit" type="submit">
                <span>Entrar al panel</span>
                <i class="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </form>

        <div class="auth-access-switch auth-access-switch-bottom">
          <button class="auth-access-link auth-recovery-link" id="passwordRecoveryButton" type="button">
            <i class="bi bi-key"></i>
            <span>Recuperar contrasena</span>
          </button>
          <a class="auth-access-link" href="pos.html">
            <i class="bi bi-building"></i>
            <span>Volver al acceso de empresas</span>
          </a>
        </div>

        <div class="auth-error" id="loginError" hidden></div>
        <div class="auth-version" data-app-version>Nube Farma POS version 1.3.6.7.8</div>
      </div>
    </section>
  </main>

  <script src="auth.js"></script>
</body>
</html>
