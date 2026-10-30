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
  const formURL = 'https://forms.gle/CuH34CGrpjS4D3n2A';
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
    });
  });
  function buildDraft() {
    const value = name => form.elements.namedItem(name).value.trim() || '未入力';
    return ['【NORTH CLUB 除雪・排雪お問い合わせ】', ...(selectedService ? [`相談したい作業：${selectedService}`] : []), `会社名：${value('company')}`, `住所・エリア：${value('area')}`, `駐車台数：${value('cars')}`, `希望内容：${value('message')}`].join('\n');
  }
  async function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return;
    }
    const active = document.activeElement;
    const temporary = document.createElement('textarea');
    temporary.value = text;
    temporary.readOnly = true;
    temporary.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.append(temporary);
    try {
      temporary.select();
      if (!document.execCommand('copy')) throw new Error('copy-unavailable');
    } finally {
      temporary.remove();
      active?.focus({ preventScroll: true });
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    const draft = buildDraft();
    preview.value = draft;
    result.hidden = false;
    status.textContent = '相談文をコピーしています。このページからは送信されません。';
    try {
      await copyText(draft);
      result.open = false;
      try {
        window.open(formURL, '_blank', 'noopener,noreferrer');
        // noopener may return null even when a tab opens; do not infer popup success from the return value.
        status.textContent = '相談文をコピーしました。Googleフォームへ貼り付け、連絡先を入力して送信してください。開かない場合は下の「Googleフォームを直接開く」をご利用ください。入力内容はこの画面に残しています。';
      } catch {
        status.textContent = '相談文をコピーしました。下の「Googleフォームを直接開く」から移動し、貼り付けてください。入力内容はこの画面に残しています。';
      }
    } catch {
      result.open = true;
      status.textContent = '自動コピーができませんでした。入力内容は残っています。下の相談文を手動でコピーするか、もう一度お試しください。外部フォームは開いておらず、送信もされていません。';
    } finally {
      busy = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
  select.addEventListener('click', () => { preview.focus(); preview.select(); });
  // Reveal only after the submit guard is in place; no-JS visitors retain the independent external link.
  button.type = 'submit';
  helper.hidden = false;
  if (location.hash === '#inquiryHelper') helper.open = true;
})();
