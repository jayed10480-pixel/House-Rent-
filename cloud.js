// Firebase layer (Firestore + Auth + optional App Check). SDK pinned to 11.0.2, loaded lazily from gstatic.
// firebase-config.js faka thakle kichu download hoy na (local mode).
//
// Data model:
//   listings/{id} -> bijnapon + `thumb` (chhoto preview) + `pc` (chobi sankhya). Phone nei! Shobai eta download kore.
//   photos/{id}   -> { owner, list:[full chobi] } — shudhu gallery khulle 1 ta read.
//   contacts/{id} -> { owner, phone, wa } — shudhu "নম্বর দেখুন" chaple 1 ta read (list kora jay na).
//   users/{uid}   -> rate-limit counter.   reports/{id_uid} -> report.   admins/{uid} -> admin (Console theke).
const cfg = window.FB_CONFIG, X = window.APP_CFG || {};
const emit = (n, d) => document.dispatchEvent(new CustomEvent(n, { detail: d }));
const DAY = 864e5, DAILY = 10;                    // DAILY = firestore.rules er "n <= 10" er sathe mil thakte hobe
const clean = o => JSON.parse(JSON.stringify(o)); // Firestore rejects undefined values

if (cfg && cfg.apiKey) {
  try {
    const V = 'https://www.gstatic.com/firebasejs/11.0.2/';
    const [{ initializeApp }, AU, FS, AC] = await Promise.all([
      import(V + 'firebase-app.js'), import(V + 'firebase-auth.js'), import(V + 'firebase-firestore.js'),
      X.recaptchaSiteKey ? import(V + 'firebase-app-check.js') : Promise.resolve(null)
    ]);
    const { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, EmailAuthProvider, linkWithPopup, linkWithCredential,
      signInWithCredential, signInWithEmailLink, sendSignInLinkToEmail, isSignInWithEmailLink, signOut } = AU;
    const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, getDoc, setDoc, updateDoc,
      query, where, orderBy, limit, onSnapshot, writeBatch, serverTimestamp } = FS;

    const app = initializeApp(cfg);
    if (AC) {   // bot/spam protection (free reCAPTCHA v3). Console e "Enforce" korle tobei pura kaj kore.
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      AC.initializeAppCheck(app, { provider: new AC.ReCaptchaV3Provider(X.recaptchaSiteKey), isTokenAutoRefreshEnabled: true });
    }
    const auth = getAuth(app);
    // Offline cache + multi-tab: repeat visits read only what changed (saves free-tier reads).
    const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
    const col = collection(db, 'listings');

    let uid = null, unsub = [], admin = false, banned = false, ready = false;
    const contacts = new Map();
    const me = () => { const u = auth.currentUser; return u ? { uid: u.uid, anon: u.isAnonymous, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '', admin, banned } : null; };

    // Site settings (admin panel theke) — public doc, live update. Auth lage na.
    onSnapshot(doc(db, 'settings', 'site'), s => {
      const v = s.exists() ? s.data() : {};
      window.CLOUD_SETTINGS = v; emit('cloud:settings', v);
    }, () => {});

    function listen(u) {
      unsub.forEach(f => f()); unsub = [];
      const pub = new Map(), mine = new Map();
      let t = 0;
      const push = () => { clearTimeout(t); t = setTimeout(() => {
        const all = new Map([...pub, ...mine]);
        emit('cloud:data', [...all.values()].sort((a, b) => (b.ts || 0) - (a.ts || 0)));
      }, 30); };
      const watch = (q, m) => unsub.push(onSnapshot(q, s => { s.docChanges().forEach(c => c.type === 'removed' ? m.delete(c.doc.id) : m.set(c.doc.id, c.doc.data())); push(); }, e => emit('cloud:error', e)));
      // (1) last 60 days, max 100 live ads  (2) my own ads (so expired ones can be renewed)
      watch(query(col, where('ts', '>', Date.now() - 60 * DAY), orderBy('ts', 'desc'), limit(100)), pub);
      watch(query(col, where('owner', '==', u), limit(60)), mine);
    }

    const API = {
      get uid() { return uid; },
      me,
      // photos: array -> likhi | null -> chhuyi na | [] -> mushe feli (jodi age thake)
      // isNew=true hole users/{uid} (rate limit) o ek-i batch e likhi — rules oi batch dekhei post allow kore
      async save(p, photos, hadPhotos, isNew) {
        const { phone, wa, photos: _drop, ...rest } = p, id = String(p.id);
        const b = writeBatch(db);
        b.set(doc(db, 'listings', id), clean({ ...rest, hasWa: !!wa, owner: uid }));
        b.set(doc(db, 'contacts', id), { owner: uid, phone, wa: wa || '' });
        if (photos && photos.length) b.set(doc(db, 'photos', id), { owner: uid, list: photos });
        else if (photos && hadPhotos) b.delete(doc(db, 'photos', id));
        if (isNew) {
          const ur = doc(db, 'users', uid);
          let d = null; try { const s = await getDoc(ur); d = s.exists() ? s.data() : null; } catch (_) {}
          let reset = true;
          if (d && d.last && d.win) {
            if (Date.now() - d.last.toMillis() < 61e3) throw new Error('rate:cooldown');
            reset = Date.now() - d.win.toMillis() > DAY + 60e3;
            if (!reset && d.n >= DAILY) throw new Error('rate:daily');
          }
          b.set(ur, reset ? { last: serverTimestamp(), win: serverTimestamp(), n: 1 } : { last: serverTimestamp(), win: d.win, n: d.n + 1 });
        }
        await b.commit();
        contacts.set(id, { phone, wa: wa || '' });
      },
      patch: (id, f) => updateDoc(doc(db, 'listings', String(id)), clean(f)),
      async remove(id, hadPhotos) {
        const b = writeBatch(db);
        b.delete(doc(db, 'listings', String(id))); b.delete(doc(db, 'contacts', String(id)));
        if (hadPhotos) b.delete(doc(db, 'photos', String(id)));
        await b.commit(); contacts.delete(String(id));
      },
      getPhotos: id => getDoc(doc(db, 'photos', String(id))).then(s => (s.exists() ? s.data().list || [] : [])),
      // "নম্বর দেখুন" — listing doc e phone nei, alada contacts/{id} theke ashe
      async contact(id) {
        const k = String(id);
        if (contacts.has(k)) return contacts.get(k);
        const s = await getDoc(doc(db, 'contacts', k));
        const v = s.exists() ? { phone: s.data().phone, wa: s.data().wa || '' } : null;
        if (v) contacts.set(k, v);
        return v;
      },
      report: (id, reason) => setDoc(doc(db, 'reports', id + '_' + uid), { lid: Number(id), uid, reason, ts: serverTimestamp() }),

      // Google ke ekhon-kar anonymous account e jure dey (uid ek-i thake, post gulo thik thake).
      // Oi Google e age-i account thakle oi account e dhuke jay ('switched').
      async google() {
        const pr = new GoogleAuthProvider(), u = auth.currentUser;
        if (u && !u.isAnonymous) return 'already';
        try { await linkWithPopup(u, pr); return 'linked'; }
        catch (e) {
          const c = e.code === 'auth/credential-already-in-use' && GoogleAuthProvider.credentialFromError(e);
          if (c) { await signInWithCredential(auth, c); return 'switched'; }
          throw e;
        }
      },
      // Facebook/in-app browser e Google block hole: ইমেইল লিংক (password lage na)
      async emailLink(email) {
        await sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname, handleCodeInApp: true });
        try { localStorage.setItem('kbv_email', email); } catch (_) {}
      },
      signOut: () => signOut(auth)
    };

    async function handleEmailLink() {
      if (!isSignInWithEmailLink(auth, location.href)) return;
      let email = ''; try { email = localStorage.getItem('kbv_email') || ''; } catch (_) {}
      if (!email) email = prompt('যে ইমেইলে লিংক পেয়েছেন সেটি লিখুন:') || '';
      if (!email) return;
      const url = location.href;
      history.replaceState(null, '', location.pathname);
      try {
        const u = auth.currentUser;
        let r = 'switched';
        try {
          if (u && u.isAnonymous) { await linkWithCredential(u, EmailAuthProvider.credentialWithLink(email, url)); r = 'linked'; }
          else await signInWithEmailLink(auth, email, url);
        } catch (e) {
          if (e.code === 'auth/email-already-in-use' || e.code === 'auth/credential-already-in-use') await signInWithEmailLink(auth, email, url);
          else throw e;
        }
        emit('cloud:login', r);
      } catch (e) { emit('cloud:autherror', e); }
    }

    onAuthStateChanged(auth, async user => {
      if (!user) { signInAnonymously(auth).catch(e => emit('cloud:error', e)); return; }
      const first = !ready; ready = true; window.CLOUD = API;
      if (user.uid !== uid) {
        uid = user.uid; admin = false; listen(uid);
        try { admin = (await getDoc(doc(db, 'admins', uid))).exists(); } catch (_) {}
        banned = false; try { banned = (await getDoc(doc(db, 'bans', uid))).exists(); } catch (_) {}
      }
      emit('cloud:auth', me());
      if (first) handleEmailLink();
    });
  } catch (e) { emit('cloud:error', e); }
}
