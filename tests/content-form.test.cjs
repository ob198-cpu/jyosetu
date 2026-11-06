const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const formURL = 'https://docs.google.com/forms/d/e/1FAIpQLSclakPQUAX9IYzU1jLDFItpHDh0Rm_67c3EZo39aQZKKmmxbA/viewform';
const entry = {
  company: 'entry.229034388',
  area: 'entry.2090653235',
  cars: 'entry.1617912704',
  message: 'entry.1884809168',
};

function loadHelper(values = {}, options = {}) {
  const opened = [];
  const timers = [];
  const listeners = {};
  const attributes = new Map();
  const button = {
    type: 'button', disabled: false,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name),
  };
  const helper = { hidden: true };
  const status = { textContent: '' };
  const context = { hidden: true, textContent: '' };
  const draftLink = { hidden: true, href: './#contact' };
  const serviceLinks = ['除雪', '排雪'].map(service => ({
    dataset: { consultService: service },
    addEventListener: (name, handler) => { listeners[service + ':' + name] = handler; },
  }));
  const form = {
    elements: { namedItem: name => ({ value: values[name] || '' }) },
    querySelector: selector => {
      assert.equal(selector, '.draft-submit');
      return button;
    },
    addEventListener: (name, handler) => { listeners[name] = handler; },
  };
  const elements = {
    '#estimateForm': options.noForm ? null : form,
    '#inquiryHelper': helper,
    '#draftStatus': status,
    '#consultContext': context,
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), {
    URL,
    document: {
      querySelector: selector => {
        assert.ok(Object.hasOwn(elements, selector), 'unexpected element: ' + selector);
        return elements[selector];
      },
      querySelectorAll: selector => {
        if (selector === '[data-draft-link]') return [draftLink];
        assert.equal(selector, '[data-consult-service]');
        return serviceLinks;
      },
    },
    window: { open: (...args) => {
      opened.push(args);
      if (options.throwOnOpen) throw new Error('popup blocked');
      return null;
    } },
    setTimeout: (handler, delay) => { timers.push({ handler, delay }); },
  });
  return {
    opened, timers, button, attributes, helper, status, context, draftLink,
    submit: () => {
      let prevented = false;
      listeners.submit({ preventDefault: () => { prevented = true; } });
      assert.ok(prevented, 'the website must not submit the enquiry itself');
    },
    chooseService: service => listeners[service + ':click'](),
  };
}

test('blank website fields still open the new form without a prefill query', () => {
  const page = loadHelper();
  assert.equal(page.helper.hidden, false);
  assert.equal(page.button.type, 'submit');
  page.submit();
  assert.deepEqual(page.opened, [[formURL, '_blank', 'noopener,noreferrer']]);
  assert.equal(page.status.textContent, '');
});

test('the four values reach their own native form fields, including Japanese, symbols and newlines', () => {
  const values = {
    company: ' 株式会社 雪&空 #1? ',
    area: ' 札幌市北区1条 2-3 & A=B ',
    cars: ' 2台 + 1台 ',
    message: ' 朝6:00希望\n排雪あり & 見積り? #2\n「玄関前」もお願いします。 ',
  };
  const page = loadHelper(values);
  page.submit();
  const url = new URL(page.opened[0][0]);
  assert.equal(url.origin + url.pathname, formURL);
  assert.equal(url.searchParams.get('usp'), 'pp_url');
  assert.deepEqual([...url.searchParams.keys()].sort(), ['usp', ...Object.values(entry)].sort());
  for (const name of Object.keys(entry)) assert.equal(url.searchParams.get(entry[name]), values[name].trim());
});

for (const field of ['company', 'area', 'cars', 'message']) {
  test('a partial enquiry with only ' + field + ' opens a prefilled form', () => {
    const page = loadHelper({ [field]: '一部のみ入力' });
    page.submit();
    const url = new URL(page.opened[0][0]);
    assert.equal(url.origin + url.pathname, formURL);
    assert.deepEqual([...url.searchParams.keys()].sort(), ['usp', entry[field]].sort());
    assert.equal(url.searchParams.get(entry[field]), '一部のみ入力');
  });
}

test('a selected service prefixes the enquiry without losing its text or newlines', () => {
  const page = loadHelper({ message: '玄関前を希望\n雪置き場あり' });
  page.chooseService('除雪');
  page.chooseService('排雪');
  page.submit();
  assert.equal(new URL(page.opened[0][0]).searchParams.get(entry.message),
    '相談したい作業：排雪\n\n玄関前を希望\n雪置き場あり');
  assert.equal(page.context.textContent, 'ご相談の作業：排雪');
  assert.equal(page.context.hidden, false);
});

test('a selected service alone can be handed over with all four website fields blank', () => {
  const page = loadHelper();
  page.chooseService('除雪');
  page.submit();
  assert.equal(new URL(page.opened[0][0]).searchParams.get(entry.message), '相談したい作業：除雪');
});

test('rapid submission opens one tab, then the existing guard releases the button', () => {
  const page = loadHelper({ area: '札幌市' });
  page.submit();
  page.submit();
  assert.equal(page.opened.length, 1);
  assert.equal(page.button.disabled, true);
  assert.equal(page.attributes.get('aria-busy'), 'true');
  assert.equal(page.timers[0].delay, 350);
  page.timers[0].handler();
  assert.equal(page.button.disabled, false);
  assert.equal(page.attributes.has('aria-busy'), false);
  page.submit();
  assert.equal(page.opened.length, 2);
});

test('regional pages without the website form retain the link to its input area', () => {
  const page = loadHelper({}, { noForm: true });
  assert.equal(page.draftLink.href, 'index.html#inquiryHelper');
  assert.equal(page.draftLink.hidden, false);
  assert.equal(page.opened.length, 0);
});

test('regional direct links and the unused legacy constant point to the new form', () => {
  for (const filename of ['eniwa.html', 'kitahiroshima.html']) {
    const html = fs.readFileSync(path.join(root, filename), 'utf8');
    const links = [...html.matchAll(/href="(https:\/\/(?:forms\.gle\/|docs\.google\.com\/forms\/)[^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(links, [formURL]);
  }
  const legacy = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  assert.equal(legacy.match(/const FORM_URL = "([^"]+)";/)[1], formURL);
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(homepage, /src="content\.js\?v=20261106-new-form"/);
  assert.doesNotMatch(homepage, /src="script\.js/);
});
