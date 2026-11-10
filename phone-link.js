(() => {
  'use strict';
  const phones = document.querySelectorAll('.cover-phone [data-phone-href]');
  if (!phones.length) return;
  // A narrow window or touchscreen alone does not make a desktop a phone.
  const mobileDevice = navigator.userAgentData?.mobile === true ||
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (mobileDevice) {
    phones.forEach(phone => phone.setAttribute('href', phone.dataset.phoneHref));
  }
})();
