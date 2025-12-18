// Edycja i zapisywanie zmian w kartach reklamacji

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
        { value: "Wada produktu", text: "Wada produktu" },
        { value: "Uszkodzone przez klienta", text: "Uszkodzone przez klienta" },
        { value: "Błąd magazynowy", text: "Błąd magazynowy" },
        { value: "Brak informacji od klienta", text: "Brak informacji od klienta" },
        { value: "Brak możliwości weryfikacji", text: "Brak możliwości weryfikacji" },
        { value: "Utrata gwarancji", text: "Utrata gwarancji" }
      ];
  return options
    .map((opt) => {
      const isSelected = String(opt.value) === String(selectedValue);
      return `<option value="${escapeAttribute(opt.value)}"${isSelected ? " selected" : ""}>${escapeHtml(opt.text)}</option>`;
    })
    .join("");
}

function getStatusOptionsForEdit(selectedValue) {
  const defaults = ["W trakcie", "Zakończone", "Wymaga odpowiedzi", "Nowa"];
  const list = Array.from(new Set([selectedValue, ...defaults].filter(Boolean)));
  return list
    .map((status) => {
      const isSelected = String(status) === String(selectedValue);
      return `<option value="${escapeAttribute(status)}"${isSelected ? " selected" : ""}>${escapeHtml(status)}</option>`;
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
  if (field === "status") {
    return `<select ${baseAttr}>${getStatusOptionsForEdit(value)}</select>`;
  }
  return `<input type="text" ${baseAttr} value="${escapeAttribute(value || "")}" />`;
}

function enterClaimEdit(cardEl, triggerBtn) {
  if (!cardEl || cardEl.classList.contains("claim-card--editing")) return;
  const claim = getClaimFromCard(cardEl);
  if (!claim) return showToast("Brak danych do edycji", "error");
  const editableFields = ["address", "reason", "type", "status", "decision", "resolution", "note", "agent"];
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
  if (!cardEl) return null;
  const data = getClaimFromCard(cardEl);
  if (!data) return null;
  const updated = { ...data };
  cardEl.querySelectorAll("[data-edit-field]").forEach((el) => {
    const field = el.dataset.editField;
    if (field === "type") {
      updated[field] = deriveTypeLabel(el.value);
    } else {
      updated[field] = el.value;
    }
  });
  return updated;
}

function refreshCardAfterSave(cardEl, claim) {
  if (!cardEl || !claim) return;
  const updateFields = {
    reason: claim.reason,
    type: claim.type,
    status: claim.status,
    decision: claim.decision,
    resolution: claim.resolution,
    note: claim.note,
    agent: claim.agent,
    address: claim.address
  };
  Object.entries(updateFields).forEach(([key, value]) => {
    const slot = cardEl.querySelector(`.value[data-field="${key}"]`);
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
