// Admin panel (full control). Shudhu Firestore e `admins/{uid}` thaka Google account ee chalate pare.
// Prothom admin Console theke banate hoy; tarpor 🛡 অ্যাডমিন ট্যাব theke aro admin jora jay.
const cfg = window.FB_CONFIG, X = window.APP_CFG || {};
const $ = id => document.getElementById(id), app = $('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = m => { const t = $('toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => t.style.display = 'none', 2800); };
const DAY = 864e5, RS = { fake: 'ভুয়া/প্রতারণা', rented: 'ভাড়া হয়ে গেছে', wrong: 'ভুল তথ্য', dup: 'ডুপ্লিকেট', bad: 'আপত্তিকর', other: 'অন্য' };
const fdt = t => { const d = t && t.toDate ? t.toDate() : (typeof t === 'number' ? new Date(t) : null); return d ? d.toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; };

if (!(cfg && cfg.apiKey)) {
  app.innerHTML = '<div class="card">firebase-config.js এ Firebase key বসানো নেই।</div>';
} else try {
  const V = 'https://www.gstatic.com/firebasejs/11.0.2/';
  const [{ initializeApp }, AU, FS, AC] = await Promise.all([import(V + 'firebase-app.js'), import(V + 'firebase-auth.js'), import(V + 'firebase-firestore.js'),
    X.recaptchaSiteKey ? import(V + 'firebase-app-check.js') : Promise.resolve(null)]);
  const { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } = AU;
  const { getFirestore, collection, doc, getDoc, getDocs, setDoc, query, orderBy, limit, where, onSnapshot, writeBatch, serverTimestamp, deleteField } = FS;
  const fb = initializeApp(cfg);
  if (AC) { if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; AC.initializeAppCheck(fb, { provider: new AC.ReCaptchaV3Provider(X.recaptchaSiteKey), isTokenAutoRefreshEnabled: true }); }
  const auth = getAuth(fb), db = getFirestore(fb);

  let L = [], R = [], U = [], B = [], A = [], LOG = [], S = {}, tab = 'dash', q = '', F = { st: 'all', cat: 'all' }, sel = new Set(), edit = null, unsubs = [];
  const ct = new Map();
  const who = () => (auth.currentUser && (auth.currentUser.email || auth.currentUser.uid)) || '?';
  const byId = () => new Map(L.map(x => [x.id, x]));
  const isOld = x => x.ts && Date.now() - x.ts > 60 * DAY;
  const bans = () => new Set(B.map(b => b.id));

  // ---------- helpers ----------
  const logTo = (b, text) => b.set(doc(collection(db, 'adminlog')), { by: who(), act: text, ts: serverTimestamp() });
  async function run(fn, ok) { try { await fn(); if (ok) toast('✅ ' + ok); } catch (e) { console.error(e); toast('❌ হয়নি: ' + (e.code || e.message)); } }
  const upd = (ids, f, note) => run(async () => { const b = writeBatch(db); ids.forEach(id => b.update(doc(db, 'listings', String(id)), f)); logTo(b, `${note}: ${ids.length > 3 ? ids.length + 'টি' : ids.map(i => '#' + i).join(' ')}`); await b.commit(); }, note);
  async function delListings(ids) {
    const all = [...ids]; let n = 0;
    for (let i = 0; i < all.length; i += 40) {
      const chunk = all.slice(i, i + 40), b = writeBatch(db);
      chunk.forEach(id => { b.delete(doc(db, 'listings', String(id))); b.delete(doc(db, 'contacts', String(id))); b.delete(doc(db, 'photos', String(id))); R.filter(r => r.lid === id).forEach(r => b.delete(doc(db, 'reports', r.rid))); });
      logTo(b, 'মুছে ফেলা: ' + chunk.map(x => '#' + x).join(' ')); await b.commit(); n += chunk.length;
    }
    return n;
  }
  const del = ids => { if (!ids.length || !confirm(`${ids.length}টি বিজ্ঞাপন (নম্বর, ছবি ও রিপোর্টসহ) চিরতরে মুছে ফেলবেন?`)) return; sel.clear(); run(() => delListings(ids), 'মুছে ফেলা হয়েছে'); };

  // ---------- auth gate ----------
  const login = () => { app.innerHTML = '<div class="card"><h3>অ্যাডমিন লগইন</h3><p class="mu">যে Google অ্যাকাউন্টের UID <code>admins</code> collection এ আছে সেটি দিয়ে লগইন করুন।</p><button id="gBtn" class="btn gr">🔐 Google দিয়ে লগইন</button></div>';
    $('gBtn').onclick = () => signInWithPopup(auth, new GoogleAuthProvider()).catch(e => toast(e.code === 'auth/popup-closed-by-user' ? 'বাতিল' : 'লগইন হয়নি: ' + e.code)); };
  $('outBtn').onclick = () => signOut(auth);

  onAuthStateChanged(auth, async u => {
    unsubs.forEach(f => f()); unsubs = [];
    $('outBtn').hidden = !u || u.isAnonymous; $('who').textContent = u && !u.isAnonymous ? (u.email || '') : '';
    if (!u || u.isAnonymous) return login();
    let ok = false; try { ok = (await getDoc(doc(db, 'admins', u.uid))).exists(); } catch (_) {}
    if (!ok) { app.innerHTML = `<div class="card"><h3>⛔ এই অ্যাকাউন্ট অ্যাডমিন নয়</h3><p class="mu">অ্যাডমিন বানাতে: Firebase Console → Firestore → <b>Start collection</b> → Collection ID <code>admins</code> → Document ID এ নিচের UID পেস্ট করুন (একটা field দিন, যেমন <code>ok</code> = <code>true</code>)।</p><p>আপনার UID: <code>${esc(u.uid)}</code></p></div>`; return; }
    const sub = (q, fn, nm) => unsubs.push(onSnapshot(q, s => { fn(s); paint(); }, e => toast(nm + ': ' + e.code)));
    sub(query(collection(db, 'listings'), orderBy('ts', 'desc'), limit(400)), s => { L = s.docs.map(d => d.data()); }, 'listings');
    sub(query(collection(db, 'reports'), orderBy('ts', 'desc'), limit(500)), s => { R = s.docs.map(d => ({ ...d.data(), rid: d.id })); }, 'reports');
    sub(query(collection(db, 'users'), limit(300)), s => { U = s.docs.map(d => ({ id: d.id, ...d.data() })); }, 'users');
    sub(query(collection(db, 'bans'), limit(300)), s => { B = s.docs.map(d => ({ id: d.id, ...d.data() })); }, 'bans');
    sub(query(collection(db, 'admins'), limit(50)), s => { A = s.docs.map(d => ({ id: d.id, ...d.data() })); }, 'admins');
    sub(query(collection(db, 'adminlog'), orderBy('ts', 'desc'), limit(40)), s => { LOG = s.docs.map(d => d.data()); }, 'adminlog');
    unsubs.push(onSnapshot(doc(db, 'settings', 'site'), s => { S = s.exists() ? s.data() : {}; if (tab === 'set' && !document.activeElement.closest('#setForm')) paint(); }, () => {}));
    paint();
  });

  // ---------- listing card ----------
  const repsOf = id => R.filter(r => r.lid === id);
  function lcard(x) {
    const reps = repsOf(x.id), bn = bans().has(x.owner);
    return `<div class="card" data-id="${x.id}">
    <div class="row"><input type="checkbox" data-sel ${sel.has(x.id) ? 'checked' : ''} style="width:1.1rem;height:1.1rem"><h3 class="sp">${esc(x.title)}</h3>
      ${x.featured ? '<span class="b a">⭐ ফিচার্ড</span>' : ''}${x.hidden ? '<span class="b a">লুকানো</span>' : ''}${x.rented ? '<span class="b">ভাড়া হয়েছে</span>' : ''}${isOld(x) ? '<span class="b">মেয়াদোত্তীর্ণ</span>' : ''}<span class="b ${x.category === 'rent' ? 'g' : 'bl'}">${x.category === 'rent' ? 'ভাড়া দেওয়া' : 'খুঁজছি'}</span></div>
    <div class="mu">📍 ${esc(x.area)} · ৳${Number(x.rent).toLocaleString('bn-BD')} · ${esc(x.type || '')} · ${fdt(x.ts)} · ছবি ${x.pc || 0}টি · owner <code>${esc(String(x.owner || '').slice(0, 8))}</code>${bn ? ' <span class="b r">ব্যান</span>' : ''}</div>
    ${x.desc ? `<p class="mu" style="margin:.3rem 0">${esc(String(x.desc).slice(0, 160))}</p>` : ''}
    ${reps.length ? `<div class="row" style="margin:.3rem 0">${Object.entries(reps.reduce((m, r) => (m[r.reason] = (m[r.reason] || 0) + 1, m), {})).map(([k, n]) => `<span class="b r">${RS[k] || k} × ${n}</span>`).join('')}</div>` : ''}
    <div class="row" style="margin-top:.4rem">
      <button class="btn sm" data-a="edit">✏️ এডিট</button><button class="btn sm" data-a="ph">📞 নম্বর</button>
      <button class="btn sm am" data-a="feat">${x.featured ? '☆ ফিচার্ড বাদ' : '⭐ ফিচার্ড'}</button><button class="btn sm am" data-a="hide">${x.hidden ? '👁 দেখান' : '🙈 লুকান'}</button>
      <button class="btn sm" data-a="rent">${x.rented ? '↩ আবার খালি' : '✅ ভাড়া হয়েছে'}</button><button class="btn sm" data-a="renew">🔄 নতুন করুন</button>
      ${x.pc ? '<button class="btn sm" data-a="nophoto">🖼 ছবি মুছুন</button>' : ''}${reps.length ? '<button class="btn sm gr" data-a="dis">✔ রিপোর্ট খারিজ</button>' : ''}
      <span class="sp"></span>${x.owner ? `<button class="btn sm rd" data-a="ban">🚫 ইউজার ব্যান</button>` : ''}<button class="btn sm rd" data-a="del">🗑 মুছুন</button></div></div>`;
  }
  const filtered = () => {
    const k = q.trim().toLowerCase(), rg = new Set(R.map(r => r.lid));
    return L.filter(x => (F.cat === 'all' || x.category === F.cat) && (F.st === 'all' || (F.st === 'active' && !x.hidden && !x.rented && !isOld(x)) || (F.st === 'hidden' && x.hidden) || (F.st === 'rented' && x.rented) || (F.st === 'old' && isOld(x)) || (F.st === 'feat' && x.featured) || (F.st === 'rep' && rg.has(x.id)))
      && (!k || [x.title, x.area, x.desc, x.owner, String(x.id), x.type].some(v => String(v || '').toLowerCase().includes(k))));
  };

  // ---------- tabs ----------
  function tDash() {
    const day = {}, area = {}; L.forEach(x => { const d = x.ts ? Math.floor(x.ts / DAY) : 0; if (Date.now() / DAY - d < 14) day[d] = (day[d] || 0) + 1; const a = x.area || '—'; area[a] = (area[a] || 0) + 1; });
    const days = Array.from({ length: 14 }, (_, i) => Math.floor(Date.now() / DAY) - 13 + i), mx = Math.max(1, ...days.map(d => day[d] || 0));
    const top = Object.entries(area).sort((a, b) => b[1] - a[1]).slice(0, 8), tm = Math.max(1, top[0] ? top[0][1] : 1), exp = L.filter(isOld).length;
    const st = (n, t) => `<div class="card stat"><b>${n}</b><span class="mu">${t}</span></div>`;
    return `<div class="grid">${st(L.length, 'মোট বিজ্ঞাপন')}${st(L.filter(x => x.category === 'rent').length, 'ভাড়া দেওয়া')}${st(L.filter(x => x.category === 'need').length, 'বাসা খুঁজছি')}${st(L.filter(x => x.rented).length, 'ভাড়া হয়ে গেছে')}${st(L.filter(x => x.hidden).length, 'লুকানো')}${st(L.filter(x => x.featured).length, 'ফিচার্ড')}${st(new Set(R.map(r => r.lid)).size, 'রিপোর্ট করা পোস্ট')}${st(B.length, 'ব্যান ইউজার')}${st(exp, 'মেয়াদোত্তীর্ণ (৬০ দিন+)')}</div>
    <div class="g2"><div class="card"><h3>গত ১৪ দিনে নতুন বিজ্ঞাপন</h3>${days.map(d => `<div class="row" style="margin:.2rem 0"><span class="mu" style="width:3.2rem">${new Date(d * DAY).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</span><div class="bar" style="width:${(day[d] || 0) / mx * 100}%"></div><span class="mu">${day[d] || 0}</span></div>`).join('')}</div>
    <div class="card"><h3>এলাকা অনুযায়ী</h3>${top.map(([a, n]) => `<div class="row" style="margin:.2rem 0"><span style="width:7rem">${esc(a)}</span><div class="bar" style="width:${n / tm * 60}%"></div><span class="mu">${n}</span></div>`).join('')}</div></div>
    <div class="card"><h3>সাইটের অবস্থা</h3><div class="row"><span class="b ${S.siteOpen === false ? 'r' : 'g'}">${S.siteOpen === false ? '🛠 maintenance চালু' : '🟢 সাইট চালু'}</span><span class="b ${S.postingOpen === false ? 'r' : 'g'}">${S.postingOpen === false ? 'নতুন পোস্ট বন্ধ' : 'নতুন পোস্ট চালু'}</span><span class="b ${S.annOn ? 'a' : ''}">${S.annOn ? '📢 ঘোষণা চলছে' : 'ঘোষণা নেই'}</span><span class="sp"></span><button class="btn sm" data-t="set">⚙️ সেটিংস</button></div></div>
    <div class="card"><h3>টুলস</h3><div class="row"><button class="btn" id="csv">⬇️ CSV এক্সপোর্ট</button><label class="ck" style="margin:0"><input type="checkbox" id="csvPh"> নম্বরসহ (প্রতিটির জন্য ১টি read)</label></div>
      <h4>পুরনো বিজ্ঞাপন পরিষ্কার</h4><div class="row"><input type="number" id="pgDays" value="60" min="30" style="width:6rem"><span class="mu">দিনের পুরনো সব বিজ্ঞাপন (নম্বর/ছবিসহ)</span><button class="btn rd" id="purge">🧹 মুছুন</button></div></div>
    <div class="card"><h3>সাম্প্রতিক অ্যাডমিন কাজ</h3>${LOG.length ? `<table>${LOG.slice(0, 15).map(l => `<tr><td class="mu" style="white-space:nowrap">${fdt(l.ts)}</td><td>${esc(l.by)}</td><td>${esc(l.act)}</td></tr>`).join('')}</table>` : '<p class="mu">এখনো কিছু নেই।</p>'}</div>`;
  }
  function tRep() {
    const g = new Map(); R.forEach(r => (g.get(r.lid) || g.set(r.lid, []).get(r.lid)).push(r));
    const m = byId(), arr = [...g.entries()].sort((a, b) => b[1].length - a[1].length);
    return arr.length ? arr.map(([id, reps]) => m.has(id) ? lcard(m.get(id)) : `<div class="card" data-id="${id}"><b>বিজ্ঞাপন #${id} আর নেই</b> <span class="mu">(${reps.length}টি রিপোর্ট)</span> <button class="btn sm gr" data-a="dis">✔ খারিজ</button></div>`).join('') : '<div class="card mu">কোনো রিপোর্ট নেই 🎉</div>';
  }
  function tAll() {
    const rows = filtered(), opt = (v, t, cur) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${t}</option>`;
    return `<div class="row" style="margin-bottom:.6rem"><div style="flex:2;min-width:200px"><input type="search" id="qBox" placeholder="খুঁজুন: শিরোনাম / এলাকা / owner / id" value="${esc(q)}"></div>
      <select id="fSt" style="flex:1;min-width:130px">${opt('all', 'সব অবস্থা', F.st)}${opt('active', 'সক্রিয়', F.st)}${opt('hidden', 'লুকানো', F.st)}${opt('rented', 'ভাড়া হয়েছে', F.st)}${opt('old', 'মেয়াদোত্তীর্ণ', F.st)}${opt('feat', 'ফিচার্ড', F.st)}${opt('rep', 'রিপোর্ট আছে', F.st)}</select>
      <select id="fCat" style="flex:1;min-width:130px">${opt('all', 'সব ধরন', F.cat)}${opt('rent', 'ভাড়া দেওয়া', F.cat)}${opt('need', 'খুঁজছি', F.cat)}</select></div>
      <div class="row mu" style="margin-bottom:.6rem"><span>${rows.length}টি পাওয়া গেছে (সর্বশেষ ৪০০টির মধ্যে)</span><span class="sp"></span><button class="btn sm" id="selAll">সব বাছুন (দৃশ্যমান ${Math.min(rows.length, 100)}টি)</button></div>` + rows.slice(0, 100).map(lcard).join('');
  }
  function tUsers() {
    const ids = new Set([...U.map(u => u.id), ...L.map(x => x.owner).filter(Boolean), ...B.map(b => b.id)]), bn = bans();
    const rows = [...ids].map(id => { const u = U.find(x => x.id === id) || {}; return { id, last: u.last, n: u.n || 0, ads: L.filter(x => x.owner === id).length, banned: bn.has(id), b: B.find(x => x.id === id) }; }).sort((a, b) => (b.banned - a.banned) || (b.ads - a.ads));
    return `<div class="card"><h3>ইউজার (${rows.length})</h3><p class="mu">ইউজার ব্যান করলে সে আর নতুন বিজ্ঞাপন বা রিপোর্ট দিতে পারবে না। ইচ্ছা করলে তার সব বিজ্ঞাপনও একসাথে মুছতে পারেন।</p>
      <div style="overflow:auto"><table><tr><th>UID</th><th>শেষ পোস্ট</th><th>২৪ঘ-এ</th><th>বিজ্ঞাপন</th><th></th></tr>${rows.map(r => `<tr data-uid="${esc(r.id)}"><td><code>${esc(r.id.slice(0, 10))}…</code>${r.banned ? ` <span class="b r">ব্যান</span><div class="mu">${esc(r.b.reason || '')}</div>` : ''}</td><td class="mu">${fdt(r.last)}</td><td>${r.n}</td><td>${r.ads}</td><td class="row"><button class="btn sm" data-u="ads">📋 দেখুন</button>${r.banned ? '<button class="btn sm gr" data-u="unban">ব্যান তুলুন</button>' : '<button class="btn sm rd" data-u="ban">🚫 ব্যান</button>'}</td></tr>`).join('')}</table></div></div>`;
  }
  const fv = (id, v = '') => `<input type="text" id="${id}" value="${esc(v)}">`;
  function tSet() {
    const s = S, ck = (id, v, t) => `<label class="ck"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> ${t}</label>`, opt = (v, t) => `<option value="${v}" ${(s.annType || 'info') === v ? 'selected' : ''}>${t}</option>`;
    return `<form id="setForm"><div class="g2">
    <div class="card"><h3>📢 ঘোষণা বার (সাইটের মাথায়)</h3>${ck('annOn', s.annOn, 'ঘোষণা দেখান')}
      <label class="f"><span>ধরন</span><select id="annType">${opt('info', '🔵 তথ্য')}${opt('ok', '🟢 সুখবর')}${opt('warn', '🟡 সতর্কতা')}${opt('danger', '🔴 জরুরি')}</select></label>
      <label class="f"><span>লেখা</span><textarea id="annText" maxlength="300">${esc(s.annText || '')}</textarea></label>
      <label class="f"><span>লিংক (ঐচ্ছিক, https://…)</span>${fv('annLink', s.annLink)}</label><label class="f"><span>লিংকের লেখা</span>${fv('annLinkText', s.annLinkText)}</label></div>
    <div class="card"><h3>🚦 সাইট নিয়ন্ত্রণ</h3>${ck('postingOpen', s.postingOpen !== false, 'নতুন বিজ্ঞাপন নেওয়া চালু')}<label class="f"><span>বন্ধ থাকলে বার্তা</span>${fv('postingMsg', s.postingMsg)}</label>
      ${ck('siteOpen', s.siteOpen !== false, 'সাইট চালু (বন্ধ করলে ভিজিটররা maintenance পর্দা দেখবে; আপনি অ্যাডমিন হিসেবে লগইন থাকলে দেখতে পাবেন)')}<label class="f"><span>maintenance বার্তা</span>${fv('maintMsg', s.maintMsg)}</label>
      <p class="mu">দ্রষ্টব্য: “নতুন পোস্ট বন্ধ” ও “সাইট বন্ধ” সার্ভার rules দিয়েই আটকানো হয়। সাইট বন্ধের পর্দাটি শুধু ভিজিটরের স্ক্রিনে।</p></div></div>
    <div class="g2"><div class="card"><h3>🏠 হোমপেজের লেখা (ফাঁকা = আগেরটাই)</h3><label class="f"><span>ছোট ব্যাজ</span>${fv('heroBadge', s.heroBadge)}</label><label class="f"><span>বড় শিরোনাম</span>${fv('heroTitle', s.heroTitle)}</label><label class="f"><span>উপশিরোনাম</span>${fv('heroSub', s.heroSub)}</label><p class="mu">এই লেখা সব ভাষায় একই দেখাবে।</p></div>
    <div class="card"><h3>💰 যোগাযোগ, বিজ্ঞাপন ও অ্যানালিটিক্স</h3><label class="f"><span>যোগাযোগের ইমেইল (রিপোর্টের mailto-তে)</span><input type="email" id="email" value="${esc(s.email || '')}"></label>
      ${ck('adsEnabled', s.adsEnabled !== false, 'Google AdSense বিজ্ঞাপন চালু')}<label class="f"><span>AdSense Publisher ID (ca-pub-…)</span>${fv('adsPub', s.adsPub)}</label>
      <div class="row"><label class="f sp"><span>উপরের স্লট ID</span>${fv('adsTop', s.adsTop)}</label><label class="f sp"><span>নিচের স্লট ID</span>${fv('adsBottom', s.adsBottom)}</label></div>
      <label class="f"><span>Google Analytics ID (G-XXXXXXX)</span>${fv('gaId', s.gaId)}</label><p class="mu">কোডে হাত না দিয়েই এখান থেকে বসানো যায়; ভুল ফরম্যাট হলে সাইট তা উপেক্ষা করে।</p></div></div>
    <div class="card"><h3>📍 অতিরিক্ত এলাকা</h3><p class="mu">প্রতি লাইনে একটি: <code>বাংলা নাম | English name</code></p><textarea id="areas" style="min-height:7rem">${esc((s.areas || []).map(a => a.bn + ' | ' + (a.en || '')).join('\n'))}</textarea></div>
    <div class="row"><button class="btn gr" type="submit">💾 সেভ করুন</button><span class="mu">শেষ পরিবর্তন: ${fdt(s.updatedAt)} ${s.updatedBy ? '· ' + esc(s.updatedBy) : ''}</span></div></form>`;
  }
  function tAdm() {
    const me = auth.currentUser.uid;
    return `<div class="card"><h3>🛡 অ্যাডমিনগণ (${A.length})</h3><table>${A.map(a => `<tr data-aid="${esc(a.id)}"><td><code>${esc(a.id)}</code>${a.id === me ? ' <span class="b g">আপনি</span>' : ''}<div class="mu">${esc(a.note || '')}${a.by ? ' · যোগ করেছেন ' + esc(a.by) : ''}</div></td><td>${a.id === me ? '' : '<button class="btn sm rd" data-a2="rm">সরান</button>'}</td></tr>`).join('')}</table></div>
    <div class="card"><h3>নতুন অ্যাডমিন যোগ করুন</h3><p class="mu">যাকে অ্যাডমিন করবেন সে একবার <code>admin.html</code> এ Google লগইন করলে “অ্যাডমিন নয়” পেজে তার UID দেখাবে — সেটি এখানে বসান। অ্যাডমিন সব কিছু (মোছা, ব্যান, সেটিংস) করতে পারবে, তাই বিশ্বস্ত কাউকেই দিন।</p>
      <div class="row"><input type="text" id="nAid" placeholder="UID" style="flex:2;min-width:220px"><input type="text" id="nNote" placeholder="নাম/নোট" style="flex:1;min-width:120px"><button class="btn gr" id="addAdm">➕ যোগ করুন</button></div></div>
    <div class="card"><h3>অ্যাডমিন লগ</h3>${LOG.length ? `<table>${LOG.map(l => `<tr><td class="mu" style="white-space:nowrap">${fdt(l.ts)}</td><td>${esc(l.by)}</td><td>${esc(l.act)}</td></tr>`).join('')}</table>` : '<p class="mu">খালি।</p>'}</div>`;
  }
  function editModal() {
    const x = byId().get(edit); if (!x) return '';
    return `<div class="ov" id="edOv"><div class="card"><h3>✏️ এডিট — #${x.id}</h3>
      <label class="f"><span>শিরোনাম</span>${fv('eTitle', x.title)}</label>
      <div class="row"><label class="f sp"><span>ভাড়া (৳)</span><input type="number" id="eRent" value="${x.rent}" min="500"></label><label class="f sp"><span>রুম</span><input type="number" id="eRooms" value="${x.rooms ?? ''}" min="0" max="20"></label></div>
      <div class="row"><label class="f sp"><span>ধরন (বাসার)</span>${fv('eType', x.type || '')}</label><label class="f sp"><span>বিভাগ</span><select id="eCat"><option value="rent" ${x.category === 'rent' ? 'selected' : ''}>ভাড়া দেওয়া</option><option value="need" ${x.category === 'need' ? 'selected' : ''}>খুঁজছি</option></select></label></div>
      <label class="f"><span>বিবরণ</span><textarea id="eDesc" maxlength="1500">${esc(x.desc || '')}</textarea></label>
      <div class="row"><button class="btn gr" id="edSave">💾 সেভ</button><button class="btn" id="edCancel">বাতিল</button></div></div></div>`;
  }
  function paint() {
    if (!auth.currentUser || auth.currentUser.isAnonymous) return;
    const keep = document.activeElement && document.activeElement.id === 'qBox' ? document.activeElement.selectionStart : null;
    const nRep = new Set(R.map(r => r.lid)).size, T = (id, t) => `<button class="tab ${tab === id ? 'on' : ''}" data-t="${id}">${t}</button>`;
    const body = tab === 'dash' ? tDash() : tab === 'rep' ? tRep() : tab === 'all' ? tAll() : tab === 'usr' ? tUsers() : tab === 'set' ? tSet() : tAdm();
    app.innerHTML = `<div class="tabs">${T('dash', '📊 ড্যাশবোর্ড')}${T('rep', `🚩 রিপোর্ট (${nRep})`)}${T('all', '📋 বিজ্ঞাপন')}${T('usr', '👥 ইউজার')}${T('set', '⚙️ সাইট সেটিংস')}${T('adm', '🛡 অ্যাডমিন')}</div>${body}`
      + (sel.size && (tab === 'all' || tab === 'rep') ? `<div class="bulk"><b>${sel.size}টি বাছা</b><button class="btn sm" data-b="hide">🙈 লুকান</button><button class="btn sm" data-b="show">👁 দেখান</button><button class="btn sm" data-b="feat">⭐ ফিচার্ড</button><button class="btn sm" data-b="rent">✅ ভাড়া হয়েছে</button><button class="btn sm rd" data-b="del">🗑 মুছুন</button><button class="btn sm" data-b="clr">✕</button></div>` : '') + editModal();
    if (keep !== null) { const b = $('qBox'); if (b) { b.focus(); b.setSelectionRange(keep, keep); } }
  }

  // ---------- events ----------
  app.addEventListener('input', e => { if (e.target.id === 'qBox') { q = e.target.value; paint(); } });
  app.addEventListener('change', e => { if (e.target.id === 'fSt') { F.st = e.target.value; paint(); } else if (e.target.id === 'fCat') { F.cat = e.target.value; paint(); } else if (e.target.matches('[data-sel]')) { const id = Number(e.target.closest('[data-id]').dataset.id); e.target.checked ? sel.add(id) : sel.delete(id); paint(); } });
  app.addEventListener('submit', e => { if (e.target.id === 'setForm') { e.preventDefault(); saveSettings(); } });

  function saveSettings() {
    const g = id => $(id).value.trim(), c = id => $(id).checked;
    const bad = [];
    if (g('annLink') && !/^https:\/\//.test(g('annLink'))) bad.push('ঘোষণার লিংক https:// দিয়ে শুরু হতে হবে');
    if (g('adsPub') && !/^ca-pub-\d{10,}$/.test(g('adsPub'))) bad.push('AdSense ID ফরম্যাট: ca-pub-1234567890123456');
    if (g('gaId') && !/^G-[A-Z0-9]{6,}$/.test(g('gaId'))) bad.push('Analytics ID ফরম্যাট: G-ABCDEF1234');
    if (g('email') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g('email'))) bad.push('ইমেইল ঠিক নয়');
    if (bad.length) return toast('❌ ' + bad[0]);
    const areas = $('areas').value.split('\n').map(l => l.split('|').map(x => x.trim())).filter(a => a[0]).slice(0, 100).map(a => ({ bn: a[0].slice(0, 40), en: (a[1] || '').slice(0, 40) }));
    const data = { annOn: c('annOn'), annType: g('annType'), annText: g('annText'), annLink: g('annLink'), annLinkText: g('annLinkText'), postingOpen: c('postingOpen'), postingMsg: g('postingMsg'), siteOpen: c('siteOpen'), maintMsg: g('maintMsg'),
      heroBadge: g('heroBadge'), heroTitle: g('heroTitle'), heroSub: g('heroSub'), email: g('email'), adsEnabled: c('adsEnabled'), adsPub: g('adsPub'), adsTop: g('adsTop'), adsBottom: g('adsBottom'), gaId: g('gaId'), areas, updatedAt: serverTimestamp(), updatedBy: who() };
    if (!data.siteOpen && !confirm('সাইট বন্ধ করলে ভিজিটররা শুধু maintenance পর্দা দেখবে। নিশ্চিত?')) return;
    run(async () => { const b = writeBatch(db); b.set(doc(db, 'settings', 'site'), data); logTo(b, 'সাইট সেটিংস সেভ'); await b.commit(); }, 'সেটিংস সেভ হয়েছে — সাইটে সাথে সাথে কার্যকর');
  }

  async function csv() {
    const rows = filtered().length && tab === 'all' ? filtered() : L, withPh = $('csvPh') && $('csvPh').checked;
    if (withPh && !confirm(`${rows.length}টি নম্বর আনতে ${rows.length}টি Firestore read লাগবে। চালিয়ে যাবেন?`)) return;
    const q2 = s => '"' + String(s ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"', out = [['id', 'তারিখ', 'বিভাগ', 'শিরোনাম', 'এলাকা', 'ভাড়া', 'ধরন', 'রুম', 'লুকানো', 'ভাড়া হয়েছে', 'ফিচার্ড', 'owner'].concat(withPh ? ['ফোন', 'WhatsApp'] : [])];
    for (const x of rows) {
      const r = [x.id, x.ts ? new Date(x.ts).toISOString().slice(0, 10) : '', x.category, x.title, x.area, x.rent, x.type || '', x.rooms ?? '', x.hidden ? 'হ্যাঁ' : '', x.rented ? 'হ্যাঁ' : '', x.featured ? 'হ্যাঁ' : '', x.owner];
      if (withPh) { let v = ct.get(x.id); if (!v) { try { const s = await getDoc(doc(db, 'contacts', String(x.id))); v = s.exists() ? s.data() : {}; ct.set(x.id, v); } catch (_) { v = {}; } } r.push(v.phone || '', v.wa || ''); }
      out.push(r);
    }
    const blob = new Blob(['\ufeff' + out.map(r => r.map(q2).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'listings-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); URL.revokeObjectURL(a.href);
  }
  async function purge() {
    const days = Math.max(30, Number($('pgDays').value) || 60), cut = Date.now() - days * DAY;
    if (!confirm(`${days} দিনের চেয়ে পুরনো সব বিজ্ঞাপন (নম্বর ও ছবিসহ) চিরতরে মুছে যাবে। নিশ্চিত?`)) return;
    let total = 0;
    for (let i = 0; i < 30; i++) {
      const s = await getDocs(query(collection(db, 'listings'), where('ts', '<', cut), orderBy('ts'), limit(100)));
      if (s.empty) break;
      const b = writeBatch(db); s.docs.forEach(d => { b.delete(d.ref); b.delete(doc(db, 'contacts', d.id)); b.delete(doc(db, 'photos', d.id)); });
      logTo(b, `পুরনো (${days}+ দিন) ${s.size}টি মুছে ফেলা`); await b.commit(); total += s.size;
    }
    toast(total ? `✅ ${total}টি মুছে ফেলা হয়েছে` : 'মেয়াদোত্তীর্ণ কিছু নেই');
  }
  async function banUser(uid, alsoDel) {
    const reason = prompt('ব্যানের কারণ (ঐচ্ছিক):', '') ; if (reason === null) return;
    const mine = L.filter(x => x.owner === uid).map(x => x.id);
    const del2 = mine.length && confirm(`এই ইউজারের ${mine.length}টি বিজ্ঞাপনও মুছে ফেলবেন?\n(OK = মুছুন, Cancel = রেখে দিন)`);
    await run(async () => { const b = writeBatch(db); b.set(doc(db, 'bans', uid), { reason, by: who(), ts: serverTimestamp() }); logTo(b, `ইউজার ব্যান ${uid.slice(0, 8)}… ${reason}`); await b.commit(); if (del2) await delListings(mine); }, 'ইউজার ব্যান হয়েছে');
  }

  app.addEventListener('click', async e => {
    const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; return paint(); }
    const id0 = e.target.id;
    if (id0 === 'csv') return run(csv, 'CSV নামানো হয়েছে');
    if (id0 === 'purge') return run(purge);
    if (id0 === 'selAll') { filtered().slice(0, 100).forEach(x => sel.add(x.id)); return paint(); }
    if (id0 === 'edCancel' || id0 === 'edOv') { edit = null; return paint(); }
    if (id0 === 'edSave') {
      const x = byId().get(edit), f = { title: $('eTitle').value.trim(), rent: parseInt($('eRent').value, 10), type: $('eType').value.trim().slice(0, 40), category: $('eCat').value, desc: $('eDesc').value.trim().slice(0, 1500) };
      const rooms = $('eRooms').value; if (rooms !== '') f.rooms = parseInt(rooms, 10);
      if (f.title.length < 3 || !(f.rent >= 500)) return toast('❌ শিরোনাম (৩+ অক্ষর) ও ভাড়া (৫০০+) ঠিক দিন');
      const id = edit; edit = null; await upd([id], f, 'এডিট'); return paint();
    }
    if (id0 === 'addAdm') {
      const uid = $('nAid').value.trim(), note = $('nNote').value.trim();
      if (!/^[A-Za-z0-9]{20,40}$/.test(uid)) return toast('❌ UID ঠিক নয়');
      return run(async () => { const b = writeBatch(db); b.set(doc(db, 'admins', uid), { ok: true, note, by: who(), ts: serverTimestamp() }); logTo(b, 'নতুন অ্যাডমিন: ' + (note || uid.slice(0, 8))); await b.commit(); }, 'অ্যাডমিন যোগ হয়েছে');
    }
    const a2 = e.target.closest('[data-a2]');
    if (a2) { const aid = a2.closest('[data-aid]').dataset.aid; if (!confirm('এই অ্যাডমিনকে সরাবেন?')) return; return run(async () => { const b = writeBatch(db); b.delete(doc(db, 'admins', aid)); logTo(b, 'অ্যাডমিন সরানো: ' + aid.slice(0, 8)); await b.commit(); }, 'সরানো হয়েছে'); }
    const bk = e.target.closest('[data-b]');
    if (bk) {
      const ids = [...sel], k = bk.dataset.b;
      if (k === 'clr') { sel.clear(); return paint(); }
      if (k === 'del') return del(ids);
      const f = k === 'hide' ? { hidden: true } : k === 'show' ? { hidden: false } : k === 'feat' ? { featured: true } : { rented: true };
      await upd(ids, f, 'গণ-পরিবর্তন'); sel.clear(); return paint();
    }
    const us = e.target.closest('[data-u]');
    if (us) {
      const uid = us.closest('[data-uid]').dataset.uid, k = us.dataset.u;
      if (k === 'ads') { tab = 'all'; q = uid; F = { st: 'all', cat: 'all' }; return paint(); }
      if (k === 'ban') return banUser(uid);
      if (k === 'unban') return run(async () => { const b = writeBatch(db); b.delete(doc(db, 'bans', uid)); logTo(b, 'ব্যান তোলা ' + uid.slice(0, 8) + '…'); await b.commit(); }, 'ব্যান তোলা হয়েছে');
    }
    const b = e.target.closest('[data-a]'), c = e.target.closest('[data-id]'); if (!b || !c) return;
    const id = Number(c.dataset.id), a = b.dataset.a, x = byId().get(id);
    if (a === 'dis') return run(async () => { const w = writeBatch(db); R.filter(r => r.lid === id).forEach(r => w.delete(doc(db, 'reports', r.rid))); logTo(w, `রিপোর্ট খারিজ #${id}`); await w.commit(); }, 'রিপোর্ট খারিজ');
    if (!x) return;
    if (a === 'edit') { edit = id; return paint(); }
    if (a === 'del') return del([id]);
    if (a === 'hide') return upd([id], { hidden: !x.hidden }, x.hidden ? 'আবার দেখানো' : 'লুকানো');
    if (a === 'feat') return upd([id], { featured: !x.featured }, x.featured ? 'ফিচার্ড বাদ' : 'ফিচার্ড করা');
    if (a === 'rent') return upd([id], { rented: !x.rented }, x.rented ? 'আবার খালি' : 'ভাড়া হয়েছে চিহ্নিত');
    if (a === 'renew') return upd([id], { ts: Date.now() }, 'নতুন করা (renew)');
    if (a === 'nophoto') { if (!confirm('এই বিজ্ঞাপনের সব ছবি মুছে ফেলবেন?')) return; return run(async () => { const w = writeBatch(db); w.update(doc(db, 'listings', String(id)), { thumb: deleteField(), pc: 0 }); w.delete(doc(db, 'photos', String(id))); logTo(w, `ছবি মুছে ফেলা #${id}`); await w.commit(); }, 'ছবি মুছে ফেলা হয়েছে'); }
    if (a === 'ban') return banUser(x.owner);
    if (a === 'ph') { try { let v = ct.get(id); if (!v) { const s = await getDoc(doc(db, 'contacts', String(id))); v = s.exists() ? s.data() : { phone: '—' }; ct.set(id, v); } b.outerHTML = `<b>📞 ${esc(v.phone)}${v.wa ? ' · WA ' + esc(v.wa) : ''}</b>`; } catch (er) { toast('❌ ' + er.code); } }
  });
} catch (e) { app.innerHTML = '<div class="card">Firebase লোড হয়নি: ' + esc(e.message || e.code) + '</div>'; }
