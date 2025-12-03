/* ============================================================
   app.js  pe\u0142ny JS do obs\u0142ugi 3 podstron CER
   ============================================================ */

/* ------------------------------------------------------------
   GLOBALNE USTAWIENIA  uzupe\u0142nisz swoim linkiem do webhooka
------------------------------------------------------------ */
const N8N_BASE_URL = "https://kamil-inoparts.app.n8n.cloud/webhook"; // <<< PODMIENISZ
const SELLASIST_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-z-sellasist";
const SEND_TO_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/przeslij-do-CER";
const GET_LAST_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-ostatnie-z-CER";
const GET_ONE_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-jedno-z-CER";
const SHOW_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/wy%C5%9Bwietl";
const GENERATE_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/generuj-odpowiedz";

/* ------------------------------------------------------------
   BLOKADA HAS\u0141EM  prosty resetowany mechanizm
------------------------------------------------------------- */
const PASSWORD_VALUE = "inoparts";

function initPasswordGate() {
  const overlay = document.getElementById("password-overlay");
  const input = document.getElementById("password-input");
  const submit = document.getElementById("password-submit");
  const errorBox = document.getElementById("password-error");

  if (!overlay || !input || !submit || !errorBox) return;

  const unlock = () => {
    if (input.value.trim() === PASSWORD_VALUE) {
      overlay.classList.add("hidden");
      errorBox.classList.add("hidden");
      input.value = "";
    } else {
      errorBox.classList.remove("hidden");
      input.value = "";
      input.focus();
    }
  };

  submit.addEventListener("click", unlock);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") unlock();
  });

  setTimeout(() => input.focus(), 0);
}

document.addEventListener("DOMContentLoaded", initPasswordGate);

/* ------------------------------------------------------------
   TOAST  powiadomienia w rogu
------------------------------------------------------------ */
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  const dot = document.getElementById("toast-dot");
  const text = document.getElementById("toast-text");

  text.textContent = msg;

  if (type === "error") toast.classList.add("error");
  else toast.classList.remove("error");

  toast.style.display = "flex";
  setTimeout(() => (toast.style.display = "none"), 3500);
}

/* ------------------------------------------------------------
   Formatowanie danych z webhooka (daty, kwoty, mapowanie pol)
------------------------------------------------------------ */
function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const cleaned = typeof value === "string" ? value.replace(",", ".") : value;
  const num = Number(cleaned);
  if (Number.isNaN(num)) return value;
  return `${num.toFixed(2)} z\u0142`;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeJsonParse(text) {
  const cleaned = String(text || "").trim().replace(/^\uFEFF/, "");
  try {
    return { value: JSON.parse(cleaned), error: null };
  } catch (err) {
    // spr\u00f3buj \u015bci\u0105\u0107 do pierwszego { lub [
    const brace = cleaned.indexOf("{");
    const bracket = cleaned.indexOf("[");
    const idx = brace >= 0 && bracket >= 0 ? Math.min(brace, bracket) : brace >= 0 ? brace : bracket;
    if (idx > 0) {
      const sliced = cleaned.slice(idx);
      try {
        return { value: JSON.parse(sliced), error: null };
      } catch (err2) {
        return { value: cleaned, error: err2 };
      }
    }
    return { value: cleaned, error: err };
  }
}

function parseObjectsFromText(rawText) {
  const matches = String(rawText || "").match(/{[^]*?}/g);
  if (!matches) return [];
  const out = [];
  matches.forEach((m) => {
    try {
      out.push(JSON.parse(m));
    } catch {
      // ignore broken chunk
    }
  });
  return out;
}

// Rozwiniecie odpowiedzi n8n niezaleznie od ksztaltu (tablica, data[], items[], elementy z json)
function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return toArray(parsed);
    } catch {
      return [];
    }
  }
  if (payload && typeof payload === "object") {
    const candidates = [
      payload.data,
      payload.items,
      payload.json,
      payload.body,
      payload.result,
      payload.records,
      payload.list
    ];
    for (const c of candidates) if (Array.isArray(c)) return c;
    // jeeli to pojedynczy rekord (ma claimId/orderId itp.), zwr jako jednoelementowa tablica
    const keys = Object.keys(payload);
    if (keys.length && (keys.includes("claimId") || keys.includes("orderId") || keys.includes("Nr. Rek.") || keys.includes("row_number"))) {
      return [payload];
    }
  }
  return [];
}

