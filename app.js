/* ============================================================
   app.js – pełny JS do obsługi 3 podstron CER
   ============================================================ */

/* ------------------------------------------------------------
   GLOBALNE USTAWIENIA – uzupełnisz swoim linkiem do webhooka
------------------------------------------------------------ */
const N8N_BASE_URL = "https://kamil-inoparts.app.n8n.cloud/webhook"; // <<< PODMIENISZ
const SELLASIST_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-z-sellasist";
const SEND_TO_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/przeslij-do-CER";
const GET_LAST_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-ostatnie-z-CER";
const GET_ONE_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-jedno-z-CER";
const SHOW_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/wy%C5%9Bwietl";

/* ------------------------------------------------------------
   BLOKADA HASŁEM – proste sprawdzenie na wejściu
------------------------------------------------------------ */
const PASSWORD_VALUE = "inoparts";
const passwordOverlay = document.getElementById("password-overlay");
const passwordInput = document.getElementById("password-input");
const passwordSubmit = document.getElementById("password-submit");
const passwordError = document.getElementById("password-error");

function unlockApp() {
  if (passwordInput.value.trim() === PASSWORD_VALUE) {
    passwordOverlay.classList.add("hidden");
    passwordError.classList.add("hidden");
    passwordInput.value = "";
  } else {
    passwordError.classList.remove("hidden");
    passwordInput.value = "";
    passwordInput.focus();
  }
}

passwordSubmit.addEventListener("click", unlockApp);
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") unlockApp();
});

window.addEventListener("load", () => passwordInput.focus());

/* ------------------------------------------------------------
   TOAST – powiadomienia w rogu
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
  return `${num.toFixed(2)} zl`;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
  }
  return [];
}

function unwrapArray(payload) {
  const base = toArray(payload);
  return base.map((el) => (el && el.json && typeof el.json === "object" ? { ...el, ...el.json } : el));
}

function normalizeClaim(raw = {}) {
  // Obsługa odpowiedzi w stylu n8n: { json: { ... } } albo tablicy elementów
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
    status: flat.status || (flat.isClosed ? "Zakonczone" : ""),
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
          <div class="claim-card__order">Zamowienie: ${claim.orderId || "-"}</div>
        </div>
        <div class="claim-card__status">${claim.status || "—"}</div>
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
          <div class="label">Wartosc</div>
          <div class="value strong">${formatCurrency(claim.value)}</div>
        </div>
      </div>

      <div class="claim-card__timeline">
        <div><span>Data przyjecia</span><strong>${formatDate(claim.receivedAt)}</strong></div>
        <div><span>Termin decyzji</span><strong>${formatDate(claim.decisionDue)}</strong></div>
        <div><span>Data rozwiazania</span><strong>${formatDate(claim.resolvedAt)}</strong></div>
      </div>

      <div class="claim-card__grid">
        <div><div class="label">Powod zgloszenia</div><div class="value">${claim.reason || "-"}</div></div>
        <div><div class="label">Typ</div><div class="value">${claim.type || "-"}</div></div>
        <div><div class="label">Decyzja</div><div class="value">${claim.decision || "-"}</div></div>
        <div><div class="label">Rozwiazanie</div><div class="value">${claim.resolution || "-"}</div></div>
        ${claim.agent ? `<div><div class="label">Agent</div><div class="value">${claim.agent}</div></div>` : ""}
        ${claim.myNewField ? `<div><div class="label">myNewField</div><div class="value">${claim.myNewField}</div></div>` : ""}
      </div>

      <div class="claim-card__actions">${actionHtml || ""}</div>
    </div>`;
}

/* ------------------------------------------------------------
   PRZEŁĄCZANIE PODSTRON (1–3)
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

/* ============================================================
   CZĘŚĆ 1 – DODAWANIE ZGŁOSZENIA
   ============================================================ */

const s1FetchBtn = document.getElementById("s1-fetch");
const s1OrderInput = document.getElementById("s1-order");
const s1OrderBox = document.getElementById("s1-order-data");
const s1Products = document.getElementById("s1-products");

