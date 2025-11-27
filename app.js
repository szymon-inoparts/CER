/* ============================================================
   app.js – pełny JS do obsługi 3 podstron CER
   ============================================================ */

/* ------------------------------------------------------------
   GLOBALNE USTAWIENIA – uzupełnisz swoim linkiem do webhooka
------------------------------------------------------------ */
const N8N_BASE_URL = "https://kamil-inoparts.app.n8n.cloud/webhook"; // <<< PODMIENISZ

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
    document.body.classList.remove("auth-locked");
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

/* Pobieranie danych zamówienia */
s1FetchBtn.addEventListener("click", async () => {
  const num = s1OrderInput.value.trim();
  if (!num) return showToast("Wpisz numer zamówienia", "error");

  try {
    const res = await fetch(`${N8N_BASE_URL}/pobierz-z-sellasist=${num}`);
    const data = await res.json();

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
            ${p.name} (${p.sku}) – zamówiono: ${p.quantity}
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

    showToast("Pobrano dane zamówienia");
  } catch (err) {
    showToast("Błąd pobierania", "error");
  }
});

/* Zapisywanie zgłoszenia */
s1SaveBtn.addEventListener("click", async () => {
  const payload = {
    order: s1OrderInput.value,
    reportDate: document.getElementById("s1-report-date").value,
    type: document.getElementById("s1-type").value,
    reason: document.getElementById("s1-reason").value,
    employee: document.getElementById("s1-employee").value,
    note: document.getElementById("s1-note").value,

    products: Array.from(document.querySelectorAll(".product-row")).map(
      (row) => {
        const check = row.querySelector(".s1-prod-check");
        const qty = row.querySelector(".s1-prod-qty");
        return {
          include: check.checked,
          qty: Number(qty.value)
        };
      }
    )
  };

  try {
    await fetch(`${N8N_BASE_URL}/przeslij-do-CER`, {
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
    const res = await fetch(`${N8N_BASE_URL}/pobierz-jedno-z-CER=${num}`);
    const data = await res.json();

    s2SingleBox.classList.remove("hidden");
    s2SingleBox.innerHTML = `
      <div>
        <h3>Zgłoszenie: ${data.caseNumber}</h3>
        <p><b>Klient:</b> ${data.clientName}</p>
        <p><b>Platforma:</b> ${data.platform}</p>
        <p><b>Data:</b> ${data.date}</p>
        <button class="btn btn-primary" onclick="switchPage(3); document.getElementById('s3-number').value='${data.caseNumber}'">Generuj odpowiedź</button>
      </div>`;

    showToast("Pobrano zgłoszenie");
  } catch {
    showToast("Nie znaleziono", "error");
  }
});

/* Pobieranie listy zgłoszeń (tabela) */
s2RangeBtn.addEventListener("click", async () => {
  const range = s2RangeSelect.value;

  try {
    const res = await fetch(`${N8N_BASE_URL}/pobierz-ostatnie-z-CER=${range}`);
    const list = await res.json();

    s2ListBox.classList.remove("hidden");

    let html = `
      <table>
        <tr>
          <th>Reklamacja</th>
          <th>Zamówienie</th>
          <th>Klient</th>
          <th>Platforma</th>
          <th>Status</th>
          <th>Data</th>
          <th>Akcja</th>
        </tr>`;

    list.forEach((row) => {
      html += `
        <tr>
          <td class="link" onclick="document.getElementById('s2-search').value='${row.caseNumber}'">${row.caseNumber}</td>
          <td>${row.order}</td>
          <td>${row.client}</td>
          <td>${row.platform}</td>
          <td>${row.status}</td>
          <td>${row.date}</td>
          <td><button class="btn" onclick="switchPage(3); document.getElementById('s3-number').value='${row.caseNumber}'">Generuj</button></td>
        </tr>`;
    });

    html += `</table>`;

    s2ListBox.innerHTML = html;
    showToast("Pobrano listę zgłoszeń");
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
    const res = await fetch(`${N8N_BASE_URL}/wyświetl=${num}`);
    const data = await res.json();

    s3DetailsBox.classList.remove("hidden");

    s3DetailsBox.innerHTML = `
      <h3>Dane zgłoszenia</h3>
      <p><b>Nr reklamacji:</b> ${data.caseNumber}</p>
      <p><b>Zamówienie:</b> ${data.order}</p>
      <p><b>Klient:</b> ${data.clientName}</p>
      <p><b>Platforma:</b> ${data.platform}</p>
      <p><b>Data zgłoszenia:</b> ${data.date}</p>
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
