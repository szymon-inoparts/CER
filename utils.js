// Funkcje pomocnicze (formatowanie, parsowanie, normalizacja)

function sanitizePathSegment(segment, fallback = "reklamacja") {
  if (!segment) return fallback;
  return segment.replace(/[\\/:*?"<>|]/g, "-").trim() || fallback;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function formatDateTable(value) {
  return formatDate(value);
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const cleaned = typeof value === "string" ? value.replace(",", ".") : value;
  const num = Number(cleaned);
  if (Number.isNaN(num)) return value;
  return `${num.toFixed(2)}`;
}

function escapeHtml(str = "") {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(str = "") {
  return escapeHtml(String(str)).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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
  const objs = [];
  const regex = /{[\s\S]*?}/g;
  let match;
  while ((match = regex.exec(rawText))) {
    try {
      objs.push(JSON.parse(match[0]));
    } catch (err) {
      // ignore
    }
  }
  return objs;
}

function parseStringPayload(payload) {
  if (typeof payload !== "string") return { array: null, object: null };
  const { value, error } = safeJsonParse(payload);
  if (error) return { array: null, object: null };
  if (Array.isArray(value)) return { array: value, object: null };
  if (value && typeof value === "object") return { array: null, object: value };
  return { array: null, object: null };
}

function extractArrayFromObject(payload) {
  const candidates = [payload.data, payload.items, payload.json, payload.body, payload.result, payload.records, payload.list];
  const keys = Object.keys(payload || {});
  for (const key of keys) {
    const val = payload[key];
    if (Array.isArray(val)) return val;
  }
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [payload];
}

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (typeof payload === "string") {
    const { array, object } = parseStringPayload(payload);
    if (array) return array;
    if (object) return toArray(object);
  }
  if (payload && typeof payload === "object") {
    const extracted = extractArrayFromObject(payload);
    if (Array.isArray(extracted)) return extracted;
  }
  return [];
}

function unwrapArray(payload) {
  const base = toArray(payload);
  if (Array.isArray(base) && base.length === 1 && Array.isArray(base[0])) return base[0];
  return base;
}

function splitSemicolons(val) {
  if (val === undefined || val === null || val === "") return [];
  return String(val)
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
}

function pickField(obj, keys = []) {
  if (!obj) return undefined;
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
    const countryLine = bill.country && typeof bill.country === "object" ? bill.country.code || bill.country.name : bill.country;
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
  const qtys = splitSemicolons(pickField(flat, ["Produkt Ilość", "Produkt Ilosc", "productQty", "product_qty", "quantities"]));
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