const s1SaveBtn = document.getElementById("s1-save");
let s1FetchedOrder = null;

/* Pobieranie danych zamówienia */
s1FetchBtn.addEventListener("click", async () => {
  const num = s1OrderInput.value.trim();
  if (!num) return showToast("Wpisz numer zamówienia", "error");

  try {
    // U�>ycie jawnego linku webhooka pomaga unika�> b��dnych sk�'adek i pokazuje pe�'ny adres dla GitHub Pages
    const res = await fetch(`${SELLASIST_WEBHOOK}?order=${encodeURIComponent(num)}`);
    const data = await res.json();
    s1FetchedOrder = data;

    // Wyświetlenie boxa
    s1OrderBox.classList.remove("hidden");

    // Produkty – przykład danych w komentarzu:
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
            ${p.name} (${p.sku}) - ${p.price ?? ""} zl zamowiono: ${p.quantity}
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

    showToast("Pobrano dane zamowienia");
  } catch (err) {
    showToast("Błąd pobierania", "error");
  }
});

/* Zapisywanie zgłoszenia */
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

    showToast("Zapisano zgłoszenie");
  } catch (err) {
    showToast("Błąd zapisu", "error");
  }
});

/* ============================================================
   CZĘŚĆ 2 – EWIDENCJA
   ============================================================ */

const s2SearchBtn = document.getElementById("s2-search-btn");
const s2SearchInput = document.getElementById("s2-search");
const s2SingleBox = document.getElementById("s2-single-result");
const s2RangeBtn = document.getElementById("s2-range-btn");
const s2RangeSelect = document.getElementById("s2-range");
const s2ListBox = document.getElementById("s2-list");

/* Pobieranie pojedynczego zgłoszenia */
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
      `<button class="btn btn-primary" onclick="switchPage(3); document.getElementById('s3-number').value='${claim.claimId}'">Generuj odpowiedz</button>`
    );

    showToast("Pobrano zgloszenie");
  } catch {
    showToast("Nie znaleziono", "error");
  }
});

/* Pobieranie listy zgłoszeń (tabela) */
s2RangeBtn.addEventListener("click", async () => {
  const range = s2RangeSelect.value;

  try {
    // wysyłamy preset (5 wariantów z selecta) jako query param GET
    const params = new URLSearchParams({ preset: range, range });
    const res = await fetch(`${GET_LAST_FROM_CER_WEBHOOK}?${params.toString()}`);
    const rawText = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
    const rows = unwrapArray(parsed);

    s2ListBox.classList.remove("hidden");

    // Log diagnostyczny w konsoli przeglądarki
    console.info("CER list response", {
      status: res.status,
      contentType: res.headers.get("content-type"),
      rawText,
      parsed,
      rowsCount: rows.length
    });

    if (!res.ok) {
      s2ListBox.innerHTML = `
        <div class="table-box">
          <pre style="white-space:pre-wrap; padding:12px;">Błąd HTTP ${res.status}
${escapeHtml(rawText)}</pre>
        </div>`;
      showToast(`Błąd pobierania (${res.status})`, "error");
      return;
    }

    if (!rows.length) {
      s2ListBox.innerHTML = `
        <div class="table-box">
          <pre style="white-space:pre-wrap; padding:12px;">Brak rozpoznanych danych. Surowa odpowiedz webhooka:
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
          <th>Zamowienie</th>
          <th>Klient</th>
          <th>Marketplace</th>
          <th>Status</th>
          <th>Przyjecie</th>
          <th>Termin decyzji</th>
          <th>Rozwiazanie</th>
          <th>Wartosc</th>
          <th>Akcja</th>
        </tr>`;

    rows.forEach((row, idx) => {
      const claim = normalizeClaim(row);
      html += `
        <tr>
          <td>${claim.rowNumber ?? idx + 1}</td>
          <td class="link" onclick="document.getElementById('s2-search').value='${claim.claimId}'">${claim.claimId || "-"}</td>
          <td>${claim.orderId || "-"}</td>
          <td>${claim.customer || "-"}</td>
          <td>${claim.marketplace || "-"}</td>
          <td>${claim.status || "-"}</td>
          <td>${formatDate(claim.receivedAt)}</td>
          <td>${formatDate(claim.decisionDue)}</td>
          <td>${formatDate(claim.resolvedAt)}</td>
          <td>${formatCurrency(claim.value)}</td>
          <td><button class="btn" onclick="switchPage(3); document.getElementById('s3-number').value='${claim.claimId}'">Generuj</button></td>
        </tr>`;
    });

    html += `</table>`;

    s2ListBox.innerHTML = html;
    showToast("Pobrano liste zgloszen");
  } catch {
    showToast("Błąd pobierania", "error");
  }
});

/* ============================================================
   CZĘŚĆ 3 – GENERATOR ODPOWIEDZI
   ============================================================ */

const s3FetchBtn = document.getElementById("s3-fetch");
const s3NumberInput = document.getElementById("s3-number");
const s3DetailsBox = document.getElementById("s3-details");
const s3GenBtn = document.getElementById("s3-generate");
let selectedLang = "PL";

/* Zmiana języka tłumaczenia */
document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedLang = btn.dataset.lang;
    document.querySelectorAll(".lang-btn").forEach((b) => (b.style.background = ""));
    btn.style.background = "var(--orange)";
    btn.style.color = "#fff";
  });
});

