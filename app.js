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
    title: "Vyjádření k reklamaci",
    subjectLabel: "Vyjádření k reklamaci",
    valueLabel: "Hodnota produktu:",
    complaintDateLabel: "Datum přijetí reklamace:",
    purchaseDateLabel: "Datum nákupu:",
    reasonLabel: "Důvod reklamace:",
    descriptionLabel: "Odůvodnění:",
    decisionLabel: "Rozhodnutí o reklamaci:",
    resolutionLabel: "Odůvodnění:",
    footer:
      "Vaše reklamace byla posouzena v souladu se všemi zákonnými právy spotřebitele. Upozorňujeme, že máte právo podat proti tomuto rozhodnutí odvolání. V případě dalších dotazů jsme Vám plně k dispozici.\nS pozdravem,\nTým INOPARTS",
    complaintTitle: "Vyjádření k reklamaci",
    productsLabel: "Podrobnosti o produktu:",
    productNameLabel: "Název:",
    productSkuLabel: "SKU:",
    productEanLabel: "EAN:",
    productQuantityLabel: "Množství:",
    complaintValueLabel: "Hodnota produktu:",
    decisionValues: { pozytywna: "Uznáno", negatywna: "Zamítnuto" }
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

function formatClientLines(claim = {}) {

  const lines = [];

  if (claim.customer) lines.push(String(claim.customer));

  const parts = normalizeAddressParts(claim.address || claim.billAddressFull);

  if (!parts.length) return lines;

  const postalRegex = /^\d{2}-\d{3}$/;

  let street = parts[0];

  let postal = parts.find((p) => postalRegex.test(p));

  let city = "";

  let country = "";

  if (postal) {

    const idx = parts.indexOf(postal);

    city = parts[idx + 1] || "";

    country = parts[idx + 2] || parts[parts.length - 1] || "";

  } else if (parts.length >= 3) {

    street = parts[0];

    postal = parts[1];

    city = parts[2];

    country = parts[3] || "";

  } else if (parts.length === 2) {

    street = parts[0];

    city = parts[1];

  } else {

    street = parts.join(", ");

  }

  if (street) lines.push(street);

  if (postal || city) lines.push(`${postal ? postal + " " : ""}${city}`.trim());

  if (country && !lines.includes(country)) lines.push(country);

  return lines.filter(Boolean);

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

  docChildren.push(new Paragraph({ children: [new TextRun({ text: t.customerLabel, bold: true })], spacing: { before: 120, after: 80 } }));

  const clientLines = formatClientLines(claim);

  if (clientLines.length) {

    clientLines.forEach((line, idx) =>

      docChildren.push(new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: idx === clientLines.length - 1 ? 120 : 40 } }))

    );

  } else {

    docChildren.push(new Paragraph({ children: [new TextRun({ text: "-" })], spacing: { after: 120 } }));

  }

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

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: line })],
        spacing: { after: idx === clientLines.length - 1 ? 200 : 40 }
      })
    );
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

function buildDocxCzech(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;

  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decLower = String(decisionValue || "").toLowerCase();
  const decisionText = decLower.includes("zam")
    ? "Zamítnuto"
    : decLower.includes("uzn") || decLower.includes("poz")
    ? "Uznáno"
    : decisionValue || "Zamítnuto";
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

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: line })],
        spacing: { after: idx === clientLines.length - 1 ? 200 : 40 }
      })
    );
  }

  addParagraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Vyjádření k reklamaci", bold: true })],
    spacing: { after: 200 }
  });

  addParagraph({ children: [new TextRun({ text: "Podrobnosti o produktu:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Název", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "EAN", value: firstProduct.ean },
      { label: "Množství", value: firstProduct.quantity },
      { label: "Hodnota produktu", value: priceText }
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

  addLabelValue("Datum nákupu", purchaseDate);
  addLabelValue("Datum přijetí reklamace", complaintDate);
  addLabelValue("Důvod reklamace", claim.reason || "-");
  addLabelValue("Rozhodnutí o reklamaci", decisionText || "-");
  addLabelValue("Odůvodnění", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Vaše reklamace byla posouzena v souladu se všemi zákonnými právy spotřebitele. Upozorňujeme, že máte právo podat proti tomuto rozhodnutí odvolání. V případě dalších dotazů jsme Vám plně k dispozici.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "S pozdravem," })],
    spacing: { after: 80 }
  });

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Tým INOPARTS" })],
    spacing: { after: 120 }
  });

  return Packer.toBlob(
    new Document({
      sections: [{ children: docChildren }]
    })
  );
}

