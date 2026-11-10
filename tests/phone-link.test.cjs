const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const phoneNumbers = ['tel:0123-25-9947', 'tel:090-6029-1870'];

function runForDevice(navigator, innerWidth = 1440) {
  const attributes = phoneNumbers.map(phone => new Map([['data-phone-href', phone]]));
  const links = phoneNumbers.map((phone, index) => ({
    dataset: { phoneHref: phone },
    setAttribute: (name, value) => attributes[index].set(name, value),
  }));
  vm.runInNewContext(fs.readFileSync(path.join(root, 'phone-link.js'), 'utf8'), {
    navigator,
    innerWidth,
    document: {
      querySelectorAll(selector) {
        assert.equal(selector, '.cover-phone [data-phone-href]');
        return links;
      },
    },
  });
  return attributes.map(link => link.get('href'));
}

test('hero numbers start without call links and retain separate mobile destinations and existing labels', () => {
  const card = html.match(/<div class="cover-phone">[\s\S]*?<span class="cover-hours">[^<]+<\/span><\/div>/)?.[0];
  assert.ok(card, 'the card must contain separate links without nested anchors');
  assert.doesNotMatch(card, /\shref=/);
  assert.deepEqual([...card.matchAll(/data-phone-href="([^"]+)"/g)].map(match => match[1]), phoneNumbers);
  assert.equal((card.match(/<a /g) || []).length, 2);
  assert.match(card, /0123-25-9947/);
  assert.match(card, /090-6029-1870/);
  assert.doesNotMatch(card, /（ヒャクタケ）|class="phone-person"/);
  assert.match(card, /除雪の予約・相談/);
  assert.match(card, /（代表：ヒャクタケまで！）/);
  assert.match(card, /受付 8:00–20:00/);
  assert.equal((html.match(/\shref="tel:090-6029-1870"/g) || []).length, 2);
});

test('contact section retains ordinary links to both correct numbers and its reception time', () => {
  const contact = html.match(/<div class="phone-choice">[\s\S]*?<div class="web-choice">/)?.[0];
  assert.ok(contact);
  assert.deepEqual([...contact.matchAll(/\shref="(tel:[^"]+)"/g)].map(match => match[1]), phoneNumbers);
  assert.doesNotMatch(contact, /data-phone-href=/);
  assert.match(contact, /（ヒャクタケ）/);
  assert.match(contact, /受付 8:00–20:00/);
});

for (const [name, navigator, width] of [
  ['Windows PC', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36', userAgentData: { mobile: false } }],
  ['narrow touch Windows PC', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36', userAgentData: { mobile: false }, maxTouchPoints: 10 }, 375],
  ['Mac Safari', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', platform: 'MacIntel', maxTouchPoints: 0 }],
]) test(name + ' does not expose either hero call link', () => assert.deepEqual(runForDevice(navigator, width), [undefined, undefined]));

for (const [name, navigator] of [
  ['iPhone Safari', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' }],
  ['Android Chrome', { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36', userAgentData: { mobile: true } }],
  ['Android without client hints', { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36' }],
  ['Android tablet', { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36', userAgentData: { mobile: false } }],
  ['iPad desktop user agent', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', platform: 'MacIntel', maxTouchPoints: 5 }],
]) test(name + ' links each hero number to its own destination', () => assert.deepEqual(runForDevice(navigator, 390), phoneNumbers));