function unwrapArray(payload) {
  const base = toArray(payload);
  return base.map((el) => (el && el.json && typeof el.json === "object" ? { ...el, ...el.json } : el));
}

function normalizeClaim(raw = {}) {
  // Obsuga odpowiedzi w stylu n8n: { json: { ... } } albo tablicy elementw
  const flat = raw.json && typeof raw.json === "object" ? { ...raw, ...raw.json } : raw;
  const dates = flat.dates || {};
  const customerValue =
    flat.customer ||
    flat.clientNick ||
    flat.customerNick ||
    flat.client ||
    flat.clientName ||
    flat.customerName;

  return {
    claimId: flat.claimId || flat.caseNumber || flat.rowNumber || flat.orderId || flat.order || "",
    orderId: flat.orderId || flat.order || "",
    customer: customerValue !== undefined && customerValue !== null ? String(customerValue) : "",
    marketplace: flat.marketplace || flat.platform || "",
    status: flat.status || (flat.isClosed ? "Zako\u0144czone" : ""),
    value:
      flat.value ??
      flat.valueNumber ??
      flat.valueRaw ??
      flat.amount ??
      flat.total ??
      (flat.pricing && flat.pricing.total),
    reason: flat.reason,
    type: flat.type,
    decision: flat.decision,
    resolution: flat.resolution,
    agent: flat.agent,
    myNewField: flat.myNewField,
    receivedAt: flat.receivedAt || dates.receivedAt,
    decisionDue: flat.decisionDue || dates.decisionDue,
    resolvedAt: flat.resolvedAt || dates.resolvedAt,
    rowNumber: flat.rowNumber
  };
}

function renderClaimCard(raw, actionHtml = "") {
  const claim = normalizeClaim(raw);
  return `
    <div class="claim-card">
      <div class="claim-card__header">
        <div>
          <div class="claim-card__id">Reklamacja: ${claim.claimId || "-"}</div>
          <div class="claim-card__order">Zam\u00f3wienie: ${claim.orderId || "-"}</div>
        </div>
        <div class="claim-card__status">${claim.status || ""}</div>
      </div>

    <div class="claim-card__keyline">
        <div>
          <div class="label">Klient</div>
          <div class="value">${claim.customer || "-"}</div>
        </div>
        <div>
          <div class="label">Marketplace</div>
          <div class="value">${claim.marketplace || "-"}</div>
        </div>
        <div>
          <div class="label">Warto</div>
          <div class="value strong">${formatCurrency(claim.value)}</div>
        </div>
      </div>

      <div class="claim-card__timeline">
        <div><span>Data przyj\u0119cia</span><strong>${formatDate(claim.receivedAt)}</strong></div>
        <div><span>Termin decyzji</span><strong>${formatDate(claim.decisionDue)}</strong></div>
        <div><span>Data rozwi\u0105zania</span><strong>${formatDate(claim.resolvedAt)}</strong></div>
      </div>

      <div class="claim-card__grid">
        <div><div class="label">Pow\u00f3d zg\u0142oszenia</div><div class="value">${claim.reason || "-"}</div></div>
        <div><div class="label">Typ</div><div class="value">${claim.type || "-"}</div></div>
        <div><div class="label">Decyzja</div><div class="value">${claim.decision || "-"}</div></div>
        <div><div class="label">Rozwi\u0105zanie</div><div class="value">${claim.resolution || "-"}</div></div>
        ${claim.agent ? `<div><div class="label">Agent</div><div class="value">${claim.agent}</div></div>` : ""}
        ${claim.myNewField ? `<div><div class="label">myNewField</div><div class="value">${claim.myNewField}</div></div>` : ""}
      </div>

      <div class="claim-card__actions">${actionHtml || ""}</div>
    </div>`;
}

/* ------------------------------------------------------------
   PRZECZANIE PODSTRON (13)
------------------------------------------------------------ */
function switchPage(pageNumber) {
  const pages = document.querySelectorAll(".page");
  const items = document.querySelectorAll(".sidebar-item");

  pages.forEach((pg, index) => {
    const num = index + 1;
    if (num === pageNumber) pg.classList.add("page-active");
    else pg.classList.remove("page-active");
  });

  items.forEach((btn, index) => {
    const num = index + 1;
    if (num === pageNumber) btn.classList.add("sidebar-item-active");
    else btn.classList.remove("sidebar-item-active");
  });
}
window.switchPage = switchPage;

