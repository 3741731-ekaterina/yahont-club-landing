// Run with Playwright installed: node tests/october.cjs (dev server on :8765).
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.CLUB_TEST_URL || 'http://127.0.0.1:8765';
(async function () {
  const browser = await chromium.launch({ headless: true });
  let count = 0;
  async function scenario(name, fn) {
    const context = await browser.newContext({viewport:{width:1440,height:1000}});
    const page = await context.newPage();
    // Layout/promotion tests don't submit or depend on third-party forms.
    await page.route('**/yahontovaschool.getcourse.ru/**', route => route.fulfill({body:''}));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try { await fn(page, context); assert.deepEqual(errors, []); count++; console.log('PASS', name); }
    finally { await context.close(); }
  }
  async function open(page) { await page.goto(base, {waitUntil:'load'}); }
  async function clock(page) { await page.clock.install(); await page.clock.pauseAt(Date.now()+100); await open(page); }
  async function exit(page) { await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout',{clientY:-1,relatedTarget:null}))); }
  const promo = page => page.locator('.promo-modal');
  try {
    await scenario('nine courses, exclusive expansion, six buttons, mobile overflow', async page => {
      await open(page);
      assert.equal(await page.locator('.course-btn').count(),9);
      assert.equal(await page.locator('.course-detail.open').count(),0);
      assert.equal(await page.locator('.course-btn').first().getAttribute('aria-expanded'),'false');
      for(let i=1;i<=9;i++) {
        const card=page.locator(`[data-course=c${i}]`);
        await card.click();
        await page.locator('.course-program-modal').waitFor({state:'visible'});
        assert.equal(await page.locator('.course-detail.open').count(),1);
        assert.equal(await page.locator(`#detail-c${i}`).isVisible(),true);
        assert.equal(await card.getAttribute('aria-expanded'),'true');
        if(i%3===1) await page.locator('.course-program-close').click();
        else if(i%3===2) await page.keyboard.press('Escape');
        else await page.locator('.course-program-modal').click({position:{x:5,y:5}});
        assert.equal(await page.locator('.course-program-modal').isVisible(),false);
        assert.equal(await page.locator('.course-detail.open').count(),0);
        assert.equal(await card.getAttribute('aria-expanded'),'false');
      }
      assert.equal(await page.locator('#detail-c9 .module-item').count(),4);
      assert.equal(await page.locator('.purchase-options button').count(),6);
      assert.equal(await page.locator('.case-card').count(),6);
      assert.deepEqual(await page.locator('.main-nav a').allTextContents(),['Что входит','Индивидуальная стратегия','9 курсов','80+ инструментов','Тарифы','Кейсы и отзывы']);
      assert.equal(await page.evaluate(()=>document.querySelector('#tools').compareDocumentPosition(document.querySelector('#how-it-works')) & Node.DOCUMENT_POSITION_FOLLOWING),4);
      for(const width of [1440,1024,768,680,390,320]) {
        await page.setViewportSize({width,height:900});
        await page.waitForTimeout(60);
        const overflow=await page.evaluate(()=>({width:innerWidth,body:document.documentElement.scrollWidth}));
        // Chromium rounds fractional scroll areas up by one CSS pixel.
        assert.ok(overflow.body<=overflow.width+1,JSON.stringify(overflow));
        if(width<=680) assert.equal(await page.locator('.bento-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
      }
    });
    await scenario('strategy gallery: one row, full images, arrows, keyboard, manual scrolling', async page => {
      await open(page);
      for(const width of [1440,390,320]) {
        await page.setViewportSize({width,height:900});
        await page.locator('#strategyReviews').evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('#strategyReviews').closest('.subblock')).opacity==='1');
        await page.locator('#strategyReviews').evaluate(e=>e.scrollTo({left:0,behavior:'instant'}));
        await page.waitForFunction(()=>document.querySelector('#strategyReviewsCount').textContent==='1 / 4');
        assert.equal(await page.locator('#strategyReviewsPrev').isDisabled(),true);
        const positions=await page.locator('#strategyReviews a').evaluateAll(items=>items.map(e=>e.getBoundingClientRect().top));
        assert.ok(positions.every(y=>Math.abs(y-positions[0])<1));
        assert.equal(await page.locator('#strategyReviews img').first().evaluate(e=>getComputedStyle(e).objectFit),'contain');
        await page.locator('#strategyReviewsNext').click();
        await page.waitForFunction(()=>document.querySelector('#strategyReviewsCount').textContent==='2 / 4');
        await page.locator('#strategyReviews').focus();await page.keyboard.press('ArrowRight');
        await page.waitForFunction(()=>document.querySelector('#strategyReviewsCount').textContent==='3 / 4');
        await page.locator('#strategyReviews').evaluate(e=>e.scrollTo({left:e.scrollWidth,behavior:'instant'}));
        await page.waitForFunction(()=>document.querySelector('#strategyReviewsCount').textContent==='4 / 4');
        assert.equal(await page.locator('#strategyReviewsNext').isDisabled(),true);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      }
    });
    await scenario('timers remain enabled, mouse exit ignored, hidden time excluded, close chains once', async page => {
      await clock(page);await exit(page);
      assert.equal(await promo(page).isVisible(),false);
      await page.clock.fastForward(599000);
      assert.equal(await promo(page).isVisible(),false);
      await page.evaluate(()=>{window.testHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.testHidden});document.dispatchEvent(new Event('visibilitychange'));});
      await page.clock.fastForward(21*60000);
      assert.equal(await promo(page).isVisible(),false);
      await page.evaluate(()=>{window.testHidden=false;document.dispatchEvent(new Event('visibilitychange'));});
      await page.clock.fastForward(2000);
      assert.equal(await page.locator('#promoTitle').textContent(),'Посмотрите клуб изнутри');
      await page.locator('.promo-close').click();
      assert.equal(await page.locator('#promoTitle').textContent(),'Заберите один урок из клуба бесплатно');
      await page.locator('.promo-close').click();
      await page.clock.fastForward(21*60000);
      assert.equal(await promo(page).isVisible(),false);
      await page.reload();await exit(page);
      assert.equal(await promo(page).isVisible(),false);
    });
    await scenario('20-minute lesson remains available after dismissing tour with Escape', async page => {
      await clock(page);await page.clock.fastForward(601000);
      assert.equal(await page.locator('#promoTitle').textContent(),'Посмотрите клуб изнутри');
      await page.keyboard.press('Escape');
      assert.equal(await promo(page).isVisible(),false);
      await exit(page);assert.equal(await promo(page).isVisible(),false);
      await page.clock.fastForward(600000);
      assert.equal(await page.locator('#promoTitle').textContent(),'Заберите один урок из клуба бесплатно');
    });
    await scenario('buy suppresses prompts, persists on reload, all six modals open', async page => {
      await clock(page);
      for(const id of ['start','growth','breakthrough','start-oct29','growth-oct29','breakthrough-oct29']) {
        await page.locator(`[onclick="openPayment('${id}')"]`).click();
        assert.equal(await page.locator('.payment-modal.open').count(),1);
        await page.locator(`#pm-${id}`).waitFor({state:'visible'});
        await page.locator(`#pm-${id} .payment-modal-close`).click();
      }
      await exit(page);await page.clock.fastForward(21*60000);
      assert.equal(await promo(page).isVisible(),false);
      await page.reload();await exit(page);
      assert.equal(await promo(page).isVisible(),false);
    });
    await scenario('Tilda bridge forwards UTM and cannot activate exit promotions', async page => {
      await page.route('**/qa-child*',route=>route.fulfill({contentType:'text/html',body:require('node:fs').readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8')}));
      await page.route('**/qa-embed*',route=>route.fulfill({contentType:'text/html',body:`<iframe id="yahontFrame" data-club-src="${new URL(base).origin}/qa-child" style="width:100%;height:900px"></iframe><script src="/utm.js"></script>`}));
      await page.goto(new URL(base).origin+'/qa-embed?utm_source=qa&utm_campaign=iframe',{waitUntil:'load'});
      const frame=await (await page.$('#yahontFrame')).contentFrame();
      await frame.waitForSelector('.promo-modal',{state:'attached'});
      assert.equal(new URL(frame.url()).searchParams.get('utm_source'),'qa');
      await frame.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{data:{type:'yahont:exit'},origin:'https://untrusted.example',source:window.parent})));
      assert.equal(await frame.locator('.promo-modal').isVisible(),false);
      await exit(page);
      await frame.evaluate(()=>window.parent.postMessage({type:'yahont:ready'},location.origin));
      await page.evaluate(()=>document.querySelector('#yahontFrame').contentWindow.postMessage({type:'yahont:exit'},location.origin));
      assert.equal(await frame.locator('.promo-modal').isVisible(),false);
    });
    console.log(`ALL ${count} SCENARIOS PASSED`);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1)});