function buildDocxSlovak(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;

  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decLower = String(decisionValue || "").toLowerCase();
  const decisionText = decLower.includes("zam")
    ? "Zamietnuté"
    : decLower.includes("uzn") || decLower.includes("poz")
    ? "Uznané"
    : decisionValue || "Zamietnuté";
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
  addParagraph({ children: [new TextRun({ text: "IČ DPH: PL6772477900" })], spacing: { after: 200 } });

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: line })],
        spacing: { after: idx === clientLines.length - 1 ? 200 : 40 }
      })
    );
  }

  addParagraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Vyjadrenie k reklamácii", bold: true })],
    spacing: { after: 200 }
  });

  addParagraph({ children: [new TextRun({ text: "Podrobnosti o produkte:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Názov", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "EAN", value: firstProduct.ean },
      { label: "Množstvo", value: firstProduct.quantity },
      { label: "Hodnota produktu", value: priceText }
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

  addLabelValue("Dátum nákupu", purchaseDate);
  addLabelValue("Dátum prijatia reklamácie", complaintDate);
  addLabelValue("Dôvod reklamácie", claim.reason || "-");
  addLabelValue("Rozhodnutie o reklamácii", decisionText || "-");
  addLabelValue("Odôvodnenie", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Vaša reklamácia bola posúdená v súlade so všetkými zákonnými právami spotrebiteľa. Upozorňujeme Vás, že máte právo podať proti tomuto rozhodnutiu odvolanie. V prípade ďalších otázok sme Vám plne k dispozícii.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "S pozdravom," })],
    spacing: { after: 80 }
  });

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Tím INOPARTS" })],
    spacing: { after: 120 }
  });

  return Packer.toBlob(
    new Document({
      sections: [{ children: docChildren }]
    })
  );
}

function buildDocxHungarian(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;

  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decLower = String(decisionValue || "").toLowerCase();
  const decisionText = decLower.includes("elutas") || decLower.includes("neg")
    ? "Elutasítva"
    : decLower.includes("elfog") || decLower.includes("poz")
    ? "Elfogadva"
    : decisionValue || "Elutasítva";
  const products = Array.isArray(claim.products) ? claim.products : [];
  const firstProduct = products[0] || {};
  const priceText = `${firstProduct.price ?? ""} ${firstProduct.currency || claim.currency || ""}`.trim();

  const docChildren = [];
  const addParagraph = (opts) => docChildren.push(new Paragraph(opts));

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: `${todayDot}, Krakkó`, bold: true })],
    spacing: { after: 240 }
  });

  addParagraph({
    children: [new TextRun({ text: "INOPARTS SP. Z O.O.", bold: true })],
    spacing: { after: 40 }
  });
  addParagraph({ children: [new TextRun({ text: "Ul. Adama Staszczyka 1/20, 30-123 Kraków" })], spacing: { after: 20 } });
  addParagraph({ children: [new TextRun({ text: "Adószám (EU): PL6772477900" })], spacing: { after: 200 } });

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: line })],
        spacing: { after: idx === clientLines.length - 1 ? 200 : 40 }
      })
    );
  }

  addParagraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tájékoztatás reklamáció elbírálásáról", bold: true })],
    spacing: { after: 200 }
  });

  addParagraph({ children: [new TextRun({ text: "Termékadatok:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Terméknév", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "EAN", value: firstProduct.ean },
      { label: "Mennyiség", value: firstProduct.quantity },
      { label: "Termék értéke", value: priceText }
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

  addLabelValue("Vásárlás időpontja", purchaseDate);
  addLabelValue("Reklamáció bejelentésének időpontja", complaintDate);
  addLabelValue("Panasz oka", claim.reason || "-");
  addLabelValue("Reklamációval kapcsolatos döntés", decisionText || "-");
  addLabelValue("Indokolás", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Panaszát az összes törvényes fogyasztói jog figyelembevételével vizsgáltuk felül. Tájékoztatjuk, hogy Önnek jogában áll ezen döntés ellen fellebbezéssel élni. További kérdések esetén készséggel állunk rendelkezésére.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Üdvözlettel:" })],
    spacing: { after: 80 }
  });

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Az INOPARTS csapata" })],
    spacing: { after: 120 }
  });

  return Packer.toBlob(
    new Document({
      sections: [{ children: docChildren }]
    })
  );
}