/* ------------------------------------------------------------
   RESETY STRON
------------------------------------------------------------ */
function injectResetButton(sectionId, onReset) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const h1 = section.querySelector("h1");
  if (!h1) return;
  const header = document.createElement("div");
  header.className = "page-header";
  const btn = document.createElement("button");
  btn.className = "btn reset-btn";
  btn.textContent = "Reset";
  btn.addEventListener("click", onReset);
  h1.parentNode.insertBefore(header, h1);
  header.appendChild(h1);
  header.appendChild(btn);
}

function resetPage1() {
  s1OrderInput.value = "";
  s1FetchedOrder = null;
  s1OrderBox.classList.add("hidden");
  s1Products.innerHTML = "";
  [
    "s1-client-name",
    "s1-client-email",
    "s1-client-phone",
    "s1-client-nick",
    "s1-country",
    "s1-date",
    "s1-platform",
    "s1-shipping",
    "s1-report-date",
    "s1-type",
    "s1-reason",
    "s1-employee",
    "s1-note"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "SELECT") el.selectedIndex = 0;
    else el.value = "";
  });
}

function resetPage2() {
  s2SearchInput.value = "";
  s2SingleBox.classList.add("hidden");
  s2SingleBox.innerHTML = "";
  s2ListBox.classList.add("hidden");
  s2ListBox.innerHTML = "";
}

function resetPage3() {
  s3NumberInput.value = "";
  s3DetailsBox.classList.add("hidden");
  s3DetailsBox.innerHTML = "";
  document.getElementById("s3-decision").selectedIndex = 0;
  document.getElementById("s3-noresp").checked = false;
  document.getElementById("s3-answer").value = "";
  selectedLang = "PL";
  s3CurrentClaim = null;
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.style.background = "";
    btn.style.color = "";
    if (btn.dataset.lang === "PL") {
      btn.style.background = "var(--orange)";
      btn.style.color = "#fff";
    }
  });
}

injectResetButton("page-1", resetPage1);
injectResetButton("page-2", resetPage2);
injectResetButton("page-3", resetPage3);

function toggleRowDetails(id, btn) {
  const row = document.querySelector(`.expand-row[data-exp-id="${id}"]`);
  if (!row) return;
  const isOpen = row.style.display !== "none";
  row.style.display = isOpen ? "none" : "table-row";
  if (btn) btn.textContent = isOpen ? "v" : "^";
}
window.toggleRowDetails = toggleRowDetails;

/* ============================================================
   CZ\u0118 1  DODAWANIE ZGOSZENIA
   ============================================================ */

const s1FetchBtn = document.getElementById("s1-fetch");
const s1OrderInput = document.getElementById("s1-order");
const s1OrderBox = document.getElementById("s1-order-data");
const s1Products = document.getElementById("s1-products");

const s1SaveBtn = document.getElementById("s1-save");
let s1FetchedOrder = null;

/* Pobieranie danych zam\u00f3wienia */
s1FetchBtn.addEventListener("click", async () => {
  const num = s1OrderInput.value.trim();
  if (!num) return showToast("Wpisz numer zam\u00f3wienia", "error");

  try {
    // Uycie jawnego linku webhooka pomaga unika bdnych skadek i pokazuje peny adres dla GitHub Pages
    const res = await fetch(`${SELLASIST_WEBHOOK}?order=${encodeURIComponent(num)}`);
    const data = await res.json();
    s1FetchedOrder = data;

    // Wywietlenie boxa
    s1OrderBox.classList.remove("hidden");

    // Produkty  przykad danych w komentarzu:
    // data.products = [
    //   { sku: "SKU123", name: "Buty zimowe", quantity: 2 },
    //   { sku: "SKU999", name: "Czapka", quantity: 1 }
    // ]

    s1Products.innerHTML = data.products
      .map(
        (p, idx) => `
        <div class="product-row">
          <label>
            <input type="checkbox" class="s1-prod-check" data-index="${idx}" />
            ${p.name} (${p.sku}) - ${p.price ?? ""} z\u0142 zam\u00f3wiono: ${p.quantity}
          </label>
          <input type="number" class="s1-prod-qty" data-index="${idx}" min="0" max="${p.quantity}" value="0" />
        </div>
      `
      )
      .join("");

    document.getElementById("s1-client-name").value = data.clientName;
    document.getElementById("s1-client-email").value = data.clientEmail;
    document.getElementById("s1-client-phone").value = data.clientPhone;
    document.getElementById("s1-client-nick").value = data.clientNick;
    document.getElementById("s1-country").value = data.country;
    document.getElementById("s1-date").value = data.orderDate;
    document.getElementById("s1-platform").value = data.platform;
    document.getElementById("s1-shipping").value = data.shippingCost;

    showToast("Pobrano dane zam\u00f3wienia");
  } catch (err) {
    showToast("B\u0142\u0105d pobierania", "error");
  }
});

