const V='kbv-v5',SHELL=['./','index.html','about.html','contact.html','privacy.html','terms.html','tailwind.css','manifest.webmanifest','icon-192.png','firebase-config.js','cloud.js'];
// install: cache the shell, one file failing must not break the install
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
// Cache korbo na: Firebase API/App Check, Cloudinary (browser cache-i jothesto), ads/analytics, admin+test page
const SKIP=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck)\.googleapis\.com$|(^|\.)cloudinary\.com$|googlesyndication|doubleclick|googletagmanager|google-analytics|googleadservices/;
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||SKIP.test(u.hostname)||/recaptcha/.test(u.pathname)||(u.origin===location.origin&&/\/(admin|check)\.(html|js)$/.test(u.pathname)))return;
  // pages + the two config/backend scripts: network first (always fresh), cache only as the offline fallback
  const netFirst=r.mode==='navigate'||(u.origin===location.origin&&/\/(firebase-config|cloud)\.js$|\/tailwind\.css$/.test(u.pathname));
  if(netFirst){
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res})
      .catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))));
    return;
  }
  // everything else (fonts, Tailwind, Firebase SDK, icons): cache first, refreshed in the background
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>m);
    return m||net;
  }));
});
