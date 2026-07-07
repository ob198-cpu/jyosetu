const header = document.querySelector(".site-header");
const estimateForm = document.querySelector("#estimateForm");
const toast = document.querySelector("#toast");
const FORM_URL = "https://forms.gle/CuH34CGrpjS4D3n2A";

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};

const showToast = (message) => {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("is-visible");

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
};

const buildInquiryText = (formData) => {
  const company = formData.get("company")?.trim() || "未入力";
  const area = formData.get("area")?.trim() || "未入力";
  const cars = formData.get("cars")?.trim() || "未入力";
  const message = formData.get("message")?.trim() || "未入力";

  return [
    "【NORTH CLUB 除雪お問い合わせ】",
    `会社名：${company}`,
    `住所・エリア：${area}`,
    `駐車台数：${cars}`,
    `希望内容：${message}`,
  ].join("\n");
};

const copyInquiryText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();

  const copied = document.execCommand("copy");
  helper.remove();
  return copied;
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

estimateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(estimateForm);
  const inquiryText = buildInquiryText(formData);

  try {
    const copied = await copyInquiryText(inquiryText);
    window.open(FORM_URL, "_blank", "noopener");

    if (copied) {
      showToast("入力内容をコピーしました。フォームに貼り付けて送信してください。");
    } else {
      showToast("フォームを開きました。内容を入力して送信してください。");
    }
  } catch {
    window.open(FORM_URL, "_blank", "noopener");
    showToast("フォームを開きました。内容を入力して送信してください。");
  }
});

const revealItems = document.querySelectorAll(".reveal");

if (revealItems.length > 0 && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