/* Zapisywanie zgoszenia */
s1SaveBtn.addEventListener("click", async () => {
  const payload = {
    order: s1OrderInput.value,
    orderDetails: s1FetchedOrder,
    reportDate: document.getElementById("s1-report-date").value,
    type: document.getElementById("s1-type").value,
    reason: document.getElementById("s1-reason").value,
    employee: document.getElementById("s1-employee").value,
    note: document.getElementById("s1-note").value,

    products: Array.from(document.querySelectorAll(".product-row")).map((row, idx) => {
      const check = row.querySelector(".s1-prod-check");
      const qty = row.querySelector(".s1-prod-qty");
      const meta = s1FetchedOrder?.products?.[idx] || {};
      return {
        include: check.checked,
        qty: Number(qty.value),
        sku: meta.sku,
        name: meta.name,
        orderedQuantity: meta.quantity,
        price: Number(meta.price ?? 0)
      };
    })
  };

  try {
    await fetch(SEND_TO_CER_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    showToast("Zapisano zg\u0142oszenie");
  } catch (err) {
    showToast("B\u0142\u0105d zapisu", "error");
  }
});

/* ============================================================
   CZ\u0118 2  EWIDENCJA
   ============================================================ */

const s2SearchBtn = document.getElementById("s2-search-btn");
const s2SearchInput = document.getElementById("s2-search");
const s2SingleBox = document.getElementById("s2-single-result");
const s2RangeBtn = document.getElementById("s2-range-btn");
const s2RangeSelect = document.getElementById("s2-range");
const s2ListBox = document.getElementById("s2-list");

// ustawienie kontrolek w jednej linii + usuniecie zbdnych separatorw
(function arrangeS2Controls() {
  const section = document.getElementById("page-2");
  const searchField = s2SearchInput?.closest(".field");
  const rangeRow = s2RangeSelect?.closest(".row-inline");
  const rangeField = rangeRow ? rangeRow.parentElement : null;
  const hr = section.querySelector("hr");
  const h3 = section.querySelector("h3");

  if (searchField && rangeRow) {
    const container = document.createElement("div");
    container.className = "s2-controls";

    // przenie blok wyszukiwania
    container.appendChild(searchField);

    // utwrz pole dla zakresu
    const field = document.createElement("div");
    field.className = "field";
    const label = document.createElement("label");
    label.textContent = "Pobierz wiele zg\u0142osze\u0144";
    field.appendChild(label);
    field.appendChild(rangeRow);
    container.appendChild(field);

    // wstaw kontener przed wynikiem
    const target = section.querySelector("#s2-single-result") || rangeField || section.firstChild;
    section.insertBefore(container, target);

    // usu stary nagwek i hr
    if (rangeField && rangeField !== field && rangeField.parentElement) rangeField.parentElement.removeChild(rangeField);
    if (h3 && h3.parentElement) h3.parentElement.removeChild(h3);
    if (hr && hr.parentElement) hr.parentElement.removeChild(hr);
  }
})();

/* Pobieranie pojedynczego zgoszenia */
s2SearchBtn.addEventListener("click", async () => {
  const num = s2SearchInput.value.trim();
  if (!num) return showToast("Podaj numer", "error");

  try {
    const res = await fetch(`${GET_ONE_FROM_CER_WEBHOOK}?order=${encodeURIComponent(num)}`);
    const data = await res.json();
    const claim = normalizeClaim(Array.isArray(data) ? data[0] : data);
    s2SingleBox.classList.remove("hidden");
    s2SingleBox.innerHTML = renderClaimCard(
      claim,
      `<button class="btn btn-primary" onclick="switchPage(3); document.getElementById('s3-number').value='${claim.claimId}'">Generuj odpowied</button>`
    );

    showToast("Pobrano zg\u0142oszenie");
  } catch {
    showToast("Nie znaleziono", "error");
  }
});

/* Pobieranie listy zgosze (tabela) */
s2RangeBtn.addEventListener("click", async () => {
  const range = s2RangeSelect.value;

  try {
    // wysyamy preset (5 wariantw z selecta) jako query param GET
    const params = new URLSearchParams({ preset: range, range });
    const res = await fetch(`${GET_LAST_FROM_CER_WEBHOOK}?${params.toString()}`);
    const rawText = await res.text();

    // proste parsowanie: json -> array | object -> array; jak nie, to wycignij obiekty z tekstu
    let parsed;
    let parseError = null;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      parseError = err;
      parsed = rawText;
    }

    let rows = [];
    if (Array.isArray(parsed)) {
      rows = parsed;
    } else if (parsed && typeof parsed === "object") {
      rows = [parsed];
    }

    if (!rows.length) {
      rows = parseObjectsFromText(rawText);
    }

    // ostateczny fallback  sprbuj unwrap n8n
    if (!rows.length) {
      rows = unwrapArray(parsed);
    }

    s2ListBox.classList.remove("hidden");

    // Log diagnostyczny w konsoli przegldarki
    console.info("CER list response", {
      status: res.status,
      contentType: res.headers.get("content-type"),
      rawText,
      parsed,
      parseError,
      rowsCount: rows.length
    });

    if (!res.ok) {
      s2ListBox.innerHTML = `
        <div class="table-box">
          <pre style="white-space:pre-wrap; padding:12px;">B\u0142\u0105d HTTP ${res.status}
${escapeHtml(rawText)}</pre>
        </div>`;
      showToast(`B\u0142\u0105d pobierania (${res.status})`, "error");
      return;
    }

    if (!rows.length) {
      s2ListBox.innerHTML = `
        <div class="table-box">
          <pre style="white-space:pre-wrap; padding:12px;">Brak rozpoznanych danych. Surowa odpowied webhooka:
${escapeHtml(rawText)}</pre>
        </div>`;
      showToast("Brak danych z webhooka", "error");
      return;
    }

    let html = `
      <table>
        <tr>
          <th>#</th>
          <th>Reklamacja</th>
          <th>Zamwienie</th>
          <th>Klient</th>
          <th>Marketplace</th>
          <th>Status</th>
          <th>Przyjcie</th>
          <th>Termin decyzji</th>
          <th>Rozwizanie</th>
          <th>Warto</th>
          <th>Akcja</th>
        </tr>`;

    rows.forEach((row, idx) => {
      const claim = normalizeClaim(row);
      const expId = `exp-${claim.claimId || claim.rowNumber || idx}`;
      html += `
        <tr>
          <td>${claim.rowNumber ? claim.rowNumber : idx + 1}</td>
          <td class="link" onclick="document.getElementById('s2-search').value='${claim.claimId}'">${claim.claimId || "-"}</td>
          <td>${claim.orderId || "-"}</td>
          <td>${claim.customer || "-"}</td>
          <td>${claim.marketplace || "-"}</td>
          <td>${claim.status || "-"}</td>
          <td>${formatDate(claim.receivedAt)}</td>
          <td>${formatDate(claim.decisionDue)}</td>
          <td>${formatDate(claim.resolvedAt)}</td>
          <td>${formatCurrency(claim.value)}</td>
          <td>
            <div class="action-cell">
              <button class="expand-btn" onclick="toggleRowDetails('${expId}', this)">v</button>
              <button class="btn" onclick="switchPage(3); document.getElementById('s3-number').value='${claim.claimId}'">Generuj</button>
            </div>
          </td>
        </tr>
        <tr class="expand-row" data-exp-id="${expId}" style="display:none">
          <td colspan="11">
            ${renderClaimCard(claim)}
          </td>
        </tr>`;
    });

    html += `</table>`;

    s2ListBox.innerHTML = html;
    showToast("Pobrano list\u0119 zg\u0142osze\u0144");
  } catch {
    showToast("B\u0142\u0105d pobierania", "error");
  }
});

