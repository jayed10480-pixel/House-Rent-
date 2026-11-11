// Admin panel — shudhu Firestore e `admins/{uid}` document thaka account (Console theke banano) ee chalate pare.
const cfg = window.FB_CONFIG, X = window.APP_CFG || {};
const $ = id => document.getElementById(id), app = $('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = m => { const t = $('toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => t.style.display = 'none', 2600); };
const DAY = 864e5, RS = { fake: 'ভুয়া/প্রতারণা', rented: 'ভাড়া হয়ে গেছে', wrong: 'ভুল তথ্য', dup: 'ডুপ্লিকেট', bad: 'আপত্তিকর', other: 'অন্য' };

if (!(cfg && cfg.apiKey)) {
  app.innerHTML = '<div class="card">firebase-config.js এ Firebase key বসানো নেই।</div>';
} else try {
  const V = 'https://www.gstatic.com/firebasejs/11.0.2/';
  const [{ initializeApp }, AU, FS, AC] = await Promise.all([import(V + 'firebase-app.js'), import(V + 'firebase-auth.js'), import(V + 'firebase-firestore.js'),
    X.recaptchaSiteKey ? import(V + 'firebase-app-check.js') : Promise.resolve(null)]);
  const { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } = AU;
  const { getFirestore, collection, doc, getDoc, query, orderBy, limit, onSnapshot, writeBatch, where, getDocs } = FS;
  const fb = initializeApp(cfg);
  if (AC) { if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; AC.initializeAppCheck(fb, { provider: new AC.ReCaptchaV3Provider(X.recaptchaSiteKey), isTokenAutoRefreshEnabled: true }); }
  const auth = getAuth(fb), db = getFirestore(fb);
  let L = [], R = [], tab = 'rep', q = '', unsubs = [];
  const ct = new Map();

  const login = () => { app.innerHTML = '<div class="card"><h3>অ্যাডমিন লগইন</h3><p class="mu">যে Google অ্যাকাউন্টের UID <code>admins</code> collection এ আছে সেটি দিয়ে লগইন করুন।</p><button id="gBtn" class="btn gr">🔐 Google দিয়ে লগইন</button></div>';
    $('gBtn').onclick = () => signInWithPopup(auth, new GoogleAuthProvider()).catch(e => toast(e.code === 'auth/popup-closed-by-user' ? 'বাতিল' : 'লগইন হয়নি: ' + e.code)); };
  $('outBtn').onclick = () => signOut(auth);

  onAuthStateChanged(auth, async u => {
    unsubs.forEach(f => f()); unsubs = [];
    $('outBtn').hidden = !u || u.isAnonymous; $('who').textContent = u && !u.isAnonymous ? (u.email || '') : '';
    if (!u || u.isAnonymous) return login();
    let ok = false; try { ok = (await getDoc(doc(db, 'admins', u.uid))).exists(); } catch (_) {}
    if (!ok) { app.innerHTML = `<div class="card"><h3>⛔ এই অ্যাকাউন্ট অ্যাডমিন নয়</h3><p class="mu">অ্যাডমিন বানাতে: Firebase Console → Firestore → <b>Start collection</b> → Collection ID <code>admins</code> → Document ID এ নিচের UID পেস্ট করুন (field লাগবে না, যেকোনো একটা দিন, যেমন <code>ok = true</code>)।</p><p>আপনার UID: <code>${esc(u.uid)}</code></p></div>`; return; }
    unsubs.push(onSnapshot(query(collection(db, 'listings'), orderBy('ts', 'desc'), limit(400)), s => { L = s.docs.map(d => d.data()); paint(); }, e => toast('listings: ' + e.code)));
    unsubs.push(onSnapshot(query(collection(db, 'reports'), orderBy('ts', 'desc'), limit(500)), s => { R = s.docs.map(d => ({ ...d.data(), rid: d.id })); paint(); }, e => toast('reports: ' + e.code)));
    paint();
  });

  const byId = () => new Map(L.map(x => [x.id, x]));
  const repGroups = () => { const g = new Map(); R.forEach(r => { (g.get(r.lid) || g.set(r.lid, []).get(r.lid)).push(r); }); return [...g.entries()].sort((a, b) => b[1].length - a[1].length); };

  async function delListing(id) {
    if (!confirm('এই বিজ্ঞাপন (ও এর রিপোর্ট) মুছে ফেলবেন?')) return;
    const b = writeBatch(db);
    b.delete(doc(db, 'listings', String(id))); b.delete(doc(db, 'contacts', String(id))); b.delete(doc(db, 'photos', String(id)));
    R.filter(r => r.lid === id).forEach(r => b.delete(doc(db, 'reports', r.rid)));
    try { await b.commit(); toast('মুছে ফেলা হয়েছে'); } catch (e) { toast('হয়নি: ' + e.code); }
  }
  async function dismiss(id) {
    const b = writeBatch(db); R.filter(r => r.lid === id).forEach(r => b.delete(doc(db, 'reports', r.rid)));
    try { await b.commit(); toast('রিপোর্ট খারিজ'); } catch (e) { toast('হয়নি: ' + e.code); }
  }
  async function toggleHide(id) {
    const x = byId().get(id); if (!x) return;
    try { const { updateDoc } = FS; await updateDoc(doc(db, 'listings', String(id)), { hidden: !x.hidden }); toast(x.hidden ? 'আবার দেখানো হচ্ছে' : 'লুকানো হয়েছে'); } catch (e) { toast('হয়নি: ' + e.code); }
  }
  async function showPhone(id, el) {
    try { let v = ct.get(id); if (!v) { const s = await getDoc(doc(db, 'contacts', String(id))); v = s.exists() ? s.data() : { phone: '—' }; ct.set(id, v); } el.outerHTML = `<b>📞 ${esc(v.phone)}${v.wa ? ' · WA ' + esc(v.wa) : ''}</b>`; } catch (e) { toast('হয়নি: ' + e.code); }
  }
  async function purgeOld() {
    const old = L.filter(x => x.ts && Date.now() - x.ts > 60 * DAY);
    if (!old.length) return toast('মেয়াদোত্তীর্ণ কিছু নেই');
    if (!confirm(`${old.length}টি ৬০ দিনের পুরনো বিজ্ঞাপন (ও তাদের নম্বর/রিপোর্ট) মুছে ফেলবেন?`)) return;
    try {
      for (let i = 0; i < old.length; i += 100) {
        const b = writeBatch(db);
        old.slice(i, i + 100).forEach(x => { b.delete(doc(db, 'listings', String(x.id))); b.delete(doc(db, 'contacts', String(x.id))); b.delete(doc(db, 'photos', String(x.id))); R.filter(r => r.lid === x.id).forEach(r => b.delete(doc(db, 'reports', r.rid))); });
        await b.commit();
      }
      toast(old.length + 'টি মুছে ফেলা হয়েছে');
    } catch (e) { toast('হয়নি: ' + e.code); }
  }

  const lcard = (x, reps) => `<div class="card" data-id="${x.id}">
    <div class="row"><h3 class="sp">${esc(x.title)}</h3>${x.hidden ? '<span class="b a">লুকানো</span>' : ''}${x.rented ? '<span class="b">ভাড়া হয়েছে</span>' : ''}<span class="b ${x.category === 'rent' ? 'g' : 'a'}">${x.category === 'rent' ? 'ভাড়া দেওয়া' : 'খুঁজছি'}</span></div>
    <div class="mu">📍 ${esc(x.area)} · ৳${Number(x.rent).toLocaleString('bn-BD')} · ${x.ts ? new Date(x.ts).toLocaleDateString('bn-BD') : ''} · owner <code>${esc(String(x.owner || '').slice(0, 8))}</code></div>
    ${x.desc ? `<p class="mu">${esc(String(x.desc).slice(0, 160))}</p>` : ''}
    ${reps ? `<div class="row" style="margin:.3rem 0">${Object.entries(reps.reduce((m, r) => (m[r.reason] = (m[r.reason] || 0) + 1, m), {})).map(([k, n]) => `<span class="b r">${RS[k] || k} × ${n}</span>`).join('')}</div>` : ''}
    <div class="row"><button class="btn" data-a="ph">📞 নম্বর দেখুন</button><button class="btn am" data-a="hide">${x.hidden ? '👁 দেখান' : '🙈 লুকান'}</button>${reps ? '<button class="btn gr" data-a="dis">✔ রিপোর্ট খারিজ</button>' : ''}<span class="sp"></span><button class="btn rd" data-a="del">🗑 মুছুন</button></div></div>`;

  function paint() {
    if (!auth.currentUser || !L) return;
    const m = byId(), g = repGroups(), exp = L.filter(x => x.ts && Date.now() - x.ts > 60 * DAY).length;
    let body = '';
    if (tab === 'rep') {
      body = g.length ? g.map(([id, reps]) => m.has(id) ? lcard(m.get(id), reps) : `<div class="card" data-id="${id}"><b>বিজ্ঞাপন #${id} আর নেই</b> <span class="mu">(${reps.length}টি রিপোর্ট)</span> <button class="btn gr" data-a="dis">✔ খারিজ</button></div>`).join('') : '<div class="card mu">কোনো রিপোর্ট নেই 🎉</div>';
    } else if (tab === 'all') {
      const k = q.trim().toLowerCase(), rg = new Map(g);
      const rows = L.filter(x => !k || [x.title, x.area, x.desc, x.owner, String(x.id)].some(v => String(v || '').toLowerCase().includes(k)));
      body = `<input type="search" id="qBox" placeholder="খুঁজুন: শিরোনাম / এলাকা / owner / id" value="${esc(q)}"><div class="mu" style="margin-bottom:.6rem">${rows.length}টি (সর্বশেষ ৪০০টির মধ্যে)</div>` + rows.slice(0, 100).map(x => lcard(x, rg.get(x.id))).join('');
    } else {
      const day = {}, area = {}; L.forEach(x => { const d = x.ts ? Math.floor(x.ts / DAY) : 0; if (Date.now() / DAY - d < 14) day[d] = (day[d] || 0) + 1; const a = x.area || '—'; area[a] = (area[a] || 0) + 1; });
      const days = Array.from({ length: 14 }, (_, i) => Math.floor(Date.now() / DAY) - 13 + i), mx = Math.max(1, ...days.map(d => day[d] || 0));
      const top = Object.entries(area).sort((a, b) => b[1] - a[1]).slice(0, 8), tm = Math.max(1, top[0] ? top[0][1] : 1);
      body = `<div class="grid"><div class="card stat"><b>${L.length}</b><span class="mu">মোট বিজ্ঞাপন</span></div><div class="card stat"><b>${L.filter(x => x.category === 'rent').length}</b><span class="mu">ভাড়া দেওয়া</span></div><div class="card stat"><b>${L.filter(x => x.category === 'need').length}</b><span class="mu">বাসা খুঁজছি</span></div><div class="card stat"><b>${L.filter(x => x.rented).length}</b><span class="mu">ভাড়া হয়ে গেছে</span></div><div class="card stat"><b>${L.filter(x => x.hidden).length}</b><span class="mu">লুকানো</span></div><div class="card stat"><b>${exp}</b><span class="mu">মেয়াদোত্তীর্ণ (৬০ দিন+)</span></div></div>
      <div class="card"><h3>গত ১৪ দিনে নতুন বিজ্ঞাপন</h3>${days.map(d => `<div class="row" style="margin:.2rem 0"><span class="mu" style="width:3.2rem">${new Date(d * DAY).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</span><div class="bar" style="width:${(day[d] || 0) / mx * 100}%"></div><span class="mu">${day[d] || 0}</span></div>`).join('')}</div>
      <div class="card"><h3>সবচেয়ে বেশি বিজ্ঞাপন — এলাকা</h3>${top.map(([a, n]) => `<div class="row" style="margin:.2rem 0"><span style="width:7rem">${esc(a)}</span><div class="bar" style="width:${n / tm * 60}%"></div><span class="mu">${n}</span></div>`).join('')}</div>
      <div class="card"><h3>পরিষ্কার-পরিচ্ছন্নতা</h3><p class="mu">৬০ দিনের বেশি পুরনো বিজ্ঞাপন সাইটে আর দেখায় না, কিন্তু ডেটাবেসে জায়গা নেয় — একসাথে মুছে দিন।</p><button class="btn rd" id="purge">🧹 ${exp}টি পুরনো বিজ্ঞাপন মুছুন</button></div>`;
    }
    const keep = document.activeElement && document.activeElement.id === 'qBox' ? document.activeElement.selectionStart : null;
    app.innerHTML = `<div class="tabs"><button class="tab ${tab === 'rep' ? 'on' : ''}" data-t="rep">🚩 রিপোর্ট (${g.length})</button><button class="tab ${tab === 'all' ? 'on' : ''}" data-t="all">📋 সব বিজ্ঞাপন</button><button class="tab ${tab === 'stat' ? 'on' : ''}" data-t="stat">📊 পরিসংখ্যান</button></div>${body}`;
    if (keep !== null) { const b = $('qBox'); b.focus(); b.setSelectionRange(keep, keep); }
  }

  app.addEventListener('input', e => { if (e.target.id === 'qBox') { q = e.target.value; paint(); } });
  app.addEventListener('click', e => {
    const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; return paint(); }
    if (e.target.id === 'purge') return purgeOld();
    const b = e.target.closest('[data-a]'), c = e.target.closest('[data-id]'); if (!b || !c) return;
    const id = Number(c.dataset.id), a = b.dataset.a;
    if (a === 'del') delListing(id); else if (a === 'dis') dismiss(id); else if (a === 'hide') toggleHide(id); else if (a === 'ph') showPhone(id, b);
  });
} catch (e) { app.innerHTML = '<div class="card">Firebase লোড হয়নি: ' + esc(e.message || e.code) + '</div>'; }
