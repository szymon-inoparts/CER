/* ============================================================

   app.js  pe\u0142ny JS do obs\u0142ugi 3 podstron CER

   ============================================================ */

/* ------------------------------------------------------------

   GLOBALNE USTAWIENIA  uzupe\u0142nisz swoim linkiem do webhooka

------------------------------------------------------------ */


const SELLASIST_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-z-sellasist";

const SEND_TO_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/przeslij-do-CER";

const GET_LAST_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-ostatnie-z-CER";

const GET_ONE_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-jedno-z-CER";

const SHOW_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/wy%C5%9Bwietl";

const GENERATE_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/generuj-odpowiedz";

const PROCESSORS_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/procesorzy-reklamacji";

const UPDATE_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/aktualizacja-CER";

let archiveDirHandle = null;

function sanitizePathSegment(segment, fallback = "reklamacja") {
  if (!segment) return fallback;
  return segment.replace(/[\\/:*?"<>|]/g, "-").trim() || fallback;
}


/* ------------------------------------------------------------

   GLOBALNE REFERENCJE DO DOM

------------------------------------------------------------- */

const pages = document.querySelectorAll(".page");

const langButtons = document.querySelectorAll(".lang-btn");

/* ------------------------------------------------------------

   BLOKADA HAS\u0141EM  prosty resetowany mechanizm

------------------------------------------------------------- */

const PASSWORD_VALUE = "inoparts";

const DEFAULT_NO_RESPONSE_TEXT =
  "Brak możliwości weryfikacji: Pomimo naszych prób kontaktu nie otrzymaliśmy odpowiedzi, dlatego zamykamy zgłoszenie.";

const COMPANY_VALUE =
  "INOPARTS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ\nUl. Adama Staszczyka 1/20, 30-123 Kraków\nNIP: 6772477900";

const DOCX_TRANSLATIONS = {
  PL: {
    companyLabel: "Dane firmy:",
    companyValue: "Ul. Adama Staszczyka 1/20, 30-123 Kraków\nNIP: 6772477900",
    customerLabel: "Dane klienta:",
    title: "Odpowiedź na reklamację",
    subjectLabel: "Przedmiot reklamacji:",
    valueLabel: "Wartość produktu:",
    complaintDateLabel: "Data zgłoszenia reklamacji:",
    purchaseDateLabel: "Data zakupu:",
    reasonLabel: "Powód reklamacji:",
    descriptionLabel: "Opis:",
    decisionLabel: "Decyzja reklamacyjna:",
    resolutionLabel: "Rozwiązanie sytuacji/Uzasadnienie:",
    footer:
      "Reklamacja została rozpatrzona z uwzględnieniem wszelkich praw wynikających z ustawy o prawach konsumenta oraz kodeksu cywilnego. Pragnę również poinformować, iż na niniejszą odpowiedź przysługuje prawo do odwołania się.\nZ wyrazami szacunku",
    complaintTitle: "Odpowiedź na reklamację",
    productsLabel: "Produkty:",
    productNameLabel: "Nazwa:",
    productSkuLabel: "SKU:",
    productEanLabel: "EAN:",
    productQuantityLabel: "Ilość:",
    complaintValueLabel: "Wartość produktu:",
    decisionValues: { pozytywna: "Pozytywna", negatywna: "Negatywna" }
  },
  CZ: {
    companyLabel: "Údaje o společnosti:",
    companyValue: "Ul. Adama Staszczyka 1/20, 30-123 Kraków\nNIP: 6772477900",
    customerLabel: "Údaje o zákazníkovi:",
    title: "Odpověď na stížnost",
    subjectLabel: "Předmět stížnosti:",
    valueLabel: "Hodnota produktu:",
    complaintDateLabel: "Datum podání stížnosti:",
    purchaseDateLabel: "Datum nákupu:",
    reasonLabel: "Důvod stížności:",
    descriptionLabel: "Popis:",
    decisionLabel: "Řešení stížnosti:",
    resolutionLabel: "Řešení/Odůvodnění:",
    footer:
      "Stížnost była posouzena z uwzględnieniem wszystkich praw wynikających ze zákona o právech spotřebitelů a občanského zákoníku. Rád/a bych Vás także informował/a, że mám prawo se proti této odpovědi odwołać.\nS pozdravem,",
    complaintTitle: "Odpověď na stížnost",
    productsLabel: "Produkty:",
    productNameLabel: "Název:",
    productSkuLabel: "SKU:",
    productEanLabel: "EAN:",
    productQuantityLabel: "Množství:",
    complaintValueLabel: "Hodnota produktu:",
    decisionValues: { pozytywna: "Pozitivní", negatywna: "Negativní" }
  },
  DE: {
    companyLabel: "INOPARTS SP. Z O.O.",
    companyValue: "Ul. Adama Staszczyka 1/20, 30-123 Kraków\nNIP: 6772477900",
    customerLabel: "Name des Kunden / Adresse des Kunden / PLZ und Ort des Kunden",
    title: "Antwort auf Ihre Reklamation",
    subjectLabel: "Betreff: Antwort auf Ihre Reklamation vom 05.11.2025",
    valueLabel: "Produktwert:",
    complaintDateLabel: "Reklamationsdatum:",
    purchaseDateLabel: "Kaufdatum:",
    reasonLabel: "Beschwerdegrund:",
    descriptionLabel: "Begründung:",
    decisionLabel: "Entscheidung:",
    resolutionLabel: "Begründung:",
    footer:
      "Ihre Reklamation wurde unter Berücksichtigung aller gesetzlichen Rechte geprüft. Wir weisen Sie darauf hin, dass Sie das Recht haben, gegen diese Entscheidung Widerspruch einzulegen. Für weitere Rückfragen stehen wir Ihnen gerne zur Verfügung.\nMit freundlichen Grüßen",
    complaintTitle: "Antwort auf Ihre Reklamation",
    productsLabel: "Produkte:",
    productNameLabel: "Name:",
    productSkuLabel: "SKU:",
    productEanLabel: "EAN:",
    productQuantityLabel: "Menge:",
    complaintValueLabel: "Produktwert:",
    decisionValues: { pozytywna: "Positiv", negatywna: "Abgelehnt" }
  },
  SK: {
    companyLabel: "Údaje o spoločnosti:",
    companyValue: COMPANY_VALUE,
    customerLabel: "Údaje o zákazníkovi:",
    title: "Odpoveď na sťažność",
    subjectLabel: "Predmet sťažnosti:",
    valueLabel: "Hodnota produktu:",
    complaintDateLabel: "Dátum sťažności:",
    purchaseDateLabel: "Dátum nákupu:",
    reasonLabel: "Dôvod sťažności:",
    descriptionLabel: "Popis:",
    decisionLabel: "Riešenie sťažnosti:",
    resolutionLabel: "Riešenie/Odôvodnenie:",
    footer:
      "Sťažność była posúdena z uwzględnieniem wszystkich praw wynikających ze zákona o právach spotrebiteľov a Občianskeho zákonníka. Zároveň by som vás chcel informovať, że mám prawo sa proti tejto odpovedi odwołać.\nS pozdravom,",
    complaintTitle: "Odpoveď na sťažnosť",
    productsLabel: "Produkty:",
    productNameLabel: "Názov:",
    productSkuLabel: "SKU:",
    productEanLabel: "EAN:",
    productQuantityLabel: "Množstvo:",
    complaintValueLabel: "Hodnota produktu:",
    decisionValues: { pozytywna: "Pozitívna", negatywna: "Negatívna" }
  },
  HU: {
    companyLabel: "Cégadatok:",
    companyValue: COMPANY_VALUE,
    customerLabel: "Ügyféladatok:",
    title: "Válasz a panaszra",
    subjectLabel: "A panasz tárgya:",
    valueLabel: "Termék értéke:",
    complaintDateLabel: "A panasz dátuma:",
    purchaseDateLabel: "Vásárlás dátuma:",
    reasonLabel: "A panasz oka:",
    descriptionLabel: "Leírás:",
    decisionLabel: "A panasz megoldása:",
    resolutionLabel: "Megoldás/Indoklás:",
    footer:
      "A panaszt a fogyasztóvédelmi törvényből i kodeksu cywilnego figyelembevételével elbíráltuk. Szeretném tájékoztatni Önöket arról is, że jogom van fellebbezni a válasz ellen.\nTisztelettel",
    complaintTitle: "Válasz a panaszra",
    productsLabel: "Termékek:",
    productNameLabel: "Név:",
    productSkuLabel: "SKU:",
    productEanLabel: "EAN:",
    productQuantityLabel: "Mennyiség:",
    complaintValueLabel: "Termék értéke:",
    decisionValues: { pozytywna: "Pozitív", negatywna: "Negatív" }
  },
  EN: {
    companyLabel: "Company Details:",
    companyValue: COMPANY_VALUE,
    customerLabel: "Customer Details:",
    title: "Response to Complaint",
    subjectLabel: "Subject of Complaint:",
    valueLabel: "Product Value:",
    complaintDateLabel: "Date of Complaint:",
    purchaseDateLabel: "Purchase Date:",
    reasonLabel: "Reason for Complaint:",
    descriptionLabel: "Description:",
    decisionLabel: "Complaint Resolution:",
    resolutionLabel: "Resolution/Justification:",
    footer:
      "The complaint has been considered taking into account all rights arising from the Consumer Rights Act and the Civil Code. I would also like to inform you that I have the right to appeal this response.\nSincerely",
    complaintTitle: "Response to Complaint",
    productsLabel: "Products:",
    productNameLabel: "Name:",
    productSkuLabel: "SKU:",
    productEanLabel: "EAN:",
    productQuantityLabel: "Quantity:",
    complaintValueLabel: "Product Value:",
    decisionValues: { pozytywna: "Positive", negatywna: "Negative" }
  }
};



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

/* ------------------------------------------------------------
   NAWIGACJA MIĘDZY PODSTRONAMI
------------------------------------------------------------- */
function switchPage(pageIndex) {
  pages.forEach((page, idx) => {
    page.classList.toggle("page-active", idx === pageIndex - 1);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}
window.switchPage = switchPage;

function resetAllForms() {
  const skipIds = new Set(["password-input", "password-submit"]);
  document.querySelectorAll("input, textarea, select").forEach((el) => {
    if (skipIds.has(el.id)) return;
    if (el.type === "checkbox" || el.type === "radio") {
      el.checked = false;
    } else if (el.tagName === "SELECT") {
      el.selectedIndex = 0;
    } else {
      el.value = "";
    }
  });
  if (typeof s1OrderBox !== "undefined") s1OrderBox.classList.add("hidden");
  if (typeof s1Products !== "undefined") s1Products.innerHTML = "";
  if (typeof s1FetchedOrder !== "undefined") s1FetchedOrder = null;
  if (typeof s2SingleBox !== "undefined") { s2SingleBox.classList.add("hidden"); s2SingleBox.innerHTML = ""; }
  if (typeof s2ListBox !== "undefined") { s2ListBox.classList.add("hidden"); s2ListBox.innerHTML = ""; }
  if (typeof s3DetailsBox !== "undefined") { s3DetailsBox.classList.add("hidden"); s3DetailsBox.innerHTML = ""; }
  showToast("Wyczyszczono formularze");
}
window.resetAllForms = resetAllForms;

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

  return `${num.toFixed(2)}`;

}

function escapeHtml(str = "") {

  return String(str)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;");

}

function escapeAttribute(str = "") {

  return String(str)

    .replace(/&/g, "&amp;")

    .replace(/"/g, "&quot;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;");

}

function renderPreTableBox(title, rawText = "") {

  return `

    <div class="table-box">

      <pre style="white-space:pre-wrap; padding:12px;">${escapeHtml(title)}

${escapeHtml(rawText)}</pre>

    </div>`;

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

function parseStringPayload(payload) {

  try {

    const parsed = JSON.parse(payload);

    if (Array.isArray(parsed)) return { array: parsed, object: null };

    if (parsed && typeof parsed === "object") return { array: null, object: parsed };

  } catch {

    return { array: [], object: null };

  }

  return { array: [], object: null };

}

function extractArrayFromObject(payload) {

  const candidates = [payload.data, payload.items, payload.json, payload.body, payload.result, payload.records, payload.list];

  for (const c of candidates) if (Array.isArray(c)) return c;

  const keys = Object.keys(payload || {});

  if (keys.length && (keys.includes("claimId") || keys.includes("orderId") || keys.includes("Nr. Rek.") || keys.includes("rowNumber"))) {

    return [payload];

  }

  return null;

}

function toArray(payload) {

  if (Array.isArray(payload)) return payload;

  if (typeof payload === "string") {

    const { array, object } = parseStringPayload(payload);

    if (array) return array;

    if (object) return toArray(object);

    return [];

  }

  if (payload && typeof payload === "object") {

    const extracted = extractArrayFromObject(payload);

    if (extracted) return extracted;

  }

  return [];

}

function unwrapArray(payload) {

  const base = toArray(payload);

  return base.map((el) => (el && el.json && typeof el.json === "object" ? { ...el, ...el.json } : el));

}

function splitSemicolons(val) {

  if (!val) return [];

  if (Array.isArray(val)) return val;

  return String(val)

    .split(";")

    .map((s) => s.trim())

    .filter(Boolean);

}

function pickField(obj, keys = []) {

  for (const key of keys) {

    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {

      return obj[key];

    }

  }

  return undefined;

}

function flattenClaim(raw = {}) {

  return raw.json && typeof raw.json === "object" ? { ...raw, ...raw.json } : raw;

}

function formatDateDot(value) {
  if (!value) return "-";
  const str = String(value).trim();
  const dotMatch = str.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
  if (dotMatch) {
    const [_, dd, mm, yyyyRaw] = dotMatch;
    const yyyy = yyyyRaw.length === 2 ? `20${yyyyRaw}` : yyyyRaw;
    return `${dd.padStart(2, "0")}.${mm.padStart(2, "0")}.${yyyy}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return str;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function normalizeAddressParts(value) {

  if (!value) return [];

  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);

  return String(value)

    .split(/[;\n,]+/)

    .map((v) => v.trim())

    .filter(Boolean);

}

function buildAddressFromBill(bill) {

  if (!bill) return "";

  const parts = [];

  const directAddress =

    (typeof bill === "string" ? bill : null) || bill.address || bill.full || bill.fullAddress || bill.full_address;

  const normalized = normalizeAddressParts(directAddress);

  if (normalized.length) parts.push(...normalized);

  if (typeof bill === "object" && bill) {

    if (bill.street) parts.push(String(bill.street).trim());

    if (bill.home_number) parts.push(String(bill.home_number).trim());

    if (bill.flat_number) parts.push(String(bill.flat_number).trim());

    if (bill.postcode) parts.push(String(bill.postcode).trim());

    if (bill.city) parts.push(String(bill.city).trim());

    const countryLine =

      bill.country && typeof bill.country === "object" ? bill.country.code || bill.country.name : bill.country;

    if (countryLine) parts.push(String(countryLine).trim());

  }

  return parts.filter(Boolean).join(", ");

}

function deriveAddress(flat) {

  const rawAddress = pickField(flat, ["address", "billAddressFull"]) || (flat.orderDetails && flat.orderDetails.billAddressFull);

  const bill =

    flat.bill_address || flat.billAddress || flat.billAddressRaw || (flat.orderDetails && flat.orderDetails.bill_address);

  if (rawAddress) return rawAddress;

  if (bill) return buildAddressFromBill(bill);

  return undefined;

}

function normalizeProductArray(productsArr, currencyValue) {

  if (typeof productsArr === "string") return splitSemicolons(productsArr).map((name) => ({ name }));

  if (!Array.isArray(productsArr)) return [];

  return productsArr.map((p) => {

    const quantity = p.quantity ?? p.qty ?? p.orderedQuantity ?? p.ordered_quantity ?? p.amount;

    const priceValue = p.price ?? p.value ?? p.valueRaw ?? p.amount;

    const currencyGuess = p.currency ?? p.curr ?? currencyValue;

    return { ...p, quantity, price: priceValue, currency: currencyGuess };

  });

}

function buildProductsFromFields(flat, currencyValue) {

  const names = splitSemicolons(pickField(flat, ["Produkt Nazwa", "productName", "product_name"]));

  const skus = splitSemicolons(pickField(flat, ["Produkt SKU", "productSku", "product_sku", "skus"]));

  const eans = splitSemicolons(pickField(flat, ["Produkt EAN", "productEan", "product_ean", "eans"]));

  const qtys = splitSemicolons(
    pickField(flat, ["Produkt Ilość", "Produkt Ilosc", "productQty", "product_qty", "quantities"])
  );

  const vals = splitSemicolons(pickField(flat, ["Wartość", "Wartosc", "valueRaw", "value", "prices"]));

  const currsSource = pickField(flat, ["Waluta", "currency", "orderCurrency"]) || currencyValue;

  const currs = splitSemicolons(currsSource);

  const maxLen = Math.max(names.length, skus.length, eans.length, qtys.length, vals.length, currs.length);

  if (!maxLen) return [];

  return Array.from({ length: maxLen }).map((_, i) => ({

    name: names[i],

    sku: skus[i],

    ean: eans[i],

    quantity: qtys[i],

    price: vals[i],

    currency: currs[i]

  }));

}

function collectProducts(flat, currencyValue) {

  const productsArr =

    flat.products || (flat.orderDetails && flat.orderDetails.products) || (flat.body && flat.body.products);

  const normalized = normalizeProductArray(productsArr, currencyValue);

  if (normalized.length) return normalized;

  return buildProductsFromFields(flat, currencyValue);

}

function buildClaimPayload(flat, dates, customerValue, currencyValue) {

  return {

    claimId: flat.claimId || flat.caseNumber || flat.rowNumber || flat.orderId || flat.order || "",

    orderId: flat.orderId || flat.order || "",

    customer: customerValue !== undefined && customerValue !== null ? String(customerValue) : "",

    customerLogin: pickField(flat, ["customerLogin", "clientNick", "customerNick"]),

    marketplace: flat.marketplace || flat.platform || "",

    status: flat.status || (flat.isClosed ? "Zakończone" : ""),

    value:

      flat.value ??

      flat.valueNumber ??

      flat.valueRaw ??

      flat.amount ??

      flat.total ??

      (flat.pricing && flat.pricing.total),

    currency: currencyValue,

    reason: flat.reason,

    type: flat.type,

    decision: flat.decision,

    resolution: flat.resolution,

    agent: flat.agent,

    myNewField: flat.myNewField,

    note: flat.note,

    receivedAt: flat.receivedAt || dates.receivedAt || new Date().toISOString().slice(0, 10),

    decisionDue: flat.decisionDue || dates.decisionDue,

    resolvedAt: flat.resolvedAt || dates.resolvedAt,

    rowNumber: flat.rowNumber,

    address: deriveAddress(flat),

    products: collectProducts(flat, currencyValue)

  };

}

function normalizeClaim(raw = {}) {

  const flat = flattenClaim(raw);

  const dates = flat.dates || {};

  const customerValue = pickField(flat, [

    "customer",

    "clientNick",

    "customerNick",

    "client",

    "clientName",

    "customerName"

  ]);

  const currencyValue =

    pickField(flat, ["currency", "orderCurrency"]) ||

    (flat.orderDetails && flat.orderDetails.currency);

  return buildClaimPayload(flat, dates, customerValue, currencyValue);

}

function renderProductItem(p, currencyFallback) {

  return `<li>
              ${p.name ? `<strong>Nazwa:</strong> ${escapeHtml(p.name)}<br>` : ""}
              ${p.sku ? `<strong>SKU:</strong> ${escapeHtml(p.sku)}<br>` : ""}
              ${p.ean ? `<strong>EAN:</strong> ${escapeHtml(p.ean)}<br>` : ""}
              ${
                p.price !== undefined && p.price !== null && p.price !== ""
                  ? `<strong>Wartość:</strong> ${formatCurrency(p.price)} ${p.currency || currencyFallback}<br>`
                  : ""
              }
              ${
                p.quantity !== undefined && p.quantity !== null
                  ? `<strong>Ilość:</strong> ${p.quantity}<br>`
                  : ""
              }
            </li>`;

}

function renderProductsBlock(claim) {

  const products = Array.isArray(claim.products) ? claim.products : [];

  if (!products.length) return { html: `<div class="value">-</div>`, count: 0 };

  const currencyFallback = claim.currency || "";

  const items = products.map((p) => renderProductItem(p, currencyFallback)).join("");

  return { html: `<ul class="products-list">${items}</ul>`, count: products.length };

}

function renderClaimTimeline(claim) {

  return `<div class="claim-card__timeline">
          <div><span>Data przyjęcia</span><strong>${formatDate(claim.receivedAt)}</strong></div>
          <div><span>Termin decyzji</span><strong>${formatDate(claim.decisionDue)}</strong></div>
          <div><span>Data rozwiązania</span><strong>${formatDate(claim.resolvedAt)}</strong></div>
        </div>`;

}

function renderCustomerGrid(claim) {

  return `<div class="claim-card__grid">
          <div><div class="label">Dane klienta</div><div class="value">${claim.customer || "-"}</div></div>
          <div><div class="label">Login</div><div class="value">${claim.customerLogin || "-"}</div></div>
          <div><div class="label">Adres</div><div class="value" data-field="address">${claim.address || "-"}</div></div>
          <div><div class="label">Marketplace</div><div class="value">${claim.marketplace || "-"}</div></div>
        </div>`;

}

function renderDecisionGrid(claim) {

  return `<div class="claim-card__grid">
          <div><div class="label">Powód zgłoszenia</div><div class="value" data-field="reason">${claim.reason || "-"}</div></div>
          <div><div class="label">Typ</div><div class="value" data-field="type">${claim.type || "-"}</div></div>
          <div><div class="label">Decyzja</div><div class="value" data-field="decision">${claim.decision || "-"}</div></div>
          <div><div class="label">Rozwiązanie</div><div class="value" data-field="resolution">${claim.resolution || "-"}</div></div>
          <div><div class="label">Notatka</div><div class="value" data-field="note">${claim.note || "-"}</div></div>
          ${claim.agent ? `<div><div class="label">Agent</div><div class="value" data-field="agent">${claim.agent}</div></div>` : `<div><div class="label">Agent</div><div class="value" data-field="agent">-</div></div>`}
          ${claim.myNewField ? `<div><div class="label">myNewField</div><div class="value">${claim.myNewField}</div></div>` : ""}
        </div>`;

}

function renderClaimCard(raw, actionHtml = "") {
  const claim = normalizeClaim(raw);

  const { html: productsBlock, count: productsCount } = renderProductsBlock(claim);
  const claimData = encodeURIComponent(JSON.stringify(claim));
  const cardId = claim.claimId || claim.orderId || "";
  const actions = [actionHtml, `<button class="btn btn-secondary edit-claim-btn">Edytuj</button>`]
    .filter(Boolean)
    .join("");

  return `
    <div class="claim-card claim-card--split" data-claim="${claimData}" data-claim-id="${escapeAttribute(cardId)}">
      <div class="claim-card__panel claim-card__panel--main">
        <div class="claim-card__header">
          <div>
            <div class="claim-card__id">Reklamacja: ${claim.claimId || "-"}</div>
            <div class="claim-card__order">Zamówienie: ${claim.orderId || "-"}</div>
          </div>
          ${claim.status ? `<div class="claim-card__status">${claim.status}</div>` : ""}
        </div>

        <div class="claim-card__keyline">
          <div><div class="label">Klient</div><div class="value">${claim.customer || "-"}</div></div>
          <div><div class="label">Marketplace</div><div class="value">${claim.marketplace || "-"}</div></div>
        </div>

        ${renderClaimTimeline(claim)}

        ${renderCustomerGrid(claim)}

        ${renderDecisionGrid(claim)}

        <div class="claim-card__actions">${actions}</div>
      </div>

      <div class="claim-card__panel claim-card__panel--products">
        <div class="products-block">
          <div class="label" style="margin-bottom:6px;">Reklamowane produkty <span class="products-count">${productsCount}</span></div>
          ${productsBlock}
        </div>
      </div>
    </div>`;
}

function toggleRowDetails(id, btn) {

  const row = document.querySelector(`.expand-row[data-exp-id="${id}"]`);

  if (!row) return;

  const isOpen = row.style.display !== "none";

  row.style.display = isOpen ? "none" : "table-row";

    if (btn) btn.textContent = isOpen ? "Rozwiń ▼" : "Zwiń ▲";

}

window.toggleRowDetails = toggleRowDetails;

function handleExpand(id, btn) {

  toggleRowDetails(id, btn);

}

window.handleExpand = handleExpand;

function handleGenerateClick(id) {

  switchPage(4);

  const input = document.getElementById("s3-number");

  if (input) input.value = id || "";

  const fetchBtn = document.getElementById("s3-fetch");

  if (fetchBtn) fetchBtn.click();

}

window.handleGenerateClick = handleGenerateClick;

function getClaimFromCard(cardEl) {

  if (!cardEl) return null;

  const data = cardEl.dataset.claim;

  if (!data) return null;

  try {

    return JSON.parse(decodeURIComponent(data));

  } catch (err) {

    console.warn("Nie udało się odczytać danych reklamacji", err);

    return null;

  }

}

function updateCardDataset(cardEl, claim) {

  if (!cardEl || !claim) return;

  cardEl.dataset.claim = encodeURIComponent(JSON.stringify(claim));

}

function getTypeOptionsForEdit(selectedValue) {

  const select = document.getElementById("s1-type");

  const options = select

    ? Array.from(select.options).map((opt) => ({ value: opt.value, text: opt.textContent }))

    : [

        { value: "1", text: "Typ 1" },

        { value: "2", text: "Typ 2" },

        { value: "3", text: "Typ 3" },

        { value: "4", text: "Typ 4" },

        { value: "5", text: "Typ 5" },

        { value: "6", text: "Typ 6" },

        { value: "7", text: "Typ 7" },

        { value: "8", text: "Typ 8" },

        { value: "9", text: "Typ 9" },

        { value: "10", text: "Typ 10" }

      ];

  return options

    .map((opt) => {

      const isSelected = String(opt.value) === String(selectedValue);

      return `<option value="${escapeAttribute(opt.value)}"${isSelected ? " selected" : ""}>${escapeHtml(opt.text)}</option>`;

    })

    .join("");

}

function deriveTypeLabel(value) {

  const select = document.getElementById("s1-type");

  if (select) {

    const match = Array.from(select.options).find((opt) => String(opt.value) === String(value));

    if (match) return match.textContent.trim();

  }

  return value;

}

function buildEditControl(field, value) {

  const baseAttr = `class="edit-input" data-edit-field="${field}"`;

  if (["reason", "resolution", "note"].includes(field)) {

    return `<textarea ${baseAttr}>${escapeHtml(value || "")}</textarea>`;

  }

  if (field === "type") {

    return `<select ${baseAttr}>${getTypeOptionsForEdit(value)}</select>`;

  }

  return `<input type="text" ${baseAttr} value="${escapeAttribute(value || "")}" />`;

}

function enterClaimEdit(cardEl, triggerBtn) {

  if (!cardEl || cardEl.classList.contains("claim-card--editing")) return;

  const claim = getClaimFromCard(cardEl);

  if (!claim) return showToast("Brak danych do edycji", "error");

  const editableFields = ["address", "reason", "type", "decision", "resolution", "note", "agent"];

  editableFields.forEach((field) => {

    const slot = cardEl.querySelector(`.value[data-field="${field}"]`);

    if (!slot) return;

    slot.dataset.originalDisplay = slot.innerHTML;

    slot.innerHTML = buildEditControl(field, claim[field] || "");

  });

  cardEl.classList.add("claim-card--editing");

  const actions = cardEl.querySelector(".claim-card__actions");

  if (actions && !actions.querySelector(".save-claim-btn")) {

    const saveBtn = document.createElement("button");

    saveBtn.className = "btn btn-primary save-claim-btn";

    saveBtn.textContent = "Zapisz";

    actions.appendChild(saveBtn);

  }

  if (triggerBtn) {

    triggerBtn.disabled = true;

    triggerBtn.dataset.originalLabel = triggerBtn.textContent;

    triggerBtn.textContent = "Tryb edycji";

  }

}

function collectUpdatedClaim(cardEl) {

  const claim = getClaimFromCard(cardEl);

  if (!claim) return null;

  const updated = { ...claim };

  cardEl.querySelectorAll("[data-edit-field]").forEach((input) => {

    const field = input.dataset.editField;

    if (!field) return;

    let value = input.value;

    if (typeof value === "string") value = value.trim();

    if (field === "type" && input instanceof HTMLSelectElement) {

      const selected = input.options[input.selectedIndex];

      updated.type = value;

      updated.typeLabel = selected ? selected.textContent.trim() : value;

    } else {

      updated[field] = value;

    }

  });

  return updated;

}

function refreshCardAfterSave(cardEl, claim) {

  const map = {

    address: claim.address,

    reason: claim.reason,

    type: claim.typeLabel || deriveTypeLabel(claim.type),

    decision: claim.decision,

    resolution: claim.resolution,

    note: claim.note,

    agent: claim.agent

  };

  Object.entries(map).forEach(([field, value]) => {

    const slot = cardEl.querySelector(`.value[data-field="${field}"]`);

    if (!slot) return;

    const display = value !== undefined && value !== null && String(value).trim() !== "" ? value : "-";

    slot.textContent = display;

  });

  const saveBtn = cardEl.querySelector(".save-claim-btn");

  if (saveBtn) saveBtn.remove();

  const editBtn = cardEl.querySelector(".edit-claim-btn");

  if (editBtn) {

    editBtn.disabled = false;

    editBtn.textContent = editBtn.dataset.originalLabel || "Edytuj";

  }

  cardEl.classList.remove("claim-card--editing");

}

async function saveClaimChanges(cardEl, saveBtn) {

  if (!cardEl) return;

  const updatedClaim = collectUpdatedClaim(cardEl);

  if (!updatedClaim) return;

  if (saveBtn) saveBtn.disabled = true;

  try {

    const res = await fetch(UPDATE_CER_WEBHOOK, {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify(updatedClaim)

    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    updateCardDataset(cardEl, updatedClaim);

    refreshCardAfterSave(cardEl, updatedClaim);

    showToast("Pomyślnie zapisano");

  } catch (err) {

    console.error(err);

    showToast("Błąd zapisu", "error");

  } finally {

    if (saveBtn) saveBtn.disabled = false;

  }

}

function attachClaimEditHandlers() {

  document.addEventListener("click", (evt) => {

    const editBtn = evt.target.closest(".edit-claim-btn");

    if (editBtn) {

      const card = editBtn.closest(".claim-card");

      if (card) enterClaimEdit(card, editBtn);

      return;

    }

    const saveBtn = evt.target.closest(".save-claim-btn");

    if (saveBtn) {

      const card = saveBtn.closest(".claim-card");

      if (card) saveClaimChanges(card, saveBtn);

    }

  });

}

function appendCompanySection(docChildren, t, Paragraph, TextRun) {

  docChildren.push(
    new Paragraph({ children: [new TextRun({ text: t.companyLabel, bold: true })], spacing: { after: 80 } })
  );

  t.companyValue

    .split("\n")

    .forEach((line) => docChildren.push(new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: 40 } })));

}

function appendClientSection(docChildren, t, claim, Paragraph, TextRun) {

  docChildren.push(

    new Paragraph({ children: [new TextRun({ text: t.customerLabel, bold: true })], spacing: { before: 120, after: 80 } })

  );

  if (claim.customer) docChildren.push(new Paragraph({ children: [new TextRun({ text: claim.customer })], spacing: { after: 40 } }));

  if (claim.address)

    docChildren.push(new Paragraph({ children: [new TextRun({ text: claim.address })], spacing: { after: 120 } }));

}

function appendTitleSection(docChildren, t, Paragraph, TextRun, AlignmentType) {

  docChildren.push(

    new Paragraph({

      children: [new TextRun({ text: t.title, bold: true })],

      alignment: AlignmentType.CENTER,

      spacing: { after: 200 }

    })

  );

}

function appendProductsSection(docChildren, t, claim, addParagraph) {

  const products = Array.isArray(claim.products) ? claim.products : [];

  if (!products.length) return;

  addParagraph(t.productsLabel || t.productLabel || "", "");

  products.forEach((p) => {

    addParagraph(t.productNameLabel || "Nazwa:", p.name || "-");

    addParagraph(t.productSkuLabel || "SKU:", p.sku || "-");

    addParagraph(t.productEanLabel || "EAN:", p.ean || "-");

    addParagraph(
      t.productQuantityLabel || "Ilość:",
      p.quantity !== undefined && p.quantity !== null ? String(p.quantity) : "-"
    );

    addParagraph(t.complaintValueLabel, `${p.price ?? ""} ${p.currency || claim.currency || ""}`.trim());

  });

}

function appendMetadataSection(docChildren, t, claim, addParagraph, today, decisionValue, answerText) {

  addParagraph(t.complaintDateLabel, formatDate(claim.receivedAt || today));

  addParagraph(t.purchaseDateLabel, formatDate(claim.purchaseDate || claim.orderDate));

  addParagraph(t.reasonLabel, claim.reason || claim.type || "-");

  addParagraph(t.descriptionLabel, claim.reason || "-");

  addParagraph(t.decisionLabel, decisionValue || "-");

  addParagraph(t.resolutionLabel, answerText || "-");

}

function appendFooterSection(docChildren, t, Paragraph, TextRun) {

  t.footer

    .split("\n")

    .forEach((line) => docChildren.push(new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: 80 } })));

}

function buildDocxGerman(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;

  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decisionText =
    (decisionValue || "").toLowerCase().includes("neg") ? "Abgelehnt" : decisionValue || "Abgelehnt";
  const products = Array.isArray(claim.products) ? claim.products : [];
  const firstProduct = products[0] || {};
  const priceText = `${firstProduct.price ?? ""} ${firstProduct.currency || claim.currency || ""}`.trim();

  const docChildren = [];
  const addParagraph = (opts) => docChildren.push(new Paragraph(opts));

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: `${todayDot}, Kraków`, bold: true })],
    spacing: { after: 240 }
  });

  addParagraph({
    children: [new TextRun({ text: "INOPARTS SP. Z O.O.", bold: true })],
    spacing: { after: 40 }
  });
  addParagraph({ children: [new TextRun({ text: "Ul. Adama Staszczyka 1/20, 30-123 Kraków" })], spacing: { after: 20 } });
  addParagraph({ children: [new TextRun({ text: "NIP: 6772477900" })], spacing: { after: 200 } });

  if (claim.customer || claim.address) {
    const clientLines = [claim.customer, claim.address].filter(Boolean).join("\n");
    addParagraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: clientLines })],
      spacing: { after: 200 }
    });
  }

  addParagraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Antwort auf Ihre Reklamation", bold: true, underline: {} })],
    spacing: { after: 200 }
  });

  addParagraph({ children: [new TextRun({ text: "Produkte:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Name", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "EAN", value: firstProduct.ean },
      { label: "Menge", value: firstProduct.quantity },
      { label: "Produktwert", value: priceText }
    ];
    bullets.forEach((item) => {
      addParagraph({
        children: [
          new TextRun({ text: "•  " }),
          new TextRun({ text: `${item.label}: `, bold: true }),
          new TextRun({ text: item.value !== undefined && item.value !== null && item.value !== "" ? String(item.value) : "-" })
        ],
        spacing: { after: 40 }
      });
    });
  } else {
    addParagraph({ children: [new TextRun({ text: "•  -" })], spacing: { after: 80 } });
  }

  const addLabelValue = (label, value) => {
    addParagraph({
      children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: value || "-" })],
      spacing: { after: 120 }
    });
  };

  addLabelValue("Kaufdatum", purchaseDate);
  addLabelValue("Reklamationsdatum", complaintDate);
  addLabelValue("Beschwerdegrund", claim.reason || "-");
  addLabelValue("Entscheidung", decisionText || "-");
  addLabelValue("Begründung", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Ihre Reklamation wurde unter Berücksichtigung aller gesetzlichen Rechte geprüft. Wir weisen Sie darauf hin, dass Sie das Recht haben, gegen diese Entscheidung Widerspruch einzulegen. Für weitere Rückfragen stehen wir Ihnen gerne zur Verfügung.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Mit freundlichen Grüßen" })],
    spacing: { after: 120 }
  });

  return Packer.toBlob(
    new Document({
      sections: [{ children: docChildren }]
    })
  );
}

function buildDocx(claim, lang, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;
  const t = DOCX_TRANSLATIONS[lang] || DOCX_TRANSLATIONS.PL;

  if (lang === "DE") return buildDocxGerman(claim, answerText, decisionValue);

  const today = new Date().toISOString().slice(0, 10);
  const docChildren = [];

  const addParagraph = (label, value) => {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: label + " ", bold: true }),
          new TextRun({ text: value || "-" })
        ],
        spacing: { after: 120 }
      })
    );
  };

  appendCompanySection(docChildren, t, Paragraph, TextRun);
  appendClientSection(docChildren, t, claim, Paragraph, TextRun);
  appendTitleSection(docChildren, t, Paragraph, TextRun, AlignmentType);
  appendProductsSection(docChildren, t, claim, addParagraph);
  appendMetadataSection(docChildren, t, claim, addParagraph, today, decisionValue, answerText);
  appendFooterSection(docChildren, t, Paragraph, TextRun);

  return Packer.toBlob(
    new Document({
      sections: [{ children: docChildren }]
    })
  );
}

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

function attachS1FetchListener() {

  if (!s1FetchBtn) return;

  s1FetchBtn.addEventListener("click", async () => {

  const num = s1OrderInput.value.trim();

  if (!num) return showToast("Wpisz numer zam\u00f3wienia", "error");

  try {

    // Uycie jawnego linku webhooka pomaga unika bdnych skadek i pokazuje peny adres dla GitHub Pages

    const res = await fetch(`${SELLASIST_WEBHOOK}?order=${encodeURIComponent(num)}`);

    const rawData = await res.json();
    const dataItem = Array.isArray(rawData) ? rawData[0] : rawData;
    const data = dataItem && typeof dataItem === "object" && dataItem.json ? dataItem.json : dataItem;

    s1FetchedOrder = data;
    // Wywietlenie boxa

    s1OrderBox.classList.remove("hidden");

    // Produkty  przykad danych w komentarzu:

    // data.products = [

    //   { sku: "SKU123", name: "Buty zimowe", quantity: 2 },

    //   { sku: "SKU999", name: "Czapka", quantity: 1 }

    // ]

    const productsArr = Array.isArray(data?.products) ? data.products : [];

    s1Products.innerHTML = productsArr.length
      ? productsArr
          .map(
            (p, idx) => `
        <div class="product-row">
          <label>
            <input type="checkbox" class="s1-prod-check" data-index="${idx}" />
            ${p.name} (${p.sku}) - ${p.price ?? ""} zł zamówiono: ${p.quantity}
          </label>
          <input type="number" class="s1-prod-qty" data-index="${idx}" min="1" max="${p.quantity || 1}" value="${p.quantity || 1}" />
        </div>
      `
          )
          .join("")
      : `<div class="muted">Brak produktów w odpowiedzi</div>`;

    const bill =
      data.bill_address ||
      data.billAddress ||
      data.billAddressRaw ||
      data.billAddressFull ||
      (data.orderDetails && data.orderDetails.bill_address);

    const billParts = [];
    if (bill) {
      const directAddress =
        (typeof bill === "string" ? bill : null) ||
        bill.address ||
        bill.full ||
        bill.fullAddress ||
        bill.full_address;
      billParts.push(...normalizeAddressParts(directAddress));
      if (typeof bill === "object" && bill) {
        if (bill.street) billParts.push(String(bill.street).trim());
        if (bill.home_number) billParts.push(String(bill.home_number).trim());
        if (bill.flat_number) billParts.push(String(bill.flat_number).trim());
        if (bill.postcode) billParts.push(String(bill.postcode).trim());
        if (bill.city) billParts.push(String(bill.city).trim());
        const countryLine =
          bill.country && typeof bill.country === "object"
            ? bill.country.code || bill.country.name
            : bill.country;
        if (countryLine) billParts.push(String(countryLine).trim());
      }
    }
    const billInput = document.getElementById("s1-bill-full");
    if (billInput) billInput.value = billParts.filter(Boolean).join(", ");

    document.getElementById("s1-client-name").value = data.clientName || "";

    document.getElementById("s1-client-email").value = data.clientEmail || "";

    document.getElementById("s1-client-phone").value = data.clientPhone || "";

    document.getElementById("s1-client-nick").value = data.clientNick || "";

    document.getElementById("s1-country").value = data.country || "";

    document.getElementById("s1-date").value = data.orderDate || "";

    document.getElementById("s1-platform").value = data.platform || "";

    document.getElementById("s1-shipping").value = data.shippingCost ?? "";

    showToast("Pobrano dane zam\u00f3wienia");

  } catch (err) {

    showToast("B\u0142\u0105d pobierania", "error");

  }

  });
}

/* Zapisywanie zgoszenia */

function attachS1SaveListener() {

  if (!s1SaveBtn) return;

  s1SaveBtn.addEventListener("click", async () => {

  const payload = {

    order: s1OrderInput.value,

    orderDetails: s1FetchedOrder,

    reportDate: document.getElementById("s1-report-date").value,

    type: document.getElementById("s1-type").value,

    reason: document.getElementById("s1-reason").value,

    employee: document.getElementById("s1-employee").value,

    note: document.getElementById("s1-note").value,

    products: (() => {
      const out = [];
      Array.from(document.querySelectorAll(".product-row")).forEach((row, idx) => {
        const check = row.querySelector(".s1-prod-check");
        if (!check || !check.checked) return;
        const qty = row.querySelector(".s1-prod-qty");
        const meta = s1FetchedOrder?.products?.[idx] || {};
        const quantity = Math.max(1, Number(qty?.value || meta.quantity || 1));
        out.push({
          quantity,
          sku: meta.sku,
          name: meta.name,
          orderedQuantity: meta.quantity,
          price: Number(meta.price ?? 0),
          ean: meta.ean
        });
      });
      return out;
    })()

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
}

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

  const section = document.getElementById("page-3");

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

function attachS2SearchListener() {

  if (!s2SearchBtn) return;

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

      `<button class="btn btn-primary" onclick="handleGenerateClick('${claim.claimId || claim.orderId || ""}')">Generuj odpowiedź</button>`

    );

    showToast("Pobrano zg\u0142oszenie");

  } catch {

    showToast("Nie znaleziono", "error");

  }

  });
}

/* Pobieranie listy zgosze (tabela) */

function attachS2RangeListener() {

  if (!s2RangeBtn) return;

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

      s2ListBox.innerHTML = renderPreTableBox(`B\u0142\u0105d HTTP ${res.status}`, rawText);

      showToast(`B\u0142\u0105d pobierania (${res.status})`, "error");

      return;

    }

    if (!rows.length) {

      s2ListBox.innerHTML = renderPreTableBox(

        "Brak rozpoznanych danych. Surowa odpowied webhooka:",

        rawText

      );

      showToast("Brak danych z webhooka", "error");

      return;

    }

    let html = `
      <table>
        <tr>
          <th>#</th>
          <th>Reklamacja</th>
          <th>Zamówienie</th>
          <th>Klient</th>
          <th>Marketplace</th>
          <th>Status</th>
          <th>Przyjęcie</th>
          <th>Termin decyzji</th>
          <th>Rozwiązanie</th>
          <th>Akcja</th>
        </tr>
`;

    rows.forEach((row, idx) => {
      const claim = normalizeClaim(row);
      const expId = `exp-${claim.claimId || claim.rowNumber || idx}`;

      html += `
        <tr>
          <td>${claim.rowNumber ? claim.rowNumber : idx + 1}</td>
          <td class="link" onclick="document.getElementById('s2-search').value='${claim.claimId || ""}'">${claim.claimId || "-"}</td>
          <td>${claim.orderId || "-"}</td>
          <td>${claim.customer || "-"}</td>
          <td>${claim.marketplace || "-"}</td>
          <td>${claim.status || "-"}</td>
          <td>${formatDate(claim.receivedAt)}</td>
          <td>${formatDate(claim.decisionDue)}</td>
          <td>${formatDate(claim.resolvedAt)}</td>
          <td>
            <div class="action-cell">
              <button class="expand-btn expand-btn--wide" onclick="handleExpand('${expId}', this)">Rozwiń ▼</button>
              <button class="btn btn-dark" onclick="handleGenerateClick('${claim.claimId || claim.orderId || ""}')">Generuj odpowiedź</button>
            </div>
          </td>
        </tr>
        <tr class="expand-row" data-exp-id="${expId}" style="display:none">
          <td colspan="10">
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
}

/* ============================================================

   CZ\u0118 3  GENERATOR ODPOWIEDZI

   ============================================================ */

const s3FetchBtn = document.getElementById("s3-fetch");

const s3NumberInput = document.getElementById("s3-number");

const s3DetailsBox = document.getElementById("s3-details");

const s3GenBtn = document.getElementById("s3-generate");
const s3DocxBtn = document.getElementById("s3-docx");

let selectedLang = "PL";
const mapLangForBackend = (lang) => (lang === "CZ" ? "CS" : lang);

let s3CurrentClaim = null;

/* Zmiana jzyka tumaczenia */

function attachLanguageListeners() {

  const langButtons = document.querySelectorAll(".lang-btn");

  langButtons.forEach((btn) => {

    btn.addEventListener("click", () => {

      selectedLang = btn.dataset.lang;

      langButtons.forEach((b) => {
        b.style.background = "";
        b.style.color = "";
      });

      btn.style.background = "var(--orange)";

      btn.style.color = "#fff";

    });

  });

}

/* Pobieranie danych zgoszenia */

function attachS3FetchListener() {

  if (!s3FetchBtn) return;

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

    // Ukryj pola Decyzja, Rozwiązanie i Data rozwiązania tylko w generatorze

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
}

/* Generowanie PDF */

function attachS3GenerateListener() {

  if (!s3GenBtn) return;

  s3GenBtn.addEventListener("click", async () => {
    if (!window.docx) return showToast("Brak biblioteki DOCX", "error");

    const num = s3NumberInput.value.trim();
    const decision = document.getElementById("s3-decision").value;
    const noResp = document.getElementById("s3-noresp").checked;

    if (!num) return showToast("Podaj numer", "error");

    const answer = noResp ? DEFAULT_NO_RESPONSE_TEXT : document.getElementById("s3-answer").value;

    const payload = {
      number: num,
      decision,
      language: mapLangForBackend(selectedLang),
      answer,
      noResponse: noResp,
      products: Array.isArray(s3CurrentClaim?.products)
        ? s3CurrentClaim.products.map((p) => ({
            name: p.name,
            sku: p.sku,
            ean: p.ean,
            quantity: p.quantity,
            price: p.price,
            currency: p.currency
          }))
        : [],
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
            note: s3CurrentClaim.note,
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

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const responseJson = await res.json();
    const responseItem = Array.isArray(responseJson) ? responseJson[0] : responseJson;
    const translations = Array.isArray(responseItem?.translations) ? responseItem.translations : [];
    const translatedAnswer = translations[0]?.text || answer;
    const translatedDecision = translations[1]?.text || decision;
    const translatedReason = translations[2]?.text || s3CurrentClaim?.reason;

    const docClaim = { ...s3CurrentClaim, reason: translatedReason };
    const lang = (selectedLang || "PL").toUpperCase();
    const t = DOCX_TRANSLATIONS[lang] || DOCX_TRANSLATIONS.PL;
    const decisionValue = translatedDecision || t.decisionValues?.[decision] || decision;

    const blob = await buildDocx(docClaim, lang, translatedAnswer, decisionValue);
    const defaultArchivePath = "W:\\Reklamacje\\Archiwum odpowiedzi na reklamacje";
    const filename = `CER-${num}.docx`;
    const folderName = sanitizePathSegment(num, "reklamacja");
    let saved = false;

    const writeBlobToHandle = async (fileHandle) => {
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      saved = true;
    };

    const pickerTypes = [
      {
        description: "Dokument DOCX",
        accept: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }
      }
    ];

    if (window.showDirectoryPicker) {
      try {
        const baseDir = await window.showDirectoryPicker({
          mode: "readwrite",
          id: "cer-archive-root",
          startIn: archiveDirHandle || defaultArchivePath
        });
        archiveDirHandle = baseDir;
        const claimDir = await baseDir.getDirectoryHandle(folderName, { create: true });
        const fileHandle = await claimDir.getFileHandle(filename, { create: true });
        await writeBlobToHandle(fileHandle);
      } catch (dirErr) {
        console.warn("Directory picker unavailable, trying file picker", dirErr);
      }
    }

    if (!saved && window.showSaveFilePicker) {
      const pickerOptions = {
        suggestedName: filename,
        startIn: archiveDirHandle || defaultArchivePath,
        types: pickerTypes
      };

      try {
        const handle = await window.showSaveFilePicker(pickerOptions);
        await writeBlobToHandle(handle);
      } catch (pickerErr) {
        console.warn("Save picker unavailable with preferred location, retrying without startIn", pickerErr);
        try {
          const fallbackHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: pickerTypes
          });
          await writeBlobToHandle(fallbackHandle);
        } catch (fallbackErr) {
          console.warn("Save picker unavailable, falling back to download attribute", fallbackErr);
        }
      }
    }

    if (!saved) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      saved = true;
    }

    if (saved) showToast("Wygenerowano DOCX");
    } catch (err) {
      console.error(err);
      showToast("Błąd generowania", "error");
    }
  });
}

function attachNoResponseToggle() {
  const cb = document.getElementById("s3-noresp");
  const area = document.getElementById("s3-answer");
  const toggle = () => {
    if (!area) return;
    const hide = cb && cb.checked;
    area.style.display = hide ? "none" : "block";
    area.disabled = !!hide;
    if (hide) area.value = "";
  };
  if (cb) cb.addEventListener("change", toggle);
  toggle();
}

function attachProcessorForm() {
  const nameInput = document.getElementById("home-proc-name");
  const emailInput = document.getElementById("home-proc-email");
  const addBtn = document.getElementById("home-proc-add");

  if (!nameInput || !emailInput || !addBtn) return;

  addBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name || !email) return showToast("Podaj imię i email", "error");

    try {
      const res = await fetch(PROCESSORS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Dodano osobę procesującą");
      nameInput.value = "";
      emailInput.value = "";
    } catch (err) {
      console.error(err);
      showToast("Błąd dodawania", "error");
    }
  });
}

function initEvents() {

  document.addEventListener("DOMContentLoaded", initPasswordGate);

  attachS1FetchListener();
  attachS1SaveListener();
  attachS2SearchListener();
  attachS2RangeListener();
  attachClaimEditHandlers();
  attachLanguageListeners();
  attachS3FetchListener();
  attachS3GenerateListener();
  attachNoResponseToggle();
  attachProcessorForm();

}

initEvents();
