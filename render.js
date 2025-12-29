// Renderowanie kart/sekcji oraz helpery akcji

function renderProductItem(p, currencyFallback) {
  return `<li>
              ${p.name ? `<strong>Nazwa:</strong> ${escapeHtml(p.name)}<br>` : ""}
              ${p.sku ? `<strong>SKU:</strong> ${escapeHtml(p.sku)}<br>` : ""}
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
  const purchaseDate = claim.purchaseDate || claim.orderDate;
  return `<div class="claim-card__timeline-wrap">
          <div class="claim-card__timeline">
            <div><span>Data zakupu</span><strong>${formatDate(purchaseDate)}</strong></div>
            <div><span>Data przyjęcia</span><strong>${formatDate(claim.receivedAt)}</strong></div>
            <div><span>Data rozwiązania</span><strong>${formatDate(claim.resolvedAt)}</strong></div>
          </div>
          <div class="claim-card__deadline">
            <span>Termin decyzji</span>
            <strong>${formatDate(claim.decisionDue)}</strong>
          </div>
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
          ${
            claim.agent
              ? `<div><div class="label">Agent</div><div class="value" data-field="agent">${claim.agent}</div></div>`
              : `<div><div class="label">Agent</div><div class="value" data-field="agent">-</div></div>`
          }
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
          <div class="claim-card__status value" data-field="status">${claim.status || "-"}</div>
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
  if (btn) btn.textContent = isOpen ? "Rozwiń" : "Zwiń";
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

function renderClaimTable(claim) {
  return renderClaimCard(claim);
}




