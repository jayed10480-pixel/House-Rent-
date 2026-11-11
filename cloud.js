// Firebase (Firestore + Anonymous Auth) layer. SDK pinned to 11.0.2, loaded as ES modules from gstatic.
// Firebase SDK is loaded lazily, only when firebase-config.js is filled in (local mode downloads nothing).
const cfg = window.FB_CONFIG;
const emit = (n, d) => document.dispatchEvent(new CustomEvent(n, { detail: d }));
const DAY = 864e5;

if (cfg && cfg.apiKey) {
  try {
    const V = 'https://www.gstatic.com/firebasejs/11.0.2/';
    const [{ initializeApp }, { getAuth, signInAnonymously, onAuthStateChanged }, { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot }] =
      await Promise.all([import(V + 'firebase-app.js'), import(V + 'firebase-auth.js'), import(V + 'firebase-firestore.js')]);
    const app = initializeApp(cfg);
    const auth = getAuth(app);
    // Offline cache + multi-tab: repeat visits read only what changed (saves free-tier reads, loads instantly).
    const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
    const col = collection(db, 'listings');
    let started = false;

    onAuthStateChanged(auth, user => {
      if (!user) { signInAnonymously(auth).catch(e => emit('cloud:error', e)); return; }
      if (started) return; started = true;
      const uid = user.uid;
      const clean = o => JSON.parse(JSON.stringify(o)); // Firestore rejects undefined values
      window.CLOUD = {
        uid,
        save: p => setDoc(doc(db, 'listings', String(p.id)), { ...clean(p), owner: uid }),
        patch: (id, f) => updateDoc(doc(db, 'listings', String(id)), clean(f)),
        remove: id => deleteDoc(doc(db, 'listings', String(id)))
      };
      // Two small listeners: (1) all live ads (last 60 days, max 150)  (2) my own ads (so expired ones can be renewed)
      const pub = new Map(), mine = new Map();
      let t = 0;
      const push = () => { clearTimeout(t); t = setTimeout(() => {
        const all = new Map([...pub, ...mine]);
        emit('cloud:data', [...all.values()].sort((a, b) => (b.ts || 0) - (a.ts || 0)));
      }, 30); };
      const watch = (q, m) => onSnapshot(q, s => { s.docChanges().forEach(c => c.type === 'removed' ? m.delete(c.doc.id) : m.set(c.doc.id, c.doc.data())); push(); }, e => emit('cloud:error', e));
      watch(query(col, where('ts', '>', Date.now() - 60 * DAY), orderBy('ts', 'desc'), limit(150)), pub);
      watch(query(col, where('owner', '==', uid)), mine);
    });
  } catch (e) { emit('cloud:error', e); }
}
