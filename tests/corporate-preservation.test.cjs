const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const values = (text, pattern) => [...text.matchAll(pattern)].map(match => match[1]);
const originalIds = ['top', 'opening-title', 'services', 'services-title', 'plow-title', 'haul-title', 'detail', 'detail-title', 'contracts', 'contracts-title', 'season', 'spot', 'price', 'price-title', 'area', 'area-title', 'flow', 'flow-title', 'faq', 'contact', 'contact-title', 'consultContext', 'inquiryHelper', 'estimateForm', 'companyInput', 'areaInput', 'carsInput', 'messageInput', 'draftStatus', 'company', 'company-title'];
const originalPhones = ['tel:0123-25-9947', 'tel:090-6029-1870', 'tel:0123-25-9947', 'tel:090-6029-1870', 'tel:090-6029-1870'];

test('the public URL, CNAME, fragment targets and telephone destinations remain compatible', () => {
  assert.equal(fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim(), 'www.northclub-josetsu.jp');
  assert.equal(html.match(/rel="canonical" href="([^"]+)"/)[1], 'https://www.northclub-josetsu.jp/');
  for (const id of originalIds) assert.ok(values(html, /\sid="([^"]+)"/g).includes(id), 'lost fragment or input id: ' + id);
  assert.deepEqual(values(html, /\s(?:href|data-phone-href)="(tel:[^"]+)"/g), originalPhones);
});

test('the existing four website inputs and their attributes are unchanged except for placeholders and company label', () => {
  const form = html.match(/<form id="estimateForm"[\s\S]*?<\/form>/)[0];
  const controls = text => values(text, /(<(?:input|textarea)\b[^>]*>)/g).map(tag => tag.replace(/ placeholder="[^"]*"/, ''));
  assert.deepEqual(controls(form), [
    '<input id="companyInput" name="company" type="text" autocomplete="organization">',
    '<input id="areaInput" name="area" type="text" autocomplete="street-address">',
    '<input id="carsInput" name="cars" type="text">',
    '<textarea id="messageInput" name="message" rows="4">',
  ]);
  assert.deepEqual(values(form, /\sname="([^"]+)"/g), ['company', 'area', 'cars', 'message']);
  assert.equal(html.match(/id="draftStatus"[^>]+/)[0], 'id="draftStatus" class="draft-status" role="status" aria-live="polite"');
});

test('native form mapping and phone device handling remain unchanged across LF and CRLF checkouts', () => {
  const expected = {
    'content.js': '8dd0cdb9831ce2bd5bf0e091b467c4b1affbe285ec4556bcfafcc723bd55a7f8',
    'phone-link.js': '9556611975e9cdf4eeba7b3a453a045de1cfddb93bf6808de806adbdfbcb1bb7',
  };
  for (const [name, hash] of Object.entries(expected)) {
    const normalized = fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(createHash('sha256').update(normalized).digest('hex'), hash, name + ' changed');
  }
  assert.deepEqual(values(html, /<script src="([^"]+)"/g), ['motion.js', 'content.js?v=20261106-new-form', 'phone-link.js?v=20261110-phone-lines']);
});

test('the corporate hero retains Sapporo-wide coverage and corporate parking focus', () => {
  const hero = html.match(/<section class="opening opening--clear"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(hero, /ご自宅|8,800|恵庭|1回/);
  assert.match(hero, /札幌市全域対応/);
  assert.match(hero, /href="#contact"/);
  assert.equal((html.match(/class="business-point"/g) || []).length, 3);
});