/* ============================================================
   CZ\u0118 3  GENERATOR ODPOWIEDZI
   ============================================================ */

const s3FetchBtn = document.getElementById("s3-fetch");
const s3NumberInput = document.getElementById("s3-number");
const s3DetailsBox = document.getElementById("s3-details");
const s3GenBtn = document.getElementById("s3-generate");
let selectedLang = "PL";
let s3CurrentClaim = null;

/* Zmiana jzyka tumaczenia */
document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedLang = btn.dataset.lang;
    document.querySelectorAll(".lang-btn").forEach((b) => (b.style.background = ""));
    btn.style.background = "var(--orange)";
    btn.style.color = "#fff";
  });
});

/* Pobieranie danych zgoszenia */
s3FetchBtn.addEventListener("click", async () => {
  const num = s3NumberInput.value.trim();
  if (!num) return showToast("Podaj numer", "error");

  try {
    const res = await fetch(`${SHOW_FROM_CER_WEBHOOK}?number=${encodeURIComponent(num)}`);
    const data = await res.json();
    const claim = normalizeClaim(Array.isArray(data) ? data[0] : data);
    s3CurrentClaim = claim;

    s3DetailsBox.classList.remove("hidden");
    s3DetailsBox.innerHTML = "";
    s3DetailsBox.insertAdjacentHTML("beforeend", renderClaimCard(claim));

    // Ukryj pola Decyzja, Rozwiazanie i Data rozwiazania tylko w generatorze
    const grid = s3DetailsBox.querySelector(".claim-card__grid");
    if (grid) {
      grid.querySelectorAll("div").forEach((block) => {
        const label = block.querySelector(".label");
        if (!label) return;
        const text = label.textContent.trim().toLowerCase();
        if (text.includes("decyzja") || text.includes("rozwizanie")) block.remove();
      });
    }
    const timeline = s3DetailsBox.querySelector(".claim-card__timeline");
    if (timeline) {
      timeline.querySelectorAll("div").forEach((block) => {
        const span = block.querySelector("span");
        if (span && span.textContent.trim().toLowerCase().includes("data rozwizania")) {
          block.remove();
        }
      });
    }

    showToast("Za\u0142adowano dane");
  } catch {
    showToast("Nie znaleziono", "error");
  }
});

