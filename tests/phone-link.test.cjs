const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const phoneNumber = 'tel:090-6029-1870';

function runForDevice(navigator, innerWidth = 1440) {
  const attributes = new Map([['data-phone-href', phoneNumber]]);
  const card = {
    dataset: { phoneHref: phoneNumber },
    setAttribute: (name, value) => attributes.set(name, value),
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'phone-link.js'), 'utf8'), {
    navigator,
    innerWidth,
    document: {
      querySelector(selector) {
        assert.equal(selector, '.cover-phone[data-phone-href]');
        return card;
      },
    },
  });
  return attributes.get('href');
}

test('hero card starts without a callable link; other phone links and labels remain', () => {
  const card = html.match(/<a class="cover-phone"[^>]*>[\s\S]*?<\/a>/)[0];
  assert.doesNotMatch(card, /\shref=/);
  assert.match(card, /data-phone-href="tel:090-6029-1870"/);
  assert.match(card, /除雪の予約・相談/);
  assert.match(card, /（代表：ヒャクタケまで！）/);
  assert.match(card, /受付 8:00–20:00/);
  assert.equal((html.match(/\shref="tel:090-6029-1870"/g) || []).length, 2);
});

for (const [name, navigator, width] of [
  ['Windows PC', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36', userAgentData: { mobile: false } }],
  ['narrow touch Windows PC', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36', userAgentData: { mobile: false }, maxTouchPoints: 10 }, 375],
  ['Mac Safari', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', platform: 'MacIntel', maxTouchPoints: 0 }],
]) test(name + ' does not expose a call link', () => assert.equal(runForDevice(navigator, width), undefined));

for (const [name, navigator] of [
  ['iPhone Safari', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' }],
  ['Android Chrome', { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36', userAgentData: { mobile: true } }],
  ['Android without client hints', { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36' }],
  ['Android tablet', { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36', userAgentData: { mobile: false } }],
  ['iPad desktop user agent', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', platform: 'MacIntel', maxTouchPoints: 5 }],
]) test(name + ' retains the original phone destination', () => assert.equal(runForDevice(navigator, 390), phoneNumber));
