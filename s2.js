// Sekcja 2: ewidencja - pobieranie pojedynczych i listy zgłoszeń

let s2SingleBox;
let s2ListBox;
let s2Rows = [];
const FILTER_EMPLOYEES = ["Izabela", "Maks F.", "Adam"];
const FILTER_STATUSES = ["Zakończone", "W trakcie"];
const FILTER_TYPES = [
  "Wada produktu",
  "Uszkodzone przez klienta",
  "Błąd magazynowy",
  "Brak informacji od klienta",
  "Brak możliwości weryfikacji",
  "Utrata gwarancji",
  "-"
];

const getFilterValue = (id) => {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
};

const getFilters = () => {
  const base = {
    orderDateFrom: getFilterValue("s2-order-from"),
    orderDateTo: getFilterValue("s2-order-to"),
    receivedAtFrom: getFilterValue("s2-received-from"),
    receivedAtTo: getFilterValue("s2-received-to"),
    decisionDueFrom: getFilterValue("s2-decision-from"),
    decisionDueTo: getFilterValue("s2-decision-to"),
    resolvedAtFrom: getFilterValue("s2-resolved-from"),
    resolvedAtTo: getFilterValue("s2-resolved-to"),
    employee: getFilterValue("s2-filter-employee"),
    type: getFilterValue("s2-filter-type"),
    status: getFilterValue("s2-filter-status")
  };
  const cleaned = {};
  Object.keys(base).forEach((key) => {
    if (base[key]) cleaned[key] = base[key];
  });
  return cleaned;
};

const matchesOption = (value, expected) => {
  if (!expected) return true;
  const val = String(value || "").trim().toLowerCase();
  const exp = String(expected || "").trim().toLowerCase();
  if (!exp) return true;
  return val === exp || val.startsWith(exp) || exp.startsWith(val);
};

const isTemplateRow = (row) => {
  const claim = isSheetRow(row) ? toClaimFromSheetRow(row) : normalizeClaim(row);
  const id = String(claim.claimId || "").trim().toLowerCase();
  return id === "wzór" || id === "wzor";
};

const isDateInRange = (value, from, to) => {
  const date = parseDateFlexible(value);
  const fromDate = parseDateFlexible(from);
  const toDate = parseDateFlexible(to);
  if (fromDate && (!date || date < fromDate)) return false;
  if (toDate && (!date || date > toDate)) return false;
  return true;
};

const applyLocalFilters = (rows, filters) =>
  rows.filter((row) => {
    const claim = isSheetRow(row) ? toClaimFromSheetRow(row) : normalizeClaim(row);
    return (
      isDateInRange(claim.orderDate || claim.purchaseDate, filters.orderDateFrom, filters.orderDateTo) &&
      isDateInRange(claim.receivedAt, filters.receivedAtFrom, filters.receivedAtTo) &&
      isDateInRange(claim.decisionDue, filters.decisionDueFrom, filters.decisionDueTo) &&
      isDateInRange(claim.resolvedAt, filters.resolvedAtFrom, filters.resolvedAtTo) &&
      matchesOption(claim.agent, filters.employee) &&
      matchesOption(claim.type, filters.type) &&
      matchesOption(claim.status, filters.status)
    );
  });

const isSheetRow = (row) =>
  row &&
  typeof row === "object" &&
  (
    "Nr. Rek." in row ||
    "Data przyjęcia" in row ||
    "W trakcie/Zakończone" in row ||
    "Zamówienie" in row
  );

const getRowValue = (row, keys) => {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return "";
};

const buildProductsFromRow = (row) => {
  const names = splitSemicolons(getRowValue(row, ["Produkt Nazwa", "Produkt Nazwa "]));
  const skus = splitSemicolons(getRowValue(row, ["Produkt SKU", "Produkt SKU "]));
  const qtys = splitSemicolons(getRowValue(row, ["Produkt Ilość", "Produkt Ilosc"]));
  const vals = splitSemicolons(getRowValue(row, ["Wartość", "Wartosc"]));
  const currs = splitSemicolons(getRowValue(row, ["Waluta", "Currency"]));
  const maxLen = Math.max(names.length, skus.length, qtys.length, vals.length, currs.length);
  if (!maxLen) return [];
  return Array.from({ length: maxLen }).map((_, i) => ({
    name: names[i] || "",
    sku: skus[i] || "",
    quantity: qtys[i] || "",
    price: vals[i] || "",
    currency: currs[i] || ""
  }));
};

