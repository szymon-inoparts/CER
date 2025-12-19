// Inicjalizacja aplikacji po załadowaniu DOM

document.addEventListener("DOMContentLoaded", () => {
  attachClaimEditHandlers();
  initLangButtons();
  initS1();
  initS2();
  initS3();
  initProcessorsForm();
});

// Obsługa dodawania procesorów reklamacji na stronie głównej
function initProcessorsForm() {
  const nameInput = document.getElementById("home-proc-name");
  const emailInput = document.getElementById("home-proc-email");
  const addBtn = document.getElementById("home-proc-add");
  if (!nameInput || !emailInput || !addBtn) return;

  const setLoading = (isLoading) => {
    addBtn.disabled = isLoading;
    addBtn.textContent = isLoading ? "Zapisywanie..." : "Dodaj";
  };

  addBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name || !email) {
      showToast("Podaj imię i email", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(PROCESSORS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      showToast("Dodano procesora");
      nameInput.value = "";
      emailInput.value = "";
    } catch (err) {
      console.error("PROCESSORS_WEBHOOK error", err);
      showToast("Błąd zapisu procesora", "error");
    } finally {
      setLoading(false);
    }
  });
}
