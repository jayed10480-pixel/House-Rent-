# Firebase setup (ekbar korlei hobe, free Spark plan)

1. console.firebase.google.com → Add project (Analytics off rakhte paro).
2. Build → Firestore Database → Create database → location: asia-south1 (Mumbai) → Production mode.
3. Build → Authentication → Get started → Sign-in method → **Anonymous** → Enable.
   Sathe **Google** → Enable (support email dao) ebong **Email/Password** → Enable → tar niche **Email link (passwordless sign-in)** → Enable. (Login/account bachanor jonno)
4. Project settings (⚙) → Your apps → Web (</>) → app register → `firebaseConfig` er value gulo `firebase-config.js` e boshao.
5. Firestore → Rules tab → `firestore.rules` file er shob kichu paste kore **Publish**.
   (Publish er por Rules Playground e ekta test koro; error dile amake dekhao.)
6. Authentication → Settings → Authorized domains → tomar live domain add koro (jemon xxxx.netlify.app).
7. Sob file Netlify/Cloudflare/GitHub Pages e upload koro. Live hole `tomar-site/check.html` khule **▶ টেস্ট চালান** chapo — shob ✅ hole Firebase thik ache.

## Optional — kintu kore nao (sob free, card lage na)

### 8) Spam bot rodh (App Check)
1. console.cloud.google.com/security/recaptcha → **reCAPTCHA v3** key banao (domain: tomar live domain + `localhost`) → **site key** copy koro.
2. `firebase-config.js` er `recaptchaSiteKey` e boshao.
3. Firebase Console → Build → **App Check** → Apps → Web app → reCAPTCHA v3 → secret key dao → Register.
4. Kichu din traffic dekhe App Check → **Cloud Firestore** er pashe **Enforce** chapo. (Enforce na korle protection kaj kore na.)

### 9) Chobi upload (Cloudinary free)
1. cloudinary.com e free account kholo → Dashboard theke **Cloud name** copy koro.
2. Settings → Upload → **Upload presets** → Add → **Signing mode: Unsigned** → (Folder: `kbv`, Allowed formats: jpg,png,webp, Max file size 2MB) → Save → preset-er naam copy koro.
3. `firebase-config.js` e `cloudinaryCloud` ar `cloudinaryPreset` boshao.

### 10) Admin banano
1. Admin hobe je Google account, seta diye ekbar `tomar-site/admin.html` e login koro → "admin noy" page e tomar **UID** dekhabe, copy koro.
2. Firebase Console → Firestore → **Start collection** → ID: `admins` → Document ID = oi UID → ekta field dao (jemon `ok` = `true`) → Save.
3. Abar `admin.html` reload koro — report, hide/delete, statistics dekhte parbe. Site er menu (👤) te-o "🛠 অ্যাডমিন প্যানেল" link ashbe.
4. Admin panel e tomar nijer kono kaj-i console e jete hobe na: bigyapon edit/hide/feature/delete, user ban, announcement bar, post bondho/maintenance, hero text, AdSense/Analytics ID, extra area, aro admin jora — sob `admin.html` theke. Details: README.md er "অ্যাডমিন প্যানেল" section.
5. **Notun `firestore.rules` abar Publish korte hobe** (ban/settings/admin-edit er rules ekhane).



## Live korar age placeholder gulo bodlao
| Kothay | Ki bodlabe |
|---|---|
| `firebase-config.js` | Firebase er 6ta value |
| shob `*.html`, `sitemap.xml`, `robots.txt` | `yourdomain.com` → tomar asol domain |
| `index.html` (CFG line), `contact.html`, `privacy.html` | `contact@yourdomain.com` → tomar email |
| `ads.txt` ebong `index.html` CFG | AdSense publisher ID (na thakle ads off thakbe) |

## Database structure
- `listings/{id}` — bigyapon + choto `thumb` preview + `pc` (chobi sankhya). **Phone nei.**
- `photos/{id}` — full chobi (Cloudinary link ba base64) — shudhu gallery khulle 1 ta read
- `contacts/{id}` — phone/WhatsApp — shudhu "নম্বর দেখুন" chaple 1 ta read (list kora jay na)
- `users/{uid}` — rate limit (1 minute e 1 post, 24 ghontay max 10)
- `reports/{id_uid}` — report; `admins/{uid}` — admin list

Ownership: prottek browser ke anonymous uid dey; shudhu je post koreche se-i edit/delete/renew korte pare (rules e enforce kora).
Google/email login connect korle oi uid account e jure jay — browser data clear korleo ba phone bodlalleo post ferot pabe.
