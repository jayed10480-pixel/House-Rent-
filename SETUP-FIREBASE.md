# Firebase setup (ekbar korlei hobe, free Spark plan)

1. console.firebase.google.com → Add project (Analytics off rakhte paro).
2. Build → Firestore Database → Create database → location: asia-south1 (Mumbai) → Production mode.
3. Build → Authentication → Get started → Sign-in method → **Anonymous** → Enable.
4. Project settings (⚙) → Your apps → Web (</>) → app register → `firebaseConfig` er value gulo `firebase-config.js` e boshao.
5. Firestore → Rules tab → `firestore.rules` file er shob kichu paste kore **Publish**.
6. Authentication → Settings → Authorized domains → tomar live domain add koro (jemon xxxx.netlify.app).
7. Sob file Netlify/Cloudflare/GitHub Pages e upload koro. Done.

Ownership: prottek browser ke anonymous uid dey; shudhu je post koreche se-i edit/delete/renew korte pare (rules e enforce kora).
Browser data clear korle nijer purono post edit korar ekhtiyar harabe.
