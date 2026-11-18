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

test('business marketing does not reinstate an unsupported parking-size ceiling or a narrow hero sector', () => {
  const hero = html.match(/<section class="opening opening--clear"[\s\S]*?<\/section>/)[0];
  const heading = hero.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '');
  assert.doesNotMatch(html, /5\s*[〜～~－-]\s*20\s*台|(?:20|30)台(?:まで|以下|限定)/);
  assert.doesNotMatch(heading, /アパート|医療介護/);
  assert.match(heading, /店舗・企業・施設/);
  assert.match(heading, /駐車場・敷地/);
  assert.match(hero, /不動産オーナー/);
  for (const sector of ['店舗', '事務所', '工場', '倉庫', '施設', '賃貸物件']) {
    assert.ok(hero.includes(sector), 'lost business sector: ' + sector);
  }
  assert.match(html, /placeholder="[^"]*30台[^"]*面積/);
});

test('metadata shares the broader business scope without introducing an unconditional capacity promise', () => {
  const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
  const ogDescription = html.match(/<meta property="og:description" content="([^"]+)"/)[1];
  const title = html.match(/<title>([^<]+)<\/title>/)[1];
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)[1];
  const structured = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(description, ogDescription);
  assert.equal(title, ogTitle);
  assert.equal(structured['@graph'].find(item => item['@type'] === 'WebPage').name, title);
  assert.match(description, /事業用駐車場・敷地/);
  assert.match(description, /シーズン契約・単発作業/);
  assert.match(description, /現地条件を確認/);
  assert.doesNotMatch(description, /必ず|即日保証|台まで/);
});

test('business one-off consultation is explicit while residential limits and the final-form step remain clear', () => {
  const oneOff = html.match(/<div class="contract-scope" id="spot">([\s\S]*?)<\/section>/)[1];
  assert.match(oneOff, /事業用敷地の単発除雪・排雪/);
  assert.match(oneOff, /現地条件と稼働状況に応じて対応可否/);
  assert.match(html, /個人宅の単発除排雪は受付を制限/);
  assert.match(html, /class="draft-submit"[^>]*>連絡先の入力へ進む/);
});
