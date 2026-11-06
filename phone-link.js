(() => {
  'use strict';
  const phone = document.querySelector('.cover-phone[data-phone-href]');
  if (!phone) return;
  // A narrow window or touchscreen alone does not make a desktop a phone.
  const mobileDevice = navigator.userAgentData?.mobile === true ||
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (mobileDevice) phone.setAttribute('href', phone.dataset.phoneHref);
})();