/* Generowanie PDF */
s3GenBtn.addEventListener("click", async () => {
  const num = s3NumberInput.value.trim();
  const decision = document.getElementById("s3-decision").value;
  const noResp = document.getElementById("s3-noresp").checked;
  if (!num) return showToast("Podaj numer", "error");

  const answer = noResp
    ? "Brak mo\u017cliwo\u015bci weryfikacji: Pomimo naszych pr\u00f3b kontaktu nie otrzymali\u015bmy odpowiedzi, dlatego zamykamy zg\u0142oszenie."
    : document.getElementById("s3-answer").value;

  const payload = {
    number: num,
    decision,
    language: selectedLang,
    answer,
    noResponse: noResp,
    claim: s3CurrentClaim
      ? {
          claimId: s3CurrentClaim.claimId,
          orderId: s3CurrentClaim.orderId,
          customer: s3CurrentClaim.customer,
          marketplace: s3CurrentClaim.marketplace,
          status: s3CurrentClaim.status,
          value: s3CurrentClaim.value,
          reason: s3CurrentClaim.reason,
          type: s3CurrentClaim.type,
          decisionOriginal: s3CurrentClaim.decision,
          resolution: s3CurrentClaim.resolution,
          agent: s3CurrentClaim.agent,
          myNewField: s3CurrentClaim.myNewField,
          receivedAt: s3CurrentClaim.receivedAt,
          decisionDue: s3CurrentClaim.decisionDue,
          resolvedAt: s3CurrentClaim.resolvedAt
        }
      : null
  };

  try {
    const res = await fetch(GENERATE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `CER-${num}.pdf`;
    a.click();

    showToast("Wygenerowano PDF");
  } catch {
    showToast("B\u0142\u0105d generowania", "error");
  }
});

