import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { brandTitleHtml } from '../src/brand-title.mjs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
test('shared header switches EN logo / RU title in every shell screen, before and after asset preparation', () => {
  const statement = main.split('\n').find(line => line.includes('querySelector(".header-title").innerHTML'));
  for (const screen of ['ONBOARDING', 'MISSION_SELECT', 'MISSION_PLAY', 'END']) {
    for (const preparedAssets of [null, {}]) {
      const title = { innerHTML: '', dataset: {} };
      const ctx = { state: {screen}, brandTitleHtml, preparedAssets, language: 'en',
        t: key => key === 'app.aria.logo' ? 'Bureau 1440' : 'КОСМОС НА СВЯЗИ',
        uiShell: {querySelector: () => title}, assetUrl: source => 'prepared:' + source };
      vm.createContext(ctx);
      vm.runInContext(main.slice(main.indexOf('function brandLogoSource()'), main.indexOf('function formatTime(')), ctx);
      for (const language of ['en', 'ru', 'en']) {
        ctx.language = language;
        vm.runInContext(statement, ctx);
        if (language === 'en') {
          assert.match(title.innerHTML, /logo-eng\.svg/);
          assert.equal((title.innerHTML.match(/<img /g) || []).length, 1);
          assert.equal(title.innerHTML.includes('prepared:'), Boolean(preparedAssets));
        } else assert.equal(title.innerHTML, 'КОСМОС НА СВЯЗИ');
        assert.equal(title.dataset.debugTrigger, undefined);
      }
    }
  }
});

test('brand title escapes text and attributes and keeps logo proportional', () => {
  assert.equal(brandTitleHtml('ru', 'A&B', ''), 'A&amp;B');
  assert.match(brandTitleHtml('en', '', 'A"B'), /alt="A&quot;B"/);
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.brand-title-logo\s*\{[^}]*width: min\(300px, 100%\);[^}]*object-fit: contain;/);
  assert.match(main, /bootScreen\.localize\(t, language\)/);
  const cta = main.slice(main.indexOf('function renderCta()'), main.indexOf('function renderOnboarding()'));
  assert.match(cta, /class="cta-title-logo"/);
});
