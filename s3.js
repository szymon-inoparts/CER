// Część 3: generator odpowiedzi i obsługa języków

let selectedLang = "PL";
let s3CurrentClaim = null;

function mapLangForBackend(lang) {
  const code = (lang || "PL").toUpperCase();
  const map = { CZ: "cs", SK: "sk", PL: "pl", DE: "de", HU: "hu", EN: "en" };
  return map[code] || code.toLowerCase();
}

function initLangButtons() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedLang = btn.dataset.lang || "PL";
      document.querySelectorAll(".lang-btn").forEach((b) => {
        b.style.background = "";
        b.style.color = "";
      });
      btn.style.background = "var(--orange)";
      btn.style.color = "#fff";
    });
  });
}

function renderS3Details(claim) {
  const box = document.getElementById("s3-details");
  if (!box) return;
  box.classList.remove("hidden");
  box.innerHTML = renderClaimCard(claim);
}

function initS3() {
  const fetchBtn = document.getElementById("s3-fetch");
  const numInput = document.getElementById("s3-number");
  const genBtn = document.getElementById("s3-generate");
  const answerBox = document.getElementById("s3-answer");
  const noRespCheckbox = document.getElementById("s3-noresp");
  if (!fetchBtn || !numInput || !genBtn) return;

  if (noRespCheckbox && answerBox) {
    const toggleAnswer = () => {
      const isAuto = noRespCheckbox.checked;
      const wrapper = answerBox.closest(".field");
      if (wrapper) wrapper.style.display = isAuto ? "none" : "";
      if (isAuto) answerBox.value = "";
    };
    noRespCheckbox.addEventListener("change", toggleAnswer);
    toggleAnswer();
  }

  fetchBtn.addEventListener("click", async () => {
    const num = numInput.value.trim();
    if (!num) return showToast("Podaj numer", "error");
    try {
      const res = await fetch(`${SHOW_FROM_CER_WEBHOOK}?number=${encodeURIComponent(num)}`);
      const data = await res.json();
      const claim = normalizeClaim(Array.isArray(data) ? data[0] : data);
      s3CurrentClaim = claim;
      renderS3Details(claim);
      showToast("Załadowano dane");
    } catch {
      showToast("Nie znaleziono", "error");
    }
  });

  genBtn.addEventListener("click", async () => {
    if (!window.docx) return showToast("Brak biblioteki DOCX", "error");
    const num = numInput.value.trim();
    const decision = document.getElementById("s3-decision").value;
    const noResp = document.getElementById("s3-noresp").checked;
    if (!num) return showToast("Podaj numer", "error");
    const answer = noResp ? DEFAULT_NO_RESPONSE_TEXT : document.getElementById("s3-answer").value;

    const payload = {
      number: num,
      decision,
      language: mapLangForBackend(selectedLang),
      answer,
      noResponse: noResp,
      products: Array.isArray(s3CurrentClaim?.products)
        ? s3CurrentClaim.products.map((p) => ({
            name: p.name,
            sku: p.sku,
            ean: p.ean,
            quantity: p.quantity,
            price: p.price,
            currency: p.currency
          }))
        : [],
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
            note: s3CurrentClaim.note,
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const rawText = await res.text();
      if (!rawText || !rawText.trim()) throw new Error("Pusta odpowiedź z generatora");
      let responseJson;
      try {
        responseJson = JSON.parse(rawText);
      } catch (err) {
        console.error("Błąd parsowania JSON z generatora", { rawText });
        throw err;
      }

      const responseItem = Array.isArray(responseJson) ? responseJson[0] : responseJson;
      const translations = Array.isArray(responseItem?.translations) ? responseItem.translations : [];
      const translatedAnswer = translations[0]?.text || answer;
      const translatedDecision = translations[1]?.text || decision;
      const translatedReason = translations[2]?.text || s3CurrentClaim?.reason;
      const translatedProductNames = translations.slice(3).map((t) => t?.text).filter(Boolean);
      const responseProducts = Array.isArray(responseItem?.products) ? responseItem.products : null;
      const translatedProducts =
        responseProducts && responseProducts.length
          ? responseProducts
          : Array.isArray(payload.products) && payload.products.length
          ? payload.products.map((p, idx) => ({
              ...p,
              name: translatedProductNames[idx] || p.name
            }))
          : s3CurrentClaim?.products || [];

      const docClaim = {
        ...s3CurrentClaim,
        reason: translatedReason,
        products: translatedProducts
      };
      const lang = (selectedLang || "PL").toUpperCase();
      const t = DOCX_TRANSLATIONS[lang] || DOCX_TRANSLATIONS.PL;
      const decisionValue = translatedDecision || t.decisionValues?.[decision] || decision;

      const blob = await buildDocx(docClaim, lang, translatedAnswer, decisionValue);
      const filename = `CER-${num}.docx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Wygenerowano odpowiedź");
    } catch (err) {
      console.error(err);
      showToast("Błąd generowania", "error");
    }
  });
}
