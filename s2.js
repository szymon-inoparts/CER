// Część 2: ewidencja – pobieranie pojedynczych i listy zgłoszeń

let s2SingleBox;
let s2ListBox;

function initS2() {
  const searchBtn = document.getElementById("s2-search-btn");
  const searchInput = document.getElementById("s2-search");
  s2SingleBox = document.getElementById("s2-single-result");
  const rangeBtn = document.getElementById("s2-range-btn");
  const rangeSelect = document.getElementById("s2-range");
  s2ListBox = document.getElementById("s2-list");
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
      console.info("GET_LAST_FROM_CER response", { status: res.status, ok: res.ok, rawText });
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

      let html = `<table>
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
              <button class="btn btn-link" onclick="handleExpand('${expId}', this)">Szczegóły</button>
              <button class="btn btn-primary" onclick="switchPage(4); document.getElementById('s3-number').value='${claim.claimId}'">Generuj</button>
            </div>
          </td>
        </tr>
        <tr class="expand-row" data-exp-id="${expId}" style="display:none;">
          <td colspan="10">${renderClaimTable(claim)}</td>
        </tr>`;
      });
      html += "</table>";
      s2ListBox.innerHTML = html;
      showToast("Pobrano listę");
    } catch (err) {
      console.error("GET_LAST_FROM_CER error", err);
      showToast("Błąd pobierania", "error");
    }
  });
}

