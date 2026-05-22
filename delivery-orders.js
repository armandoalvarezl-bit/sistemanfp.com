const DELIVERY_API_URL = "https://script.google.com/macros/s/AKfycby36Qa2zAAwPYRfKKMqoIwV0RRvICzGtbiWt0rl2PeDZjxNTEtnhVVnLimO1jZBPgbt5Q/exec";
const DELIVERY_TAX_RATE = 0.19;
const DELIVERY_ORDER_STATUS_KEY = "farmapos_delivery_order_status";
const DELIVERY_LAST_TRACKING_KEY = "farmapos_delivery_last_tracking";
const DELIVERY_PHARMACY_PROFILE_KEY = "farmapos_pharmacy_profile";
const DELIVERY_DEFAULT_LOGO = "assets/logo/logo-farmapos.png";
const DELIVERY_STATUS_STEPS = ["pendiente", "preparando", "despachado", "en_camino", "entregado"];
const DELIVERY_STATUS_LABELS = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  despachado: "Despachado",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado"
};
const DELIVERY_STATUS_DESCRIPTIONS = {
  pendiente: "Recibimos tu pedido y esta pendiente de preparacion.",
  preparando: "El equipo esta preparando los productos.",
  despachado: "El pedido ya fue despachado desde la tienda.",
  en_camino: "El domiciliario va en camino con tu compra.",
  entregado: "El pedido fue entregado correctamente.",
  cancelado: "El pedido fue cancelado."
};

const deliveryState = {
  products: [],
  sales: [],
  cart: new Map()
};

function deliveryEscape(value = "") {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function deliveryCurrency(value = 0) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getDeliveryCompanyProfile() {
  let profile = {};
  try {
    profile = JSON.parse(localStorage.getItem(DELIVERY_PHARMACY_PROFILE_KEY) || "null") || {};
  } catch {
    profile = {};
  }
  return {
    name: String(profile.name || "Sistema Facturacion").trim(),
    nit: String(profile.nit || "").trim(),
    phone: String(profile.phone || "").trim(),
    email: String(profile.email || "").trim(),
    address: String(profile.address || "").trim(),
    city: String(profile.city || "").trim(),
    logoUrl: String(profile.logoUrl || profile.logo_url || DELIVERY_DEFAULT_LOGO).trim()
  };
}

function deliveryToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

function deliveryTime() {
  return new Date().toLocaleTimeString("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

async function deliveryFetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("La respuesta del servidor no es JSON valido.");
  }
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `Error HTTP ${response.status}`);
  }
  return data;
}

function normalizeDeliveryProduct(item = {}) {
  const id = String(item.id || item.sku || item.nombre || item.name || crypto.randomUUID()).trim();
  const name = String(item.nombre || item.name || "Producto").trim();
  return {
    id,
    sku: String(item.sku || "").trim(),
    name,
    category: String(item.categoria || item.category || "general").trim().toLowerCase(),
    price: Number(item.precio ?? item.price ?? 0),
    stock: Number(item.stock ?? 0),
    description: String(item.descripcion || item.description || "").trim(),
    imageUrl: String(item.imagen_url || item.imageUrl || item.image || "").trim(),
    active: String(item.activo || item.active || "SI").trim().toUpperCase()
  };
}

function normalizeDeliverySale(sale = {}) {
  let items = Array.isArray(sale.items) ? sale.items : [];
  if (!items.length && sale.items_json) {
    try {
      items = JSON.parse(String(sale.items_json || "[]"));
    } catch {
      items = [];
    }
  }
  const rawDeliveryStatus = String(sale.deliveryStatus || sale.domicilio_estado || "").trim().toLowerCase();
  const deliveryStatus = rawDeliveryStatus === "en camino" || rawDeliveryStatus === "camino" ? "en_camino" : rawDeliveryStatus;
  return {
    id: String(sale.id || "").trim(),
    ticketNumber: String(sale.ticketNumber || sale.ticket_numero || "").trim(),
    clientName: String(sale.clientName || sale.cliente_nombre || "Cliente").trim(),
    clientDocument: String(sale.clientDocument || sale.cliente_documento || "").trim(),
    date: String(sale.date || sale.fecha || "").trim(),
    time: String(sale.time || sale.hora || "").trim(),
    paymentMethod: String(sale.paymentMethod || sale.metodo_pago || "").trim(),
    subtotal: Number(sale.subtotal || 0),
    tax: Number(sale.tax || sale.impuesto || 0),
    total: Number(sale.total || 0),
    deliveryStatus,
    deliveryUpdatedAt: String(sale.deliveryUpdatedAt || sale.domicilio_actualizado_en || "").trim(),
    items: Array.isArray(items) ? items : []
  };
}

function isDeliveryOrder(sale) {
  return /domicilio|pedido web|orden web/i.test(String(sale?.paymentMethod || ""));
}

function getDeliveryMeta(sale) {
  const metaItem = (sale.items || []).find((item) => item?.deliveryMeta);
  if (metaItem?.deliveryMeta) return metaItem.deliveryMeta;
  const documentText = String(sale.clientDocument || "");
  return {
    phone: (documentText.match(/Tel:\s*([^|]+)/i)?.[1] || "").trim(),
    address: (documentText.match(/Dir:\s*([^|]+)/i)?.[1] || "").trim(),
    notes: (documentText.match(/Nota:\s*([^|]+)/i)?.[1] || "").trim()
  };
}