/* Pobieranie danych zgłoszenia */
s3FetchBtn.addEventListener("click", async () => {
  const num = s3NumberInput.value.trim();
  if (!num) return showToast("Podaj numer", "error");

  try {
    const res = await fetch(`${SHOW_FROM_CER_WEBHOOK}?number=${encodeURIComponent(num)}`);
    const data = await res.json();
    const claim = normalizeClaim(Array.isArray(data) ? data[0] : data);

    s3DetailsBox.classList.remove("hidden");

    s3DetailsBox.innerHTML = `
      <h3>Dane reklamacji</h3>
      <p><b>Nr reklamacji:</b> ${claim.claimId || "-"}</p>
      <p><b>Zamowienie:</b> ${claim.orderId || "-"}</p>
      <p><b>Klient:</b> ${claim.customer || "-"}</p>
      <p><b>Marketplace:</b> ${claim.marketplace || "-"}</p>
      <p><b>Status:</b> ${claim.status || "-"}</p>
      <p><b>Wartosc:</b> ${formatCurrency(claim.value)}</p>
      <p><b>Powod zgloszenia:</b> ${claim.reason || "-"}</p>
      <p><b>Typ:</b> ${claim.type || "-"}</p>
      <p><b>Decyzja:</b> ${claim.decision || "-"}</p>
      <p><b>Rozwiazanie:</b> ${claim.resolution || "-"}</p>
      <p><b>Data przyjecia:</b> ${formatDate(claim.receivedAt)}</p>
      <p><b>Termin decyzji:</b> ${formatDate(claim.decisionDue)}</p>
      <p><b>Data rozwiazania:</b> ${formatDate(claim.resolvedAt)}</p>
      ${claim.agent ? `<p><b>Agent:</b> ${claim.agent}</p>` : ""}
      ${claim.myNewField ? `<p><b>myNewField:</b> ${claim.myNewField}</p>` : ""}
    `;

    showToast("Załadowano dane");
  } catch {
    showToast("Nie znaleziono", "error");
  }
});

/* Generowanie PDF */
s3GenBtn.addEventListener("click", async () => {
  const num = s3NumberInput.value.trim();
  const decision = document.getElementById("s3-decision").value;
  const noResp = document.getElementById("s3-noresp").checked;
  const answer = noResp
    ? "Brak możliwości weryfikacji: Pomimo naszych prób kontaktu..."
    : document.getElementById("s3-answer").value;

  const payload = {
    number: num,
    decision,
    language: selectedLang,
    answer
  };

  try {
    const res = await fetch(`${N8N_BASE_URL}/generuj-odpowiedz`, {
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
    showToast("Błąd generowania", "error");
  }
});