function buildDocxEnglish(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;

  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decLower = String(decisionValue || "").toLowerCase();
  const decisionText = decLower.includes("reject") || decLower.includes("decline") || decLower.includes("neg")
    ? "Rejected"
    : decLower.includes("accept") || decLower.includes("approve") || decLower.includes("poz")
    ? "Accepted"
    : decisionValue || "Rejected";
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
  addParagraph({
    children: [new TextRun({ text: "Ul. Adama Staszczyka 1/20, 30-123 Kraków, Poland" })],
    spacing: { after: 20 }
  });
  addParagraph({ children: [new TextRun({ text: "VAT ID: PL6772477900" })], spacing: { after: 200 } });

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: line })],
        spacing: { after: idx === clientLines.length - 1 ? 200 : 40 }
      })
    );
  }

  addParagraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Response to Complaint", bold: true })],
    spacing: { after: 200 }
  });

  addParagraph({ children: [new TextRun({ text: "Product Details:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Product Name", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "EAN", value: firstProduct.ean },
      { label: "Quantity", value: firstProduct.quantity },
      { label: "Product Value", value: priceText }
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

  addLabelValue("Purchase Date", purchaseDate);
  addLabelValue("Date of Complaint", complaintDate);
  addLabelValue("Reason for Complaint", claim.reason || "-");
  addLabelValue("Decision", decisionText || "-");
  addLabelValue("Justification", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Your complaint has been reviewed in accordance with all applicable consumer rights and statutory regulations. Please be advised that you have the right to appeal this decision. Should you have any further questions, please do not hesitate to contact us.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Yours sincerely," })],
    spacing: { after: 80 }
  });

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "INOPARTS Team" })],
    spacing: { after: 120 }
  });

  return Packer.toBlob(
    new Document({
      sections: [{ children: docChildren }]
    })
  );
}

function buildDocxPolish(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;

  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decLower = String(decisionValue || "").toLowerCase();
  const decisionText = decLower.includes("odrz") || decLower.includes("neg")
    ? "Odrzucona"
    : decLower.includes("uzn") || decLower.includes("poz")
    ? "Uznana"
    : decisionValue || "";
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
    children: [new TextRun({ text: "Sprzedawca: INOPARTS SP. Z O.O.", bold: true })],
    spacing: { after: 40 }
  });
  addParagraph({ children: [new TextRun({ text: "Ul. Adama Staszczyka 1/20, 30-123 Kraków" })], spacing: { after: 20 } });
  addParagraph({ children: [new TextRun({ text: "NIP: 6772477900" })], spacing: { after: 200 } });

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: line })],
        spacing: { after: idx === clientLines.length - 1 ? 200 : 40 }
      })
    );
  }

  addParagraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Decyzja reklamacyjna", bold: true })],
    spacing: { after: 200 }
  });

  addParagraph({ children: [new TextRun({ text: "Szczegóły produktu:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Nazwa produktu", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "EAN", value: firstProduct.ean },
      { label: "Ilość", value: firstProduct.quantity },
      { label: "Wartość produktu", value: priceText }
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

  addLabelValue("Data zakupu", purchaseDate);
  addLabelValue("Data zgłoszenia reklamacji", complaintDate);
  addLabelValue("Powód reklamacji", claim.reason || "-");
  addLabelValue("Decyzja", decisionText || "-");
  addLabelValue("Uzasadnienie", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Państwa reklamacja została rozpatrzona zgodnie z obowiązującymi przepisami prawa oraz z uwzględnieniem praw konsumenta. Informujemy, że od powyższej decyzji przysługuje Państwu prawo do odwołania. W przypadku dodatkowych pytań pozostajemy do Państwa dyspozycji.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Z poważaniem," })],
    spacing: { after: 80 }
  });

  addParagraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Zespół INOPARTS" })],
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

  const upperLang = (lang || "").toUpperCase();
  if (upperLang === "DE") return buildDocxGerman(claim, answerText, decisionValue);
  if (upperLang === "CZ") return buildDocxCzech(claim, answerText, decisionValue);
  if (upperLang === "SK") return buildDocxSlovak(claim, answerText, decisionValue);
  if (upperLang === "HU") return buildDocxHungarian(claim, answerText, decisionValue);
  if (upperLang === "EN") return buildDocxEnglish(claim, answerText, decisionValue);

  return buildDocxPolish(claim, answerText, decisionValue);
}

document.addEventListener("DOMContentLoaded", () => {
  initPasswordGate();
  attachClaimEditHandlers();
});
