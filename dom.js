// Obsluga UI: nawigacja, reset formularzy, toast

function switchPage(pageIndex) {
  const pages = document.querySelectorAll(".page");
  pages.forEach((page, idx) => {
    page.classList.toggle("page-active", idx === pageIndex - 1);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}
window.switchPage = switchPage;

function resetAllForms() {
  document.querySelectorAll("input, textarea, select").forEach((el) => {
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
