// CzÄ™Ĺ›Ä‡ 1: dodawanie zgĹ‚oszenia (pobieranie z Sellasist, zapis do CER)

let s1FetchedOrder = null;
let s1OrderBox;
let s1Products;

function initS1() {
  const fetchBtn = document.getElementById("s1-fetch");
  const orderInput = document.getElementById("s1-order");
  s1OrderBox = document.getElementById("s1-order-data");
  s1Products = document.getElementById("s1-products");
  const saveBtn = document.getElementById("s1-save");
  if (!fetchBtn || !orderInput || !s1OrderBox || !s1Products || !saveBtn) return;

  fetchBtn.addEventListener("click", async () => {
    const num = orderInput.value.trim();
    if (!num) return showToast("Wpisz numer zamĂłwienia", "error");
    try {
      const res = await fetch(`${SELLASIST_WEBHOOK}?order=${encodeURIComponent(num)}`);
      const rawData = await res.json();
      const dataItem = Array.isArray(rawData) ? rawData[0] : rawData;
      const data = dataItem && typeof dataItem === "object" && dataItem.json ? dataItem.json : dataItem;
      s1FetchedOrder = data;

      s1OrderBox.classList.remove("hidden");

      const productsArr = Array.isArray(data?.products) ? data.products : [];
      s1Products.innerHTML = productsArr.length
        ? productsArr
            .map(
              (p, idx) => `
        <div class="product-row">
          <label>
            <input type="checkbox" class="s1-prod-check" data-index="${idx}" />
            ${p.name} (${p.sku}) - ${p.price ?? ""} zĹ‚ zamĂłwiono: ${p.quantity}
          </label>
          <input type="number" class="s1-prod-qty" data-index="${idx}" min="1" max="${p.quantity || 1}" value="${p.quantity || 1}" />
        </div>
      `
            )
            .join("")
        : `<div class="muted">Brak produktĂłw w odpowiedzi</div>`;

      const bill =
        data.bill_address ||
        data.billAddress ||
        data.billAddressRaw ||
        data.billAddressFull ||
        (data.orderDetails && data.orderDetails.bill_address);
      const billParts = [];
      if (bill) {
        const directAddress =
          (typeof bill === "string" ? bill : null) ||
          bill.address ||
          bill.full ||
          bill.fullAddress ||
          bill.full_address;
        billParts.push(...normalizeAddressParts(directAddress));
        if (typeof bill === "object" && bill) {
          if (bill.street) billParts.push(String(bill.street).trim());
          if (bill.home_number) billParts.push(String(bill.home_number).trim());
          if (bill.flat_number) billParts.push(String(bill.flat_number).trim());
          if (bill.postcode) billParts.push(String(bill.postcode).trim());
          if (bill.city) billParts.push(String(bill.city).trim());
          const countryLine =
            bill.country && typeof bill.country === "object" ? bill.country.code || bill.country.name : bill.country;
          if (countryLine) billParts.push(String(countryLine).trim());
        }
      }
      const billInput = document.getElementById("s1-bill-full");
      if (billInput) billInput.value = billParts.filter(Boolean).join(", ");

      document.getElementById("s1-client-name").value = data.clientName || "";
      document.getElementById("s1-client-email").value = data.clientEmail || "";
      document.getElementById("s1-client-phone").value = data.clientPhone || "";
      document.getElementById("s1-client-nick").value = data.clientNick || "";
      document.getElementById("s1-country").value = data.country || "";
      document.getElementById("s1-date").value = data.orderDate || "";
      document.getElementById("s1-platform").value = data.platform || "";
      document.getElementById("s1-shipping").value = data.shippingCost ?? "";

      showToast("Pobrano dane zamĂłwienia");
    } catch (err) {
      showToast("BĹ‚Ä…d pobierania", "error");
    }
  });

  saveBtn.addEventListener("click", async () => {
    const typeSelect = document.getElementById("s1-type");
    const typeValue = typeSelect ? typeSelect.value : "";
    const requiredFields = [
      { el: orderInput, name: "Numer zamĂłwienia" },
      { el: document.getElementById("s1-report-date"), name: "Data zgĹ‚oszenia" },
      { el: typeSelect, name: "Typ reklamacji" },
      { el: document.getElementById("s1-reason"), name: "PowĂłd reklamacji" },
      { el: document.getElementById("s1-employee"), name: "Osoba odpowiedzialna" }
    ];
    const missing = requiredFields.filter((f) => {
      if (!f.el) return true;
      const val = String(f.el.value || "").trim();
      return !val;
    });
    if (missing.length) {
      const names = missing.map((f) => f.name).join(", ");
      showToast(`UzupeĹ‚nij pola: ${names}`, "error");
      return;
    }

    const noteInput = document.getElementById("s1-note");
    const orderDate =
      s1FetchedOrder?.orderDate ||
      s1FetchedOrder?.order_date ||
      s1FetchedOrder?.orderDetails?.orderDate ||
      s1FetchedOrder?.orderDetails?.order_date;
    const purchaseDate =
      s1FetchedOrder?.purchaseDate ||
      s1FetchedOrder?.purchase_date ||
      s1FetchedOrder?.orderDetails?.purchaseDate ||
      s1FetchedOrder?.orderDetails?.purchase_date;

    const payload = {
      order: orderInput.value,
      orderDetails: s1FetchedOrder,
      orderDate,
      purchaseDate,
      reportDate: document.getElementById("s1-report-date").value,
      type: document.getElementById("s1-type").value,
      reason: document.getElementById("s1-reason").value,
      employee: document.getElementById("s1-employee").value,
      note: noteInput ? noteInput.value : "",
      products: Array.from(document.querySelectorAll(".product-row"))
        .map((row, idx) => {
          const check = row.querySelector(".s1-prod-check");
          const qty = row.querySelector(".s1-prod-qty");
          const meta = s1FetchedOrder?.products?.[idx] || {};
          return {
            include: check?.checked,
            qty: Number(qty?.value ?? 0),
            sku: meta.sku,
            name: meta.name,
            orderedQuantity: meta.quantity,
            price: Number(meta.price ?? 0)
          };
        })
        .filter((p) => p.include && p.qty > 0)
    };

    try {
      const res = await fetch(SEND_TO_CER_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      let responseData = null;
      try {
        responseData = await res.json();
      } catch (err) {
        responseData = null;
      }
      const responseItem = Array.isArray(responseData) ? responseData[0] : responseData;
      if (responseItem && responseItem.error) {
        showToast(responseItem.error, "error");
        return;
      }
      showToast("Zapisano zgłoszenie");
      if (typeof resetAllForms === "function") resetAllForms();
    } catch (err) {
      showToast("BĹ‚Ä…d zapisu", "error");
    }
  });
}

