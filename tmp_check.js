/* ============================================================
   app.js  pełny JS do obsługi 3 podstron CER
   ============================================================ */

/* ------------------------------------------------------------
   GLOBALNE USTAWIENIA  uzupełnisz swoim linkiem do webhooka
------------------------------------------------------------ */
const N8N_BASE_URL = "https://kamil-inoparts.app.n8n.cloud/webhook"; // <<< PODMIENISZ
const SELLASIST_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-z-sellasist";
const SEND_TO_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/przeslij-do-CER";
const GET_LAST_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-ostatnie-z-CER";
const GET_ONE_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-jedno-z-CER";
const SHOW_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/wy%C5%9Bwietl";
const GENERATE_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/generuj-odpowiedz";

/* ------------------------------------------------------------
   BLOKADA HASŁEM  proste sprawdzenie na wejściu
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
  return `${num.toFixed(2)} zł`;
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
    // spróbuj ściąć do pierwszego { lub [
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
  const matches = String(rawText ? "").match(/{[^]*?}/g);
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