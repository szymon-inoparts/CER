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
   NAWIGACJA MIĘDZY PODSTRONAMI
------------------------------------------------------------- */
function switchPage(pageIndex) {
  const pages = document.querySelectorAll(".page");
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







function normalizeClaim(raw = {}) {



  const flat = raw.json && typeof raw.json === "object" ? { ...raw, ...raw.json } : raw;



  const dates = flat.dates || {};







  const customerValue = pickField(flat, [



    "customer",



    "clientNick",



    "customerNick",



    "client",



    "clientName",



    "customerName"



  ]);







  const productsArr =



    flat.products ||



    (flat.orderDetails && flat.orderDetails.products) ||



    (flat.body && flat.body.products);







  const currencyValue =



    pickField(flat, ["currency", "orderCurrency"]) ||



    (flat.orderDetails && flat.orderDetails.currency);







  const rawAddress =



    pickField(flat, ["address", "billAddressFull"]) ||



    (flat.orderDetails && flat.orderDetails.billAddressFull);



  const bill =



    flat.bill_address ||



    flat.billAddress ||



    flat.billAddressRaw ||



    (flat.orderDetails && flat.orderDetails.bill_address);







  let addressValue = rawAddress;



  if (!addressValue && bill) {



    const streetLine = [bill.street, bill.home_number, bill.flat_number ? `/${bill.flat_number}` : ""]



      .filter(Boolean)



      .join(" ")



      .trim();



    const cityLine = [bill.city, bill.postcode].filter(Boolean).join(" ").trim();



    const countryLine =



      bill.country && typeof bill.country === "object"



        ? bill.country.code || bill.country.name



        : bill.country;



    addressValue = [streetLine, cityLine, countryLine].filter(Boolean).join(", ");



  }







  let products =



    typeof productsArr === "string"



      ? splitSemicolons(productsArr).map((name) => ({ name }))



      : Array.isArray(productsArr)



      ? productsArr



      : [];







  if (!products.length) {



    const names = splitSemicolons(pickField(flat, ["Produkt Nazwa", "productName", "product_name"]));



    const skus = splitSemicolons(pickField(flat, ["Produkt SKU", "productSku", "product_sku"]));



    const eans = splitSemicolons(pickField(flat, ["Produkt EAN", "productEan", "product_ean"]));



    const qtys = splitSemicolons(
      pickField(flat, ["Produkt Ilość", "Produkt Ilosc", "productQty", "product_qty"])
    );

    const vals = splitSemicolons(pickField(flat, ["Wartość", "Wartosc", "valueRaw", "value"]));



    const currsSource = pickField(flat, ["Waluta", "currency", "orderCurrency"]) || currencyValue;



    const currs = splitSemicolons(currsSource);



    const maxLen = Math.max(names.length, skus.length, eans.length, qtys.length, vals.length, currs.length);



    if (maxLen > 0) {



      products = Array.from({ length: maxLen }).map((_, i) => ({



        name: names[i],



        sku: skus[i],



        ean: eans[i],



        quantity: qtys[i],



        price: vals[i],



        currency: currs[i]



      }));



    }



  }







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



    receivedAt: flat.receivedAt || dates.receivedAt,



    decisionDue: flat.decisionDue || dates.decisionDue,



    resolvedAt: flat.resolvedAt || dates.resolvedAt,



    rowNumber: flat.rowNumber,



    address: addressValue,



    products



  };



}







function renderClaimCard(raw, actionHtml = "") {
  const claim = normalizeClaim(raw);

  const productsBlock =
    claim.products && Array.isArray(claim.products) && claim.products.length
      ? `<ul class="products-list">${claim.products
          .map((p) => {
            return `<li>
              ${p.name ? `<strong>Nazwa:</strong> ${escapeHtml(p.name)}<br>` : ""}
              ${p.sku ? `<strong>SKU:</strong> ${escapeHtml(p.sku)}<br>` : ""}
              ${p.ean ? `<strong>EAN:</strong> ${escapeHtml(p.ean)}<br>` : ""}
              ${
                p.price !== undefined && p.price !== null && p.price !== ""
                  ? `<strong>Wartość:</strong> ${formatCurrency(p.price)} ${p.currency || claim.currency || ""}<br>`
                  : ""
              }
              ${p.quantity ? `<strong>Ilość:</strong> ${p.quantity}<br>` : ""}
            </li>`;
          })
          .join("")}</ul>`
      : `<div class="value">-</div>`;

  return `
    <div class="claim-card claim-card--split">
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

        <div class="claim-card__timeline">
          <div><span>Data przyjęcia</span><strong>${formatDate(claim.receivedAt)}</strong></div>
          <div><span>Termin decyzji</span><strong>${formatDate(claim.decisionDue)}</strong></div>
          <div><span>Data rozwiązania</span><strong>${formatDate(claim.resolvedAt)}</strong></div>
        </div>

        <div class="claim-card__grid">
          <div><div class="label">Dane klienta</div><div class="value">${claim.customer || "-"}</div></div>
          <div><div class="label">Login</div><div class="value">${claim.customerLogin || "-"}</div></div>
          <div><div class="label">Adres</div><div class="value">${claim.address || "-"}</div></div>
          <div><div class="label">Marketplace</div><div class="value">${claim.marketplace || "-"}</div></div>
        </div>

        <div class="claim-card__grid">
          <div><div class="label">Powód zgłoszenia</div><div class="value">${claim.reason || "-"}</div></div>
          <div><div class="label">Typ</div><div class="value">${claim.type || "-"}</div></div>
          <div><div class="label">Decyzja</div><div class="value">${claim.decision || "-"}</div></div>
          <div><div class="label">Rozwiązanie</div><div class="value">${claim.resolution || "-"}</div></div>
          ${claim.agent ? `<div><div class="label">Agent</div><div class="value">${claim.agent}</div></div>` : ""}
          ${claim.myNewField ? `<div><div class="label">myNewField</div><div class="value">${claim.myNewField}</div></div>` : ""}
        </div>

        <div class="claim-card__actions">${actionHtml || ""}</div>
      </div>

      <div class="claim-card__panel claim-card__panel--products">
        <div class="products-block">
          <div class="label" style="margin-bottom:6px;">Reklamowane produkty</div>
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



  switchPage(3);



  const input = document.getElementById("s3-number");



  if (input) input.value = id || "";



  const fetchBtn = document.getElementById("s3-fetch");



  if (fetchBtn) fetchBtn.click();



}



window.handleGenerateClick = handleGenerateClick;











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















    products: Array.from(document.querySelectorAll(".product-row"))
      .map((row, idx) => {
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
      .filter((p) => p.include && p.qty > 0)







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



          <th>Rozwiązanie</th>



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



          <td>



            <div class="action-cell">



              <button class="expand-btn expand-btn--wide" onclick="handleExpand('${expId}', this)">Rozwiń ▼</button>



              <button class="btn btn-dark" onclick="handleGenerateClick('${claim.claimId || claim.orderId || ""}')">Generuj</button>



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















    // Ukryj pola Decyzja, Rozwi?zanie i Data rozwi?zania tylko w generatorze







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























