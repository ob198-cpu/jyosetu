const header = document.querySelector(".site-header");
const estimateForm = document.querySelector("#estimateForm");

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

estimateForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  window.open("https://forms.gle/CuH34CGrpjS4D3n2A", "_blank", "noopener");
});
