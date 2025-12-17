// Obsługa UI: hasło, nawigacja, reset formularzy, toast

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
  if (typeof s2SingleBox !== "undefined") {
    s2SingleBox.classList.add("hidden");
    s2SingleBox.innerHTML = "";
  }
  if (typeof s2ListBox !== "undefined") {
    s2ListBox.classList.add("hidden");
    s2ListBox.innerHTML = "";
  }
  if (typeof s3DetailsBox !== "undefined") {
    s3DetailsBox.classList.add("hidden");
    s3DetailsBox.innerHTML = "";
  }
  showToast("Wyczyszczono formularze");
}
window.resetAllForms = resetAllForms;

function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  const dot = document.getElementById("toast-dot");
  const text = document.getElementById("toast-text");
  if (!toast || !dot || !text) return;
  text.textContent = msg;
  if (type === "error") toast.classList.add("error");
  else toast.classList.remove("error");
  toast.style.display = "flex";
  setTimeout(() => (toast.style.display = "none"), 3500);
}

