// Część 2: ewidencja – pobieranie pojedynczych i listy zgłoszeń

let s2SingleBox;
let s2ListBox;
let s2Rows = [];

const getFilterValue = (id) => {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
};

const getFilters = () => ({
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
          <th>Data zamknięcia</th>
          <th>Pracownik</th>
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
          <td>${formatDateDot(claim.receivedAt)}</td>
          <td>${formatDateDot(claim.decisionDue)}</td>
          <td>${formatDateDot(claim.resolvedAt)}</td>
          <td>${claim.agent || "-"}</td>
          <td>
            <div class="action-cell">
              <button class="btn btn-link" onclick="handleExpand('${expId}', this)">Szczegóły</button>
              <button class="btn btn-primary" onclick="switchPage(4); document.getElementById('s3-number').value='${claim.claimId}'">Generuj</button>
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
  const employees = new Set();
  const types = new Set();
  const statuses = new Set();

  rows.forEach((row) => {
    const claim = normalizeClaim(row);
    if (claim.agent) employees.add(claim.agent);
    if (claim.type) types.add(claim.type);
    if (claim.status) statuses.add(claim.status);
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

const requestFilteredList = async () => {
  if (!FILTER_CER_WEBHOOK) {
    showToast("Brak webhooka filtrowania", "error");
    return;
  }
  try {
    const res = await fetch(FILTER_CER_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters: getFilters() })
    });
    const rawText = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
    let rows = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
    if (!rows.length) rows = parseObjectsFromText(rawText);
    if (!rows.length) rows = unwrapArray(parsed);

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

    s2Rows = rows;
    updateFilterOptions(rows);
    renderList(rows);
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
  const rangeBtn = document.getElementById("s2-range-btn");
  const rangeSelect = document.getElementById("s2-range");
  s2ListBox = document.getElementById("s2-list");
  const filterBtn = document.getElementById("s2-filter-apply");
  const filterReset = document.getElementById("s2-filter-reset");

  if (!searchBtn || !searchInput || !s2SingleBox || !rangeBtn || !rangeSelect || !s2ListBox) return;

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
        `<button class="btn btn-primary" onclick="switchPage(4); document.getElementById('s3-number').value='${claim.claimId}'">Generuj odpowiedź</button>`
      );
      showToast("Pobrano zgłoszenie");
    } catch (err) {
      showToast("Nie znaleziono", "error");
    }
  });

  rangeBtn.addEventListener("click", async () => {
    const range = rangeSelect.value;
    try {
      const params = new URLSearchParams({ preset: range, range });
      const res = await fetch(`${GET_LAST_FROM_CER_WEBHOOK}?${params.toString()}`);
      const rawText = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = rawText;
      }
      let rows = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
      if (!rows.length) rows = parseObjectsFromText(rawText);
      if (!rows.length) rows = unwrapArray(parsed);

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

      s2Rows = rows;
      updateFilterOptions(rows);
      renderList(rows);
      showToast("Pobrano listę");
    } catch (err) {
      console.error("GET_LAST_FROM_CER error", err);
      showToast("Błąd pobierania", "error");
    }
  });

  if (filterBtn) {
    filterBtn.addEventListener("click", requestFilteredList);
  }

  if (filterReset) {
    filterReset.addEventListener("click", resetFilters);
  }
}