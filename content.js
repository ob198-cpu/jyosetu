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
  const formURL = 'https://docs.google.com/forms/d/e/1FAIpQLSclakPQUAX9IYzU1jLDFItpHDh0Rm_67c3EZo39aQZKKmmxbA/viewform';
  const prefillURL = 'https://docs.google.com/forms/d/e/1FAIpQLSclakPQUAX9IYzU1jLDFItpHDh0Rm_67c3EZo39aQZKKmmxbA/viewform';
  let busy = false;
  let selectedService = '';
  const serviceContext = document.querySelector('#consultContext');
  document.querySelectorAll('[data-consult-service]').forEach(link => {
    link.addEventListener('click', () => {
      selectedService = link.dataset.consultService;
      serviceContext.textContent = `ご相談の作業：${selectedService}`;
      serviceContext.hidden = false;
    });
  });
  function buildFormURL() {
    const value = name => form.elements.namedItem(name).value.trim();
    const message = [
      selectedService && `相談したい作業：${selectedService}`,
      value('message')
    ].filter(Boolean).join('\n\n');
    const fields = [
      ['entry.229034388', value('company')],
      ['entry.2090653235', value('area')],
      ['entry.1617912704', value('cars')],
      ['entry.1884809168', message]
    ].filter(([, fieldValue]) => fieldValue);
    if (!fields.length) return formURL;
    const url = new URL(prefillURL);
    url.searchParams.set('usp', 'pp_url');
    fields.forEach(([name, fieldValue]) => url.searchParams.set(name, fieldValue));
    return url.href;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    const destination = buildFormURL();
    status.textContent = '';
    try {
      window.open(destination, '_blank', 'noopener,noreferrer');
      // noopener may return null even when a tab opens; do not infer popup success from the return value.
    } catch {
      status.textContent = 'フォームを開けませんでした。もう一度お試しください。';
    } finally {
      setTimeout(() => {
        busy = false;
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }, 350);
    }
  });
  // Reveal only after the submit guard is in place.
  button.type = 'submit';
  helper.hidden = false;
})();
