const header = document.querySelector(".site-header");
const estimateForm = document.querySelector("#estimateForm");

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
  document.body.classList.toggle("show-sticky", window.scrollY > 420);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

estimateForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  window.open("https://forms.gle/CuH34CGrpjS4D3n2A", "_blank", "noopener");
});