const toClaimFromSheetRow = (row) => ({
  claimId: getRowValue(row, ["Nr. Rek.", "Nr. Rek", "Nr Rek", "Nr"]),
  orderId: getRowValue(row, ["Zamówienie", "Zamowienie"]),
  customer: getRowValue(row, ["Klient imię i nazwisko", "Klient imie i nazwisko", "Klient login"]),
  customerLogin: getRowValue(row, ["Klient login"]),
  marketplace: getRowValue(row, ["Marketplace"]),
  status: getRowValue(row, ["W trakcie/Zakończone", "Status"]),
  receivedAt: getRowValue(row, ["Data przyjęcia", "Data przyjecia"]),
  decisionDue: getRowValue(row, ["Czas decyzji do", "Termin decyzji do"]),
  resolvedAt: getRowValue(row, ["Data rozwiązania", "Data rozwiazania"]),
  type: getRowValue(row, ["Typ"]),
  decision: getRowValue(row, ["Decyzja"]),
  resolution: getRowValue(row, ["Rozwiązanie", "Rozwiazanie"]),
  reason: getRowValue(row, ["Powód zgłoszenia", "Powod zgloszenia"]),
  agent: getRowValue(row, ["Pracownik"]),
  note: getRowValue(row, ["Notatka/Uwagi", "Notatka"]),
  orderDate: getRowValue(row, ["Data zamówienia", "Data zamowienia"]),
  purchaseDate: getRowValue(row, ["Data zamówienia", "Data zamowienia"]),
  value: getRowValue(row, ["Wartość", "Wartosc"]),
  currency: getRowValue(row, ["Waluta"]),
  address: getRowValue(row, ["Adres"]),
  products: buildProductsFromRow(row),
  rowNumber: getRowValue(row, ["row_number", "rowNumber"])
});

const renderList = (rows) => {
  if (!s2ListBox) return;
  if (!rows.length) {
    s2ListBox.innerHTML = `<div class="table-box"><pre style="white-space:pre-wrap; padding:12px;">Brak danych dla wybranych filtrów.</pre></div>`;
    return;
  }

  let html = `<table>
        <tr>
          <th>#</th>
          <th>Reklamacja</th>
          <th>Zamówienie</th>
          <th>Klient</th>
          <th>Marketplace</th>
          <th>Status</th>
          <th>Data zgłoszenia</th>
          <th>Termin decyzji</th>
          <th>Data rozwiązania</th>
          <th>Pracownik</th>
          <th>Akcja</th>
        </tr>`;

  rows.forEach((row, idx) => {
    const claim = isSheetRow(row) ? toClaimFromSheetRow(row) : normalizeClaim(row);
    const claimIdEsc = escapeAttribute(claim.claimId || "");
    const expId = `exp-${claim.claimId || claim.rowNumber || idx}`;
    html += `
        <tr>
          <td>${escapeHtml(claim.rowNumber ? claim.rowNumber : idx + 1)}</td>
          <td class="link" onclick="document.getElementById('s2-search').value='${claimIdEsc}'">${escapeHtml(
            claim.claimId || "-"
          )}</td>
          <td>${escapeHtml(claim.orderId || "-")}</td>
          <td>${escapeHtml(claim.customer || "-")}</td>
          <td>${escapeHtml(claim.marketplace || "-")}</td>
          <td>${escapeHtml(claim.status || "-")}</td>
          <td>${escapeHtml(formatDateDot(claim.receivedAt))}</td>
          <td>${escapeHtml(formatDateDot(claim.decisionDue))}</td>
          <td>${escapeHtml(formatDateDot(claim.resolvedAt))}</td>
          <td>${escapeHtml(claim.agent || "-")}</td>
          <td>
            <div class="action-cell">
              <button class="btn btn-link" onclick="handleExpand('${expId}', this)">Szczegóły</button>
              <button class="btn btn-primary" onclick="switchPage(4); document.getElementById('s3-number').value='${claimIdEsc}'">Generuj odpowiedź</button>
            </div>
          </td>
        </tr>
        <tr class="expand-row" data-exp-id="${expId}" style="display:none;">
          <td colspan="11">${renderClaimTable(claim)}</td>
        </tr>`;
  });
  html += "</table>";
  s2ListBox.innerHTML = html;
};

const fillSelectOptions = (selectEl, values) => {
  if (!selectEl) return;
  const keep = selectEl.querySelectorAll("option");
  const placeholder = keep.length ? keep[0].outerHTML : '<option value="">Wszystkie</option>';
  const sorted = Array.from(values).sort((a, b) => a.localeCompare(b, "pl"));
  selectEl.innerHTML = placeholder + sorted.map((val) => `<option value="${val}">${val}</option>`).join("");
};

const updateFilterOptions = (rows) => {
  const employees = new Set(FILTER_EMPLOYEES);
  const types = new Set(FILTER_TYPES);
  const statuses = new Set(FILTER_STATUSES);

  rows.forEach((row) => {
    const claim = isSheetRow(row) ? toClaimFromSheetRow(row) : normalizeClaim(row);
    if (claim.agent) employees.add(String(claim.agent));
    if (claim.type) types.add(String(claim.type));
    if (claim.status) statuses.add(String(claim.status));
  });

  fillSelectOptions(document.getElementById("s2-filter-employee"), employees);
  fillSelectOptions(document.getElementById("s2-filter-type"), types);
  fillSelectOptions(document.getElementById("s2-filter-status"), statuses);
};

const resetFilters = () => {
  [
    "s2-order-from",
    "s2-order-to",
    "s2-received-from",
    "s2-received-to",
    "s2-decision-from",
    "s2-decision-to",
    "s2-resolved-from",
    "s2-resolved-to",
    "s2-filter-employee",
    "s2-filter-type",
    "s2-filter-status"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = "";
  });

  if (s2Rows.length) {
    renderList(s2Rows);
  }
};

