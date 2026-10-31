(() => {
  'use strict';
  document.querySelectorAll('[data-draft-link]').forEach(link => {
    link.href = 'index.html#inquiryHelper';
    link.hidden = false;
  });
  const form = document.querySelector('#estimateForm');
  if (!form) return;
  const helper = document.querySelector('#inquiryHelper');
  const button = form.querySelector('.draft-submit');
  const status = document.querySelector('#draftStatus');
  const result = document.querySelector('#draftResult');
  const preview = document.querySelector('#draftPreview');
  const select = document.querySelector('#draftSelect');
  const directLink = form.querySelector('.manual-form-link');
  const formURL = 'https://forms.gle/CuH34CGrpjS4D3n2A';
  const prefillURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfCPjLxCtIg3E4MHXnooZ6zOvLXc7xOtw44gg_Fb4p53EposQ/viewform';
  let busy = false;
  let selectedService = '';
  const serviceContext = document.querySelector('#consultContext');
  document.querySelectorAll('[data-consult-service]').forEach(link => {
    link.addEventListener('click', () => {
      selectedService = link.dataset.consultService;
      serviceContext.textContent = `ご相談の作業：${selectedService}`;
      serviceContext.hidden = false;
      // Keep all user-entered fields intact; add the chosen service to the draft separately.
      if (!result.hidden && !busy) preview.value = buildDraft();
      updateDirectLink();
    });
  });
  function buildDraft() {
    const value = name => form.elements.namedItem(name).value.trim() || '未入力';
    return ['【NORTH CLUB 除雪・排雪お問い合わせ】', ...(selectedService ? [`相談したい作業：${selectedService}`] : []), `会社名：${value('company')}`, `住所・エリア：${value('area')}`, `駐車台数：${value('cars')}`, `希望内容：${value('message')}`].join('\n');
  }
  function buildFormURL() {
    // The Google form's address and inquiry fields are short-answer inputs.
    const value = name => form.elements.namedItem(name).value.trim().replace(/\r\n?|\n/g, ' / ');
    const area = value('area');
    const parts = [
      selectedService && `相談したい作業：${selectedService}`,
      value('company') && `会社名：${value('company')}`,
      value('cars') && `駐車台数：${value('cars')}`,
      value('message') && `希望内容：${value('message')}`
    ].filter(Boolean);
    if (!area && !parts.length) return formURL;
    const url = new URL(prefillURL);
    url.searchParams.set('usp', 'pp_url');
    if (area) url.searchParams.set('entry.319206248', area);
    if (parts.length) url.searchParams.set('entry.566332613', parts.join(' / '));
    return url.href;
  }
  function updateDirectLink() { directLink.href = buildFormURL(); }
  form.addEventListener('input', updateDirectLink);
  form.addEventListener('change', updateDirectLink);
  directLink.addEventListener('click', updateDirectLink);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    const draft = buildDraft();
    preview.value = draft;
    result.hidden = false;
    result.open = false;
    const destination = buildFormURL();
    directLink.href = destination;
    status.textContent = '';
    try {
      window.open(destination, '_blank', 'noopener,noreferrer');
      // noopener may return null even when a tab opens; do not infer popup success from the return value.
    } catch {
      status.textContent = 'フォームを開けませんでした。下の「Googleフォームを直接開く」をご利用ください。';
    } finally {
      setTimeout(() => {
        busy = false;
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }, 350);
    }
  });
  select.addEventListener('click', () => { preview.focus(); preview.select(); });
  // Reveal only after the submit guard is in place; no-JS visitors retain the independent external link.
  button.type = 'submit';
  helper.hidden = false;
  if (location.hash === '#inquiryHelper') helper.open = true;
})();
