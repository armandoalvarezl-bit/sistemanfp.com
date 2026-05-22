const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'pos.html',
  'login-interno.html',
  'dashboard.html',
  'auth.js',
  'pos.js',
  'farmapos-data.js',
  'pos.css',
  'apps-script-inventario.gs',
  'google-apps-script/apps-script-inventario.gs',
  'support-api/src/server.js',
  'support-api/src/mongo-store.js',
  'electron/main.js',
  'assets/logo/logo-nubefarma-clean.png',
  'assets/logo/post.png',
  'assets/promo/nubefarma-promo-01.png',
  'assets/promo/nubefarma-promo-02.png'
];

const syntaxFiles = [
  'auth.js',
  'pos.js',
  'delivery-orders.js',
  'farmapos-data.js',
  'script.js',
  'setup-db.js',
  'support-api/add-valid-user.js',
  'support-api/src/server.js',
  'support-api/src/mongo-store.js',
  'scripts/build-excel-template.js',
  'scripts/diagnose-desktop.js',
  'scripts/provision-tenant-db.js',
  'scripts/validate-tenant-schema.js',
  'electron/main.js',
  'apps-script-inventario.gs'
];

const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html'));
const problems = [];
const warnings = [];

function relPath(file) {
  return path.join(root, file);
}

function exists(file) {
  return fs.existsSync(relPath(file));
}

function addProblem(message) {
  problems.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

requiredFiles.forEach((file) => {
  if (!exists(file)) {
    addProblem(`Falta archivo requerido: ${file}`);
  }
});

syntaxFiles.forEach((file) => {
  if (!exists(file)) return;
  let checkPath = relPath(file);
  let tempPath = '';
  if (file.endsWith('.gs')) {
    tempPath = path.join(root, '.validate-apps-script.tmp.js');
    fs.copyFileSync(checkPath, tempPath);
    checkPath = tempPath;
  }

  const result = spawnSync(process.execPath, ['--check', checkPath], {
    cwd: root,
    encoding: 'utf8'
  });
  if (tempPath && fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }
  if (result.status !== 0) {
    addProblem(`Error de sintaxis en ${file}: ${(result.stderr || result.stdout || '').trim()}`);
  }
});

htmlFiles.forEach((file) => {
  const html = fs.readFileSync(relPath(file), 'utf8');
  const refs = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((ref) => {
      return ref
        && !ref.startsWith('http://')
        && !ref.startsWith('https://')
        && !ref.startsWith('mailto:')
        && !ref.startsWith('tel:')
        && !ref.startsWith('#')
        && !ref.startsWith('data:');
    });

  refs.forEach((ref) => {
    const cleanRef = ref.split('?')[0].split('#')[0];
    if (!fs.existsSync(path.join(root, cleanRef))) {
      addProblem(`${file} referencia un archivo inexistente: ${ref}`);
    }
  });
});

[
  ['apps-script-inventario.gs', 'google-apps-script/apps-script-inventario.gs'],
  ['README.md', 'docs/README.md'],
  ['INVENTARIO-SETUP.md', 'docs/INVENTARIO-SETUP.md'],
  ['MANUAL-USUARIO.md', 'docs/MANUAL-USUARIO.md']
].forEach(([rootFile, organizedFile]) => {
  if (!exists(rootFile) || !exists(organizedFile)) return;
  const rootContent = fs.readFileSync(relPath(rootFile));
  const organizedContent = fs.readFileSync(relPath(organizedFile));
  if (!rootContent.equals(organizedContent)) {
    addWarning(`Hay copias distintas entre ${rootFile} y ${organizedFile}. Revisa cual es la fuente principal.`);
  }
});

if (warnings.length) {
  console.log('Advertencias:');
  warnings.forEach((warning) => console.log(`- ${warning}`));
}

if (problems.length) {
  console.error('Validacion fallida:');
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}

console.log('Validacion correcta: frontend, backend, scripts, assets y Apps Script estan presentes y sin errores de sintaxis.');