const initDatePlaceholders = () => {
  document.querySelectorAll(".date-input input[type=\"date\"]").forEach((input) => {
    const update = () => {
      if (input.value) {
        input.classList.add("has-value");
      } else {
        input.classList.remove("has-value");
      }
    };
    update();
    input.addEventListener("change", update);
    input.addEventListener("input", update);
    input.addEventListener("blur", update);
  });
};

const requestFilteredList = async () => {
  if (!FILTER_CER_WEBHOOK) {
    showToast("Błąd filtrowania", "error");
    return;
  }
  const filters = getFilters();
  try {
    const res = await fetch(FILTER_CER_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters })
    });
    const rawText = await res.text();
    const parsedResult = safeJsonParse(rawText);
    let parsed = parsedResult.value;
    let rows = Array.isArray(parsed) ? parsed : [];
    if (!rows.length && parsed && typeof parsed === "object") {
      const unwrapped = unwrapArray(parsed);
      rows = Array.isArray(unwrapped) ? unwrapped : [];
      if (!rows.length && typeof parsed.data === "string") {
        const parsedData = safeJsonParse(parsed.data);
        const unwrappedData = unwrapArray(parsedData.value);
        if (Array.isArray(unwrappedData)) rows = unwrappedData;
      }
      if (!rows.length && typeof parsed.items === "string") {
        const parsedItems = safeJsonParse(parsed.items);
        const unwrappedItems = unwrapArray(parsedItems.value);
        if (Array.isArray(unwrappedItems)) rows = unwrappedItems;
      }
      if (!rows.length) {
        const keys = Object.keys(parsed);
        if (keys.length && keys.every((key) => /^\d+$/.test(key))) {
          rows = keys
            .sort((a, b) => Number(a) - Number(b))
            .map((key) => parsed[key]);
        }
      }
    }
    if (!rows.length && typeof parsed === "string") {
      const parsedString = safeJsonParse(parsed);
      const unwrappedString = unwrapArray(parsedString.value);
      if (Array.isArray(unwrappedString)) rows = unwrappedString;
    }
    if (!rows.length) rows = parseObjectsFromText(rawText);

    s2ListBox.classList.remove("hidden");
    if (!res.ok) {
      s2ListBox.innerHTML = `<div class="table-box"><pre style="white-space:pre-wrap; padding:12px;">Błąd HTTP ${res.status}
${escapeHtml(rawText)}</pre></div>`;
      showToast(`Błąd pobierania (${res.status})`, "error");
      return;
    }
    if (!rows.length) {
      s2ListBox.innerHTML = `<div class="table-box"><pre style="white-space:pre-wrap; padding:12px;">Brak rozpoznanych danych. Surowa odpowiedź webhooka:
${escapeHtml(rawText)}</pre></div>`;
      showToast("Brak danych z webhooka", "error");
      return;
    }

    const cleanedRows = rows.filter((row) => !isTemplateRow(row));
    s2Rows = cleanedRows;
    updateFilterOptions(cleanedRows);
    const filteredRows = applyLocalFilters(cleanedRows, filters);
    renderList(filteredRows);
    showToast("Zastosowano filtry");
  } catch (err) {
    console.error("FILTER_CER_WEBHOOK error", err);
    showToast("Błąd filtrowania", "error");
  }
};

function initS2() {
  const searchBtn = document.getElementById("s2-search-btn");
  const searchInput = document.getElementById("s2-search");
  s2SingleBox = document.getElementById("s2-single-result");
  s2ListBox = document.getElementById("s2-list");
  const filterBtn = document.getElementById("s2-filter-apply");
  const filterReset = document.getElementById("s2-filter-reset");

  if (!searchBtn || !searchInput || !s2SingleBox || !s2ListBox) return;

  // Prefill selects with domyślne wartości, nawet przed pierwszym pobraniem z webhooka.
  updateFilterOptions(s2Rows);

  searchBtn.addEventListener("click", async () => {
    const num = searchInput.value.trim();
    if (!num) return showToast("Podaj numer", "error");
    try {
      const res = await fetch(`${GET_ONE_FROM_CER_WEBHOOK}?order=${encodeURIComponent(num)}`);
      const data = await res.json();
      const claim = normalizeClaim(Array.isArray(data) ? data[0] : data);
      s2SingleBox.classList.remove("hidden");
      s2SingleBox.innerHTML = renderClaimCard(
        claim,
        `<button class="btn btn-primary" onclick="switchPage(4); document.getElementById('s3-number').value='${escapeAttribute(
          claim.claimId || ""
        )}'">Generuj odpowiedź</button>`
      );
      showToast("Pobrano zgłoszenie");
    } catch (err) {
      showToast("Nie znaleziono", "error");
    }
  });
  if (filterBtn) {
    filterBtn.addEventListener("click", requestFilteredList);
  }

  if (filterReset) {
    filterReset.addEventListener("click", resetFilters);
  }

  initDatePlaceholders();
}