function getStoredDeliveryStatuses() {
  try {
    return JSON.parse(localStorage.getItem(DELIVERY_ORDER_STATUS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function setStoredDeliveryStatus(id, status) {
  const statuses = getStoredDeliveryStatuses();
  statuses[id] = status;
  localStorage.setItem(DELIVERY_ORDER_STATUS_KEY, JSON.stringify(statuses));
}

function getDeliveryOrderStatus(order) {
  const remoteStatus = String(order?.deliveryStatus || "").trim().toLowerCase();
  if (remoteStatus) return remoteStatus;
  return getStoredDeliveryStatuses()[order.id] || "pendiente";
}

function getDeliveryStatusLabel(status) {
  return DELIVERY_STATUS_LABELS[status] || DELIVERY_STATUS_LABELS.pendiente;
}

function getDeliveryStatusDescription(status) {
  return DELIVERY_STATUS_DESCRIPTIONS[status] || DELIVERY_STATUS_DESCRIPTIONS.pendiente;
}

function getDeliveryStatusStepIndex(status) {
  if (status === "cancelado") return -1;
  return Math.max(0, DELIVERY_STATUS_STEPS.indexOf(status));
}

function getDeliveryStatusProgressHtml(status) {
  const activeIndex = getDeliveryStatusStepIndex(status);
  return `
    <div class="delivery-track-steps">
      ${DELIVERY_STATUS_STEPS.map((step, index) => `
        <span class="${index <= activeIndex ? "is-active" : ""} ${step === status ? "is-current" : ""}">
          <i class="bi ${index <= activeIndex ? "bi-check-lg" : "bi-circle"}"></i>
          ${deliveryEscape(getDeliveryStatusLabel(step))}
        </span>
      `).join("")}
    </div>
  `;
}

function getOrderSearchText(order) {
  const meta = getDeliveryMeta(order);
  return [
    order.id,
    order.ticketNumber,
    order.clientName,
    order.clientDocument,
    meta.phone,
    meta.address,
    order.items.map((item) => item.name).join(" ")
  ].join(" ").toLowerCase();
}

function findDeliveryOrderByTrackingQuery(query) {
  const normalized = String(query || "").trim().toLowerCase();
  const numeric = normalized.replace(/\D/g, "");
  if (!normalized) return null;
  return deliveryState.sales
    .filter(isDeliveryOrder)
    .slice()
    .reverse()
    .find((order) => {
      const meta = getDeliveryMeta(order);
      const ticket = String(order.ticketNumber || "").toLowerCase();
      const phone = String(meta.phone || "").replace(/\D/g, "");
      return ticket.includes(normalized) || order.id.toLowerCase() === normalized || (numeric && phone.endsWith(numeric));
    }) || null;
}

function findDeliveryOrderById(orderId) {
  const id = String(orderId || "").trim();
  if (!id) return null;
  return deliveryState.sales.find((order) => order.id === id || order.ticketNumber === id) || null;
}

function buildDeliveryGuideHtml(order) {
  const meta = getDeliveryMeta(order);
  const status = getDeliveryOrderStatus(order);
  const company = getDeliveryCompanyProfile();
  const companyLocation = [company.address, company.city].filter(Boolean).join(" | ");
  const companyContact = [company.phone, company.email].filter(Boolean).join(" | ");
  const guideNumber = order.ticketNumber || order.id || "PEDIDO-DOMICILIO";
  const baseHref = new URL(".", window.location.href).href;
  const logoBlock = company.logoUrl
    ? `<img class="brand-logo" src="${deliveryEscape(company.logoUrl)}" alt="Logo ${deliveryEscape(company.name)}">`
    : `<div class="brand-monogram">${deliveryEscape(company.name.slice(0, 2).toUpperCase() || "SF")}</div>`;
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td>${deliveryEscape(item.name || "Producto")}</td>
      <td>${deliveryEscape(item.sku || item.id || "-")}</td>
      <td>${Number(item.quantity || 1)}</td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <base href="${deliveryEscape(baseHref)}">
      <title>Guia de envio ${deliveryEscape(guideNumber)}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 28px;
          color: #111827;
          background: #eef4f8;
          font-family: Arial, sans-serif;
        }
        .guide {
          max-width: 760px;
          margin: 0 auto;
          overflow: hidden;
          border: 1px solid #d5dee9;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 24px 60px rgba(17, 36, 58, .16);
        }
        .guide-head {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          padding: 22px;
          color: #fff;
          background: linear-gradient(135deg, #10243f, #0a8c67);
        }
        .brand {
          display: grid;
          grid-template-columns: 72px minmax(0, 1fr);
          gap: 14px;
          align-items: center;
        }
        .brand-logo,
        .brand-monogram {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          background: rgba(255,255,255,.96);
        }
        .brand-logo {
          object-fit: contain;
          padding: 8px;
        }
        .brand-monogram {
          display: grid;
          place-items: center;
          color: #10243f;
          font-size: 24px;
          font-weight: 900;
        }
        .guide-head span,
        .box span {
          display: block;
          color: #607086;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .guide-head span {
          color: rgba(255,255,255,.74);
        }
        .guide-head strong {
          display: block;
          margin-top: 3px;
          font-size: 22px;
          overflow-wrap: anywhere;
        }
        .guide-head p {
          margin: 5px 0 0;
          color: rgba(255,255,255,.78);
          font-size: 12px;
          line-height: 1.35;
        }
        .status {
          align-self: start;
          padding: 9px 13px;
          border: 1px solid rgba(255,255,255,.42);
          border-radius: 999px;
          background: rgba(255,255,255,.12);
          color: #fff;
          font-weight: 900;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .guide-code {
          padding: 18px 22px;
          border-bottom: 1px solid #e3e9f1;
          background: #f8fbff;
        }
        .guide-code span {
          display: block;
          color: #607086;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .guide-code strong {
          display: block;
          margin-top: 3px;
          color: #10243f;
          font-family: "Courier New", monospace;
          font-size: 28px;
          letter-spacing: .04em;
        }
        .guide-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #e3e9f1;
        }
        .box {
          min-height: 96px;
          padding: 16px;
          border-right: 1px solid #e3e9f1;
        }
        .box:nth-child(2n) { border-right: 0; }
        .box strong {
          display: block;
          margin-top: 6px;
          font-size: 18px;
          overflow-wrap: anywhere;
        }
        .box p {
          margin: 6px 0 0;
          color: #33465f;
          line-height: 1.4;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 10px 12px;
          border-bottom: 1px solid #d7dee8;
          text-align: left;
          font-size: 13px;
        }
        th {
          color: #607086;
          font-size: 11px;
          text-transform: uppercase;
        }
        .guide-foot {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 18px 22px 22px;
          background: #fbfdff;
        }
        .signature {
          min-height: 76px;
          border: 1px dashed #607086;
          display: grid;
          align-content: end;
          padding: 10px;
          color: #607086;
          font-size: 12px;
          text-align: center;
        }
        .barcode {
          display: grid;
          place-items: center;
          min-height: 76px;
          border: 1px solid #d7dee8;
          font-family: "Courier New", monospace;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: .08em;
        }
        @media print {
          body { padding: 0; background: #fff; }
          .guide { max-width: none; border-radius: 0; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <main class="guide">
        <section class="guide-head">
          <div class="brand">
            ${logoBlock}
            <div>
              <span>Guia de envio domicilio</span>
              <strong>${deliveryEscape(company.name)}</strong>
              ${company.nit ? `<p>NIT ${deliveryEscape(company.nit)}</p>` : ""}
              ${companyLocation ? `<p>${deliveryEscape(companyLocation)}</p>` : ""}
              ${companyContact ? `<p>${deliveryEscape(companyContact)}</p>` : ""}
            </div>
          </div>
          <div class="status">${deliveryEscape(getDeliveryStatusLabel(status))}</div>
        </section>
        <section class="guide-code">
          <span>Codigo de guia</span>
          <strong>${deliveryEscape(guideNumber)}</strong>
        </section>
        <section class="guide-grid">
          <div class="box">
            <span>Destinatario</span>
            <strong>${deliveryEscape(order.clientName || "Cliente")}</strong>
            <p>Tel: ${deliveryEscape(meta.phone || "Sin telefono")}</p>
          </div>
          <div class="box">
            <span>Direccion de entrega</span>
            <strong>${deliveryEscape(meta.address || "Sin direccion")}</strong>
            ${meta.notes ? `<p>${deliveryEscape(meta.notes)}</p>` : ""}
          </div>
          <div class="box">
            <span>Remitente</span>
            <strong>${deliveryEscape(company.name)}</strong>
            <p>${deliveryEscape(companyContact || companyLocation || "Pedido creado desde tienda publica")}</p>
          </div>
          <div class="box">
            <span>Resumen</span>
            <strong>${deliveryCurrency(order.total)}</strong>
            <p>${deliveryEscape(order.date)} ${deliveryEscape(order.time)} | ${deliveryEscape(getDeliveryStatusDescription(status))}</p>
          </div>
        </section>
        <table>
          <thead><tr><th>Producto</th><th>Codigo</th><th>Cant.</th></tr></thead>
          <tbody>${itemsHtml || `<tr><td colspan="3">Sin productos</td></tr>`}</tbody>
        </table>
        <section class="guide-foot">
          <div class="signature">Firma recibido</div>
          <div class="barcode">${deliveryEscape(guideNumber)}</div>
        </section>
      </main>
      <script>window.addEventListener("load", () => window.print());</script>
    </body>
    </html>
  `;
}

function buildDeliveryGuideShareText(order) {
  const meta = getDeliveryMeta(order);
  const status = getDeliveryOrderStatus(order);
  const guideNumber = order.ticketNumber || order.id || "PEDIDO-DOMICILIO";
  const itemSummary = order.items.map((item) => `${item.quantity || 1} x ${item.name}`).join(", ");
  return [
    `Guia de envio ${guideNumber}`,
    `Estado: ${getDeliveryStatusLabel(status)}`,
    `Cliente: ${order.clientName || "Cliente"}`,
    `Direccion: ${meta.address || "Sin direccion"}`,
    `Total: ${deliveryCurrency(order.total)}`,
    itemSummary ? `Productos: ${itemSummary}` : ""
  ].filter(Boolean).join("\n");
}

function getDeliveryWhatsappUrl(order) {
  const meta = getDeliveryMeta(order);
  const phone = String(meta.phone || "").replace(/\D/g, "").replace(/^57/, "");
  const text = buildDeliveryGuideShareText(order);
  return phone ? `https://wa.me/57${phone}?text=${encodeURIComponent(text)}` : "";
}

function createDeliveryGuideImageBlob(order) {
  const meta = getDeliveryMeta(order);
  const status = getDeliveryOrderStatus(order);
  const company = getDeliveryCompanyProfile();
  const guideNumber = order.ticketNumber || order.id || "PEDIDO-DOMICILIO";
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  ctx.fillStyle = "#eef4f8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  deliveryCanvasRoundRect(ctx, 60, 60, 960, 1230, 28);
  ctx.fill();

  const gradient = ctx.createLinearGradient(60, 60, 1020, 260);
  gradient.addColorStop(0, "#10243f");
  gradient.addColorStop(1, "#0a8c67");
  ctx.fillStyle = gradient;
  deliveryCanvasRoundRect(ctx, 60, 60, 960, 220, 28);
  ctx.fill();
  ctx.fillRect(60, 230, 960, 50);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 34px Arial";
  ctx.fillText(company.name || "Sistema Facturacion", 210, 135);
  ctx.font = "700 22px Arial";
  ctx.fillText("Guia de envio domicilio", 210, 178);
  ctx.font = "700 20px Arial";
  [company.nit ? `NIT ${company.nit}` : "", [company.phone, company.email].filter(Boolean).join(" | ")].filter(Boolean).forEach((line, index) => {
    ctx.fillText(line, 210, 212 + (index * 28));
  });

  ctx.fillStyle = "rgba(255,255,255,.96)";
  deliveryCanvasRoundRect(ctx, 90, 95, 92, 92, 18);
  ctx.fill();
  ctx.fillStyle = "#10243f";
  ctx.font = "900 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText((company.name || "SF").slice(0, 2).toUpperCase(), 136, 152);
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(255,255,255,.16)";
  deliveryCanvasRoundRect(ctx, 760, 104, 220, 44, 22);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 20px Arial";
  ctx.fillText(getDeliveryStatusLabel(status).toUpperCase(), 790, 133);

  ctx.fillStyle = "#607086";
  ctx.font = "900 18px Arial";
  ctx.fillText("CODIGO DE GUIA", 100, 342);
  ctx.fillStyle = "#10243f";
  ctx.font = "900 44px Courier New";
  ctx.fillText(guideNumber, 100, 398);

  const drawBox = (x, y, w, h, label, value, detail = "") => {
    ctx.fillStyle = "#f8fbff";
    deliveryCanvasRoundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.fillStyle = "#607086";
    ctx.font = "900 18px Arial";
    ctx.fillText(label.toUpperCase(), x + 24, y + 38);
    ctx.fillStyle = "#10243f";
    ctx.font = "800 28px Arial";
    wrapCanvasText(ctx, value || "-", x + 24, y + 76, w - 48, 32, 2);
    if (detail) {
      ctx.fillStyle = "#33465f";
      ctx.font = "600 20px Arial";
      wrapCanvasText(ctx, detail, x + 24, y + h - 42, w - 48, 24, 2);
    }
  };

  drawBox(100, 450, 420, 170, "Destinatario", order.clientName || "Cliente", `Tel: ${meta.phone || "Sin telefono"}`);
  drawBox(560, 450, 420, 170, "Total", deliveryCurrency(order.total), getDeliveryStatusDescription(status));
  drawBox(100, 650, 880, 170, "Direccion", meta.address || "Sin direccion", meta.notes || "");

  ctx.fillStyle = "#607086";
  ctx.font = "900 18px Arial";
  ctx.fillText("PRODUCTOS", 100, 875);
  ctx.fillStyle = "#10243f";
  ctx.font = "700 23px Arial";
  const productLines = order.items.slice(0, 8).map((item) => `${item.quantity || 1} x ${item.name || "Producto"}`);
  productLines.forEach((line, index) => ctx.fillText(line.slice(0, 62), 100, 920 + (index * 34)));

  ctx.strokeStyle = "#c9d3df";
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(100, 1155, 390, 82);
  ctx.setLineDash([]);
  ctx.fillStyle = "#607086";
  ctx.font = "700 18px Arial";
  ctx.fillText("Firma recibido", 230, 1210);

  ctx.fillStyle = "#10243f";
  ctx.font = "900 28px Courier New";
  ctx.textAlign = "center";
  ctx.fillText(guideNumber, 750, 1205);
  ctx.textAlign = "left";

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
}

function deliveryCanvasRoundRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let lines = 0;
  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + (lines * lineHeight));
      line = words[i];
      lines += 1;
      if (lines >= maxLines) return;
    } else {
      line = testLine;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y + (lines * lineHeight));
}

function printDeliveryGuide(order) {
  if (!order) return;
  const printWindow = window.open("", "_blank", "width=820,height=900");
  if (!printWindow) {
    window.alert("El navegador bloqueo la guia de envio. Permite ventanas emergentes e intentalo de nuevo.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(buildDeliveryGuideHtml(order));
  printWindow.document.close();
}

async function shareDeliveryGuideToWhatsapp(order) {
  if (!order) return;
  const whatsappUrl = getDeliveryWhatsappUrl(order);
  const blob = await createDeliveryGuideImageBlob(order);
  if (blob) {
    const file = new File([blob], `${order.ticketNumber || order.id || "guia-domicilio"}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `Guia de envio ${order.ticketNumber || ""}`.trim(),
        text: buildDeliveryGuideShareText(order),
        files: [file]
      });
      return;
    }
  }
  if (whatsappUrl) {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  } else {
    window.alert("Este pedido no tiene telefono para enviar por WhatsApp.");
  }
}


function renderDeliveryTracking(order, message = "") {
  const result = document.getElementById("deliveryTrackingResult");
  if (!result) return;
  if (!order) {
    result.innerHTML = message
      ? `<div class="delivery-tracking-empty">${deliveryEscape(message)}</div>`
      : "";
    return;
  }
  const meta = getDeliveryMeta(order);
  const status = getDeliveryOrderStatus(order);
  const itemSummary = order.items.map((item) => `${item.quantity || 1} x ${item.name}`).join(", ");
  result.innerHTML = `
    <article class="delivery-tracking-card is-${deliveryEscape(status)}">
      <div class="delivery-tracking-status">
        <span>${deliveryEscape(order.ticketNumber || "Pedido domicilio")}</span>
        <strong>${deliveryEscape(getDeliveryStatusLabel(status))}</strong>
        <p>${deliveryEscape(getDeliveryStatusDescription(status))}</p>
      </div>
      ${getDeliveryStatusProgressHtml(status)}
      <div class="delivery-tracking-meta">
        <div><span>Cliente</span><strong>${deliveryEscape(order.clientName)}</strong></div>
        <div><span>Total</span><strong>${deliveryCurrency(order.total)}</strong></div>
        <div><span>Direccion</span><strong>${deliveryEscape(meta.address || "Sin direccion")}</strong></div>
        <div><span>Actualizado</span><strong>${deliveryEscape(order.deliveryUpdatedAt || `${order.date} ${order.time}` || "--")}</strong></div>
      </div>
      <p>${deliveryEscape(itemSummary || "Sin productos")}</p>
      <div class="delivery-tracking-actions">
        <button class="delivery-guide-button" type="button" data-delivery-guide="${deliveryEscape(order.id || order.ticketNumber)}">
          <span>Generar guia de envio</span>
          <i class="bi bi-printer"></i>
        </button>
        <button class="delivery-whatsapp-button" type="button" data-delivery-whatsapp="${deliveryEscape(order.id || order.ticketNumber)}">
          <span>Enviar WhatsApp</span>
          <i class="bi bi-whatsapp"></i>
        </button>
      </div>
    </article>
  `;
}

function getDeliveryProductImage(product) {
  if (product.imageUrl) return `<img src="${deliveryEscape(product.imageUrl)}" alt="${deliveryEscape(product.name)}" loading="lazy">`;
  return `<i class="bi bi-bag-heart"></i>`;
}

async function loadDeliveryProducts() {
  const data = await deliveryFetchJson(`${DELIVERY_API_URL}?mode=all`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  const items = data.items || data.inventory || [];
  deliveryState.products = items
    .map(normalizeDeliveryProduct)
    .filter((item) => item.active !== "NO" && item.stock > 0 && item.price > 0);
  return deliveryState.products;
}

async function loadDeliverySales() {
  const data = await deliveryFetchJson(`${DELIVERY_API_URL}?mode=sales`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  deliveryState.sales = (data.sales || []).map(normalizeDeliverySale);
  return deliveryState.sales;
}

function getDeliveryCartTotals() {
  const items = Array.from(deliveryState.cart.values()).map((item) => ({
    ...item,
    originalSubtotal: Number(item.price || 0) * Number(item.quantity || 0),
    lineTotal: Number(item.price || 0) * Number(item.quantity || 0)
  }));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = Math.round(subtotal * DELIVERY_TAX_RATE);
  return { items, subtotal, tax, total: subtotal + tax };
}

function addDeliveryCartItem(id) {
  const product = deliveryState.products.find((item) => item.id === id);
  if (!product) return;
  const current = deliveryState.cart.get(id) || { ...product, quantity: 0 };
  current.quantity = Math.min(Number(product.stock || 0), Number(current.quantity || 0) + 1);
  deliveryState.cart.set(id, current);
  renderDeliveryCart();
}

function changeDeliveryCartItem(id, delta) {
  const current = deliveryState.cart.get(id);
  if (!current) return;
  current.quantity = Math.max(0, Math.min(Number(current.stock || 0), Number(current.quantity || 0) + delta));
  if (!current.quantity) {
    deliveryState.cart.delete(id);
  } else {
    deliveryState.cart.set(id, current);
  }
  renderDeliveryCart();
}

function renderDeliveryStoreProducts() {
  const grid = document.getElementById("deliveryProductGrid");
  if (!grid) return;
  const search = String(document.getElementById("deliverySearchInput")?.value || "").trim().toLowerCase();
  const category = String(document.getElementById("deliveryCategoryFilter")?.value || "all");
  const products = deliveryState.products.filter((product) => {
    const matchesSearch = !search || [product.name, product.sku, product.description, product.category].join(" ").toLowerCase().includes(search);
    const matchesCategory = category === "all" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  grid.innerHTML = products.length
    ? products.map((product) => `
      <article class="delivery-product-card">
        <div class="delivery-product-media">
          ${getDeliveryProductImage(product)}
          <button class="delivery-favorite-button" type="button" aria-hidden="true" tabindex="-1">
            <i class="bi bi-heart"></i>
          </button>
        </div>
        <div class="delivery-product-copy">
          <span>${deliveryEscape(product.category || "general")}</span>
          <strong>${deliveryEscape(product.name)}</strong>
          <p>${deliveryEscape(product.description || `SKU ${product.sku || "sin codigo"}`)}</p>
        </div>
        <div class="delivery-product-foot">
          <div><strong>${deliveryCurrency(product.price)}</strong><span>Stock ${product.stock}</span></div>
          <button class="delivery-icon-button" type="button" data-delivery-add="${deliveryEscape(product.id)}" aria-label="Agregar ${deliveryEscape(product.name)}">
            <i class="bi bi-plus-lg"></i>
          </button>
        </div>
      </article>
    `).join("")
    : `<div class="delivery-empty"><i class="bi bi-search"></i><strong>No encontramos productos</strong><span>Prueba con otra busqueda o categoria.</span></div>`;
}

function renderDeliveryCategoryFilter() {
  const select = document.getElementById("deliveryCategoryFilter");
  if (!select) return;
  const categories = Array.from(new Set(deliveryState.products.map((item) => item.category || "general"))).sort();
  select.innerHTML = `<option value="all">Todas</option>${categories.map((category) => `<option value="${deliveryEscape(category)}">${deliveryEscape(category)}</option>`).join("")}`;
}

function renderDeliveryCart() {
  const list = document.getElementById("deliveryCartList");
  const totalNode = document.getElementById("deliveryCartTotal");
  const countNode = document.getElementById("deliveryCartCount");
  const submitButton = document.getElementById("deliverySubmitOrder");
  const totals = getDeliveryCartTotals();

  if (countNode) countNode.textContent = String(totals.items.reduce((sum, item) => sum + item.quantity, 0));
  if (totalNode) totalNode.textContent = deliveryCurrency(totals.total);
  if (submitButton) submitButton.disabled = !totals.items.length;

  if (!list) return;
  list.innerHTML = totals.items.length
    ? totals.items.map((item) => `
      <article class="delivery-cart-item">
        <div>
          <strong>${deliveryEscape(item.name)}</strong>
          <span>${deliveryCurrency(item.price)} x ${item.quantity}</span>
        </div>
        <div class="delivery-qty">
          <button type="button" data-delivery-dec="${deliveryEscape(item.id)}"><i class="bi bi-dash"></i></button>
          <b>${item.quantity}</b>
          <button type="button" data-delivery-inc="${deliveryEscape(item.id)}"><i class="bi bi-plus"></i></button>
        </div>
      </article>
    `).join("")
    : `<div class="delivery-cart-empty">Agrega productos para preparar tu pedido.</div>`;
}

async function submitDeliveryOrder(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.getElementById("deliveryOrderStatus");
  const totals = getDeliveryCartTotals();
  if (!totals.items.length) return;

  const customerName = String(form.customerName.value || "").trim();
  const customerPhone = String(form.customerPhone.value || "").trim();
  const customerAddress = String(form.customerAddress.value || "").trim();
  const notes = String(form.customerNotes.value || "").trim();
  if (!customerName || !customerPhone || !customerAddress) {
    if (status) status.textContent = "Completa nombre, telefono y direccion.";
    return;
  }

  const deliveryMeta = {
    phone: customerPhone,
    address: customerAddress,
    notes,
    source: "tienda-domicilio"
  };
  const sale = {
    clientName: customerName,
    clientDocument: `Tel: ${customerPhone} | Dir: ${customerAddress}${notes ? ` | Nota: ${notes}` : ""}`,
    date: deliveryToday(),
    time: deliveryTime(),
    paymentMethod: "Domicilio pendiente",
    cashReceived: 0,
    change: 0,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    items: totals.items.map((item, index) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      originalSubtotal: item.originalSubtotal,
      lineTotal: item.lineTotal,
      deliveryMeta: index === 0 ? deliveryMeta : undefined
    }))
  };

  const button = document.getElementById("deliverySubmitOrder");
  if (button) button.disabled = true;
  if (status) status.textContent = "Enviando pedido...";
  try {
    const data = await deliveryFetchJson(DELIVERY_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({ action: "register_sale", sale })
    });
    deliveryState.cart.clear();
    renderDeliveryCart();
    form.reset();
    const savedSale = normalizeDeliverySale(data.sale || {});
    if (savedSale.id || savedSale.ticketNumber) {
      const existingIndex = deliveryState.sales.findIndex((order) => order.id === savedSale.id);
      if (existingIndex >= 0) {
        deliveryState.sales[existingIndex] = savedSale;
      } else {
        deliveryState.sales.push(savedSale);
      }
      localStorage.setItem(DELIVERY_LAST_TRACKING_KEY, savedSale.ticketNumber || savedSale.id || customerPhone);
      const trackingInput = document.getElementById("deliveryTrackingInput");
      if (trackingInput) trackingInput.value = savedSale.ticketNumber || customerPhone;
      renderDeliveryTracking(savedSale);
    }
    if (status) status.textContent = `Pedido recibido. Codigo: ${data.sale?.ticketNumber || "en proceso"}. Puedes rastrearlo aqui mismo.`;
  } catch (error) {
    if (status) status.textContent = error.message || "No fue posible enviar el pedido.";
  } finally {
    if (button) button.disabled = false;
  }
}

async function updateDeliveryOrderStatusInApi(orderId, status) {
  const data = await deliveryFetchJson(DELIVERY_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "update_delivery_order_status",
      id: orderId,
      status
    })
  });

  if (Array.isArray(data.sales)) {
    deliveryState.sales = data.sales.map(normalizeDeliverySale);
  }
  return normalizeDeliverySale(data.sale || {});
}

function renderDeliveryOrdersBackoffice() {
  const list = document.getElementById("deliveryOrdersList");
  const metricPending = document.getElementById("deliveryMetricPending");
  const metricRevenue = document.getElementById("deliveryMetricRevenue");
  const metricOrders = document.getElementById("deliveryMetricOrders");
  if (!list) return;

  const filter = String(document.getElementById("deliveryStatusFilter")?.value || "all");
  const search = String(document.getElementById("deliveryOrderSearch")?.value || "").trim().toLowerCase();
  let orders = deliveryState.sales.filter(isDeliveryOrder).reverse();
  orders = orders.filter((order) => {
    const status = getDeliveryOrderStatus(order);
    const meta = getDeliveryMeta(order);
    const text = [order.ticketNumber, order.clientName, meta.phone, meta.address, order.items.map((item) => item.name).join(" ")].join(" ").toLowerCase();
    return (filter === "all" || status === filter) && (!search || text.includes(search));
  });

  const allOrders = deliveryState.sales.filter(isDeliveryOrder);
  const pending = allOrders.filter((order) => !["entregado", "cancelado"].includes(getDeliveryOrderStatus(order))).length;
  if (metricPending) metricPending.textContent = String(pending);
  if (metricOrders) metricOrders.textContent = String(allOrders.length);
  if (metricRevenue) metricRevenue.textContent = deliveryCurrency(allOrders.reduce((sum, order) => sum + Number(order.total || 0), 0));

  list.innerHTML = orders.length
    ? orders.map((order) => {
      const meta = getDeliveryMeta(order);
    const status = getDeliveryOrderStatus(order);
      const itemSummary = order.items.map((item) => `${item.quantity || 1} x ${item.name}`).join(", ");
      const whatsapp = meta.phone ? `https://wa.me/57${meta.phone.replace(/\D/g, "").replace(/^57/, "")}?text=${encodeURIComponent(`Hola ${order.clientName}, recibimos tu pedido ${order.ticketNumber}. Total ${deliveryCurrency(order.total)}.`)}` : "";
      return `
        <article class="delivery-order-card is-${deliveryEscape(status)}">
          <div class="delivery-order-head">
            <div>
              <span>${deliveryEscape(order.date)} ${deliveryEscape(order.time)}</span>
              <strong>${deliveryEscape(order.ticketNumber || "Pedido domicilio")}</strong>
              ${order.deliveryUpdatedAt ? `<em>Actualizado: ${deliveryEscape(order.deliveryUpdatedAt)}</em>` : ""}
            </div>
            <small>${deliveryEscape(getDeliveryStatusLabel(status))}</small>
          </div>
          ${getDeliveryStatusProgressHtml(status)}
          <div class="delivery-order-body">
            <div><span>Cliente</span><strong>${deliveryEscape(order.clientName)}</strong></div>
            <div><span>Telefono</span><strong>${deliveryEscape(meta.phone || "Sin telefono")}</strong></div>
            <div><span>Direccion</span><strong>${deliveryEscape(meta.address || "Sin direccion")}</strong></div>
            <div><span>Total</span><strong>${deliveryCurrency(order.total)}</strong></div>
          </div>
          <p>${deliveryEscape(itemSummary || "Sin productos")}</p>
          ${meta.notes ? `<p class="delivery-order-note">${deliveryEscape(meta.notes)}</p>` : ""}
          <div class="delivery-order-actions">
            <button class="btn btn-sm btn-outline-secondary" type="button" data-delivery-status="${deliveryEscape(order.id)}" data-status="pendiente">Pendiente</button>
            <button class="btn btn-sm btn-outline-secondary" type="button" data-delivery-status="${deliveryEscape(order.id)}" data-status="preparando">Preparando</button>
            <button class="btn btn-sm btn-outline-secondary" type="button" data-delivery-status="${deliveryEscape(order.id)}" data-status="despachado">Despachado</button>
            <button class="btn btn-sm btn-outline-secondary" type="button" data-delivery-status="${deliveryEscape(order.id)}" data-status="en_camino">En camino</button>
            <button class="btn btn-sm btn-brand" type="button" data-delivery-status="${deliveryEscape(order.id)}" data-status="entregado">Entregado</button>
            <button class="btn btn-sm btn-outline-danger" type="button" data-delivery-status="${deliveryEscape(order.id)}" data-status="cancelado">Cancelado</button>
            <button class="btn btn-sm btn-outline-secondary" type="button" data-delivery-guide="${deliveryEscape(order.id || order.ticketNumber)}">Guia envio</button>
            <button class="btn btn-sm btn-outline-secondary" type="button" data-delivery-whatsapp="${deliveryEscape(order.id || order.ticketNumber)}">Enviar WhatsApp</button>
            ${whatsapp ? `<a class="btn btn-sm btn-outline-secondary" href="${deliveryEscape(whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
          </div>
        </article>
      `;
    }).join("")
    : `<div class="delivery-empty"><i class="bi bi-inbox"></i><strong>Sin pedidos</strong><span>Cuando un cliente haga una orden, aparecera aqui.</span></div>`;
}

async function initDeliveryStore() {
  const status = document.getElementById("deliveryLoadStatus");
  try {
    if (status) status.textContent = "Sincronizando productos...";
    await loadDeliveryProducts();
    await loadDeliverySales();
    renderDeliveryCategoryFilter();
    renderDeliveryStoreProducts();
    renderDeliveryCart();
    const lastTracking = localStorage.getItem(DELIVERY_LAST_TRACKING_KEY) || "";
    const trackingInput = document.getElementById("deliveryTrackingInput");
    if (trackingInput && lastTracking) {
      trackingInput.value = lastTracking;
      renderDeliveryTracking(findDeliveryOrderByTrackingQuery(lastTracking));
    }
    if (status) status.textContent = "Catalogo sincronizado con inventario.";
  } catch (error) {
    if (status) status.textContent = error.message || "No se pudo sincronizar el catalogo.";
  }

  document.getElementById("deliverySearchInput")?.addEventListener("input", renderDeliveryStoreProducts);
  document.getElementById("deliveryCategoryFilter")?.addEventListener("change", renderDeliveryStoreProducts);
  document.getElementById("deliveryProductGrid")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delivery-add]");
    if (button) addDeliveryCartItem(button.dataset.deliveryAdd);
  });
  document.getElementById("deliveryCartList")?.addEventListener("click", (event) => {
    const inc = event.target.closest("[data-delivery-inc]");
    const dec = event.target.closest("[data-delivery-dec]");
    if (inc) changeDeliveryCartItem(inc.dataset.deliveryInc, 1);
    if (dec) changeDeliveryCartItem(dec.dataset.deliveryDec, -1);
  });
  document.getElementById("deliveryCustomerForm")?.addEventListener("submit", submitDeliveryOrder);
  document.getElementById("deliveryTrackingResult")?.addEventListener("click", (event) => {
    const guideButton = event.target.closest("[data-delivery-guide]");
    if (guideButton) {
      printDeliveryGuide(findDeliveryOrderById(guideButton.dataset.deliveryGuide));
      return;
    }
    const whatsappButton = event.target.closest("[data-delivery-whatsapp]");
    if (whatsappButton) {
      shareDeliveryGuideToWhatsapp(findDeliveryOrderById(whatsappButton.dataset.deliveryWhatsapp));
    }
  });
  document.getElementById("deliveryTrackingClear")?.addEventListener("click", () => {
    const input = document.getElementById("deliveryTrackingInput");
    const result = document.getElementById("deliveryTrackingResult");
    if (input) input.value = "";
    if (result) result.innerHTML = "";
    localStorage.removeItem(DELIVERY_LAST_TRACKING_KEY);
    input?.focus();
  });
  document.getElementById("deliveryTrackingForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("deliveryTrackingInput");
    const query = String(input?.value || "").trim();
    if (!query) {
      renderDeliveryTracking(null, "Escribe el codigo del pedido o tu telefono.");
      return;
    }
    try {
      await loadDeliverySales();
      const order = findDeliveryOrderByTrackingQuery(query);
      if (order) localStorage.setItem(DELIVERY_LAST_TRACKING_KEY, query);
      renderDeliveryTracking(order, "No encontramos un pedido con ese codigo o telefono.");
    } catch (error) {
      renderDeliveryTracking(null, error.message || "No fue posible consultar el estado.");
    }
  });
}

async function initDeliveryBackoffice() {
  const status = document.getElementById("deliveryBackofficeStatus");
  try {
    if (status) status.textContent = "Sincronizando ordenes...";
    await loadDeliverySales();
    renderDeliveryOrdersBackoffice();
    if (status) status.textContent = "Ordenes sincronizadas.";
  } catch (error) {
    if (status) status.textContent = error.message || "No se pudieron cargar las ordenes.";
  }

  if (document.body.dataset.deliveryOrdersBound === "true") return;
  document.body.dataset.deliveryOrdersBound = "true";
  document.getElementById("deliveryRefreshOrders")?.addEventListener("click", initDeliveryBackoffice);
  document.getElementById("deliveryStatusFilter")?.addEventListener("change", renderDeliveryOrdersBackoffice);
  document.getElementById("deliveryOrderSearch")?.addEventListener("input", renderDeliveryOrdersBackoffice);
  document.getElementById("deliveryOrdersList")?.addEventListener("click", (event) => {
    const guideButton = event.target.closest("[data-delivery-guide]");
    if (guideButton) {
      printDeliveryGuide(findDeliveryOrderById(guideButton.dataset.deliveryGuide));
      return;
    }
    const whatsappButton = event.target.closest("[data-delivery-whatsapp]");
    if (whatsappButton) {
      shareDeliveryGuideToWhatsapp(findDeliveryOrderById(whatsappButton.dataset.deliveryWhatsapp));
      return;
    }
    const button = event.target.closest("[data-delivery-status]");
    if (!button) return;
    const orderId = button.dataset.deliveryStatus;
    const nextStatus = button.dataset.status;
    const status = document.getElementById("deliveryBackofficeStatus");
    button.disabled = true;
    if (status) status.textContent = "Guardando estado en Excel...";
    updateDeliveryOrderStatusInApi(orderId, nextStatus)
      .then(() => {
        setStoredDeliveryStatus(orderId, nextStatus);
        renderDeliveryOrdersBackoffice();
        if (status) status.textContent = "Estado guardado en Excel.";
      })
      .catch((error) => {
        if (status) status.textContent = error.message || "No se pudo guardar el estado.";
      })
      .finally(() => {
        button.disabled = false;
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "delivery-store") initDeliveryStore();
  if (document.body.dataset.page === "delivery-orders") initDeliveryBackoffice();
});
