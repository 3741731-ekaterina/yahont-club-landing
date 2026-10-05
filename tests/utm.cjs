const {readFileSync} = require('node:fs');
const {runInNewContext} = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync(require('node:path').join(__dirname, '../utm.js'), 'utf8');
function visit(url, {stored = null, embedded = false, blocked = false} = {}) {
  const frame = {hasAttribute: () => true, getAttribute: () => 'https://klub-fawn.vercel.app/'};
  const window = {location: {href:url}, sessionStorage: {
    getItem() {if(blocked) throw Error(); return stored;},
    setItem(k,v) {if(blocked) throw Error(); stored=v;}
  }, history: {state:null, replaceState(state,title,url) {window.location.href=url;}}};
  runInNewContext(source, {URL, window, document:{getElementById:()=>embedded ? frame : null}});
  return {url:embedded ? frame.src : window.location.href, stored};
}
const tags = 'utm_source=telegram&utm_medium=post&utm_campaign=%D0%BA%D0%BB%D1%83%D0%B1&utm_content=a%26b&utm_term=5%20000';
const outer = visit('https://yahontovafinance.ru/club?'+tags+'&email=private@example.com', {embedded:true});
assert.equal(new URL(outer.url).searchParams.get('utm_campaign'), 'клуб');
assert.equal(new URL(outer.url).searchParams.get('email'), null);
const inner = visit(outer.url);
for(const [k,v] of new URLSearchParams(tags)) assert.equal(new URL(inner.url).searchParams.get(k),v);
assert.equal(new URL(visit('https://klub-fawn.vercel.app/#pricing',{stored:inner.stored}).url).searchParams.get('utm_source'),'telegram');
assert.equal(new URL(visit('https://klub-fawn.vercel.app/?utm_source=new',{stored:inner.stored}).url).searchParams.get('utm_campaign'),null);
assert.equal(new URL(visit('https://yahontovafinance.ru/club?'+tags,{embedded:true,blocked:true}).url).searchParams.get('utm_content'),'a&b');
assert.equal(visit('https://klub-fawn.vercel.app/',{stored:'bad json'}).url,'https://klub-fawn.vercel.app/');
assert.equal(visit('https://klub-fawn.vercel.app/#pricing').url,'https://klub-fawn.vercel.app/#pricing');
console.log('PASS: iframe forwarding, Unicode, storage, new campaigns, blocked storage, malformed storage, untagged visit');
