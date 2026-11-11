# খুলনা বাড়ি ভাড়া — Khulna Bari Vara

খুলনা (ও আশপাশের জেলা) এর জন্য ফ্রি বাসা-ভাড়া বিজ্ঞাপন সাইট। Static site (HTML + JS), Firebase দিয়ে shared backend।

## ফাইল তালিকা
| ফাইল | কাজ |
|---|---|
| `index.html` | মূল সাইট (UI, search, post form, সব JS) |
| `about.html`, `contact.html`, `privacy.html`, `terms.html` | তথ্য পেজ (terms এ দায়মুক্তি ঘোষণা আছে) |
| `404.html`, `_headers` | ভুল লিংক পেজ; cache ও security header (Netlify/Cloudflare) |
| `firebase-config.js` | **তোমার Firebase key এখানে বসাবে** |
| `cloud.js` | Firebase (Firestore + Auth + App Check) সংযোগ |
| `admin.html`, `admin.js` | **অ্যাডমিন প্যানেল** — রিপোর্ট দেখা, বিজ্ঞাপন লুকানো/মোছা, পরিসংখ্যান, পুরনো বিজ্ঞাপন পরিষ্কার |
| `check.html` | **এক-ক্লিক সেটআপ টেস্ট** — Firebase ঠিক চলছে কিনা যাচাই (live করার পর একবার চালাও) |
| `tailwind.css`, `tools/`, `package.json` | লোকাল Tailwind CSS (CDN আর লাগে না) ও তার build script |
| `firestore.rules` | database security rules (Firebase Console এ paste করবে) |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | PWA / offline / install |
| `sitemap.xml`, `robots.txt`, `ads.txt` | SEO ও AdSense |
| `SETUP-FIREBASE.md` | Firebase setup এর ধাপ |

## ফিচার
- বাসা ভাড়া / বাসা খুঁজছি — দুই ট্যাব; এলাকা, বেডরুম, ভাড়া, ধরন দিয়ে ফিল্টার ও সর্ট; নিকটতম আগে (GPS)
- এক পোস্টে একাধিক লোকেশন (সর্বোচ্চ ৮), প্রতিটির আলাদা ম্যাপ লিংক
- বিস্তারিত তথ্য: তলা, বাথরুম, বারান্দা, আয়তন, ফার্নিশিং, কাদের জন্য, অগ্রিম, বিল + ১৪টি সুবিধা + নিজের লেখা অতিরিক্ত সুবিধা
- ছবি: সর্বোচ্চ ৬টি (auto compress); তালিকায় ছোট থাম্বনেইল, ক্লিক করলে পুরো ছবির গ্যালারি (পরের/আগের, swipe)
- "বিস্তারিত" চাহিদা বক্স: নিজের ভাষায় লিখলে মিল (%) অনুযায়ী সাজিয়ে দেখায়
- Khulna জেলার ৯ উপজেলা + ইউনিয়ন + শহরের এলাকা, এবং খুলনা বিভাগের অন্য জেলার উপজেলা — মোট ২২৫টি এলাকার সাজেশন (বানান বিকল্প ও ইংরেজি নামেও খোঁজা যায়, যেমন সোনাডাঙ্গা / kuet)
- দায়মুক্তি ঘোষণা (banner + প্রথমবার popup + form declaration + terms)
- পড়ার আরামের জন্য Noto Sans Bengali ফন্ট, বড় লেখা, হেডারে A/A+/A++ বাটন
- ফোন নম্বর লুকানো — “নম্বর দেখুন” চাপলে তবেই দেখা যায়; ✅ রিপোর্ট বাটন; ✅ Google/ইমেইল লগইন দিয়ে পোস্টের মালিকানা সুরক্ষা
- বাংলা/English, dark mode, বদলানো background (🎨), মোবাইল bottom nav, PWA install, offline cache

## Backend (Firebase) কীভাবে কাজ করে
- Firestore: `listings` (পোস্ট + ছোট thumb, **ফোন নেই**), `photos` (পুরো ছবি, শুধু গ্যালারি খুললে পড়া হয়), `contacts` (ফোন/WhatsApp — শুধু “নম্বর দেখুন” চাপলে ১টি করে পড়া যায়, সব একসাথে list করা যায় না), `users` (rate-limit কাউন্টার), `reports`, `admins`
- Login: শুরুতে Anonymous Auth (প্রতিটি ব্রাউজার একটি গোপন `uid` পায়); **Google বা ইমেইল-লিংক দিয়ে লগইন করলে সেই `uid`-ই অ্যাকাউন্টে জুড়ে যায়** — তাই ব্রাউজার ডেটা মুছলেও/ফোন বদলালেও পোস্ট ফেরত পাওয়া যায়
- Spam রোধ (rules এ enforce): প্রতি ইউজার ১ মিনিটে ১টি, ২৪ ঘণ্টায় সর্বোচ্চ ১০টি নতুন পোস্ট; ঐচ্ছিক Firebase App Check (reCAPTCHA v3) বট ঠেকায়
- ছবি: Cloudinary (ফ্রি, কার্ড লাগে না) এ আপলোড হয় — সাইটে WebP/auto-size হয়ে আসে; Cloudinary সেট না করলে আগের মতো ছোট base64 Firestore এ যায়
- Security rules: সবাই পড়তে পারে; শুধু owner নিজের পোস্ট edit/delete/renew করতে পারে; শুধু অ্যাডমিন (`admins/{uid}`) যেকোনো পোস্ট লুকাতে/মুছতে পারে
- Optimise: শেষ ৬০ দিনের সর্বোচ্চ ১০০টি পোস্ট + নিজের পোস্ট; offline cache থাকায় বারবার খুললে শুধু পরিবর্তন পড়ে (free quota বাঁচে)
- `firebase-config.js` ফাঁকা থাকলে সাইট localStorage mode এ চলে (শুধু নিজের ব্রাউজারে দেখা যায়)

## Setup ও publish
1. `SETUP-FIREBASE.md` এর ধাপগুলো করো (১–৭ জরুরি; ৮ spam-বট রোধ, ৯ ছবি আপলোড, ১০ অ্যাডমিন — এগুলো ঐচ্ছিক কিন্তু করা ভালো)।
2. সব ফাইল Netlify (app.netlify.com/drop) / Cloudflare Pages / GitHub Pages এ upload করো।
3. `sitemap.xml`, `robots.txt`, পেজগুলোর canonical link এ তোমার আসল domain বসাও; AdSense ব্যবহার করলে নিজের publisher ID দাও।
4. Live করার পর `তোমার-সাইট/check.html` খুলে **▶ টেস্ট চালান** চাপো — সব ✅ হলে Firebase ঠিক আছে। তারপর মোবাইলে হাতে test: পোস্ট, edit/delete, ছবি, নম্বর দেখুন, ভাষা পরিবর্তন।
5. কোড/HTML এ নতুন Tailwind class লিখলে `npm install` (একবার) তারপর `npm run build:css` চালাও — `tailwind.css` নতুন করে তৈরি হবে।

## বাকি সীমাবদ্ধতা (সৎভাবে)
- আগের Anonymous-সেশনের পোস্ট: লগইন করার **আগে** করা পোস্ট ঠিক থাকে (যদি ওই ব্রাউজারেই লগইন সংযুক্ত করো)। কিন্তু যদি এমন Google অ্যাকাউন্টে ঢোকো যেটায় আগে থেকেই পোস্ট আছে, তখন ওই অ্যাকাউন্টে যাওয়া হয় — এই ব্রাউজারের আগের লগইনবিহীন পোস্টগুলো আর এডিট করা যায় না। তাই প্রথম পোস্টের পরই লগইন সংযুক্ত করতে অ্যাপ নিজেই মনে করিয়ে দেয়।
- ফোন নম্বর: এখন লুকানো ও list-করা-যায়-না, কিন্তু যে কেউ (বটসহ) আইডি জেনে একটি একটি করে নম্বর পড়ার চেষ্টা করতে পারে। বট ঠেকাতে ধাপ ৮ (App Check) চালু করে Console এ **Enforce** করো। আরও কড়া করতে `firestore.rules` এর `contacts` এ কমেন্ট করা লাইনটি ব্যবহার করো (শুধু লগইন-করা ইউজার নম্বর দেখবে)।
- Cloudinary তে আপলোড হওয়া ছবি পোস্ট মুছলে নিজে থেকে মুছে যায় না (unsigned upload এ delete করা যায় না) — ফ্রি plan এ সাধারণত সমস্যা নয়; দরকারে Cloudinary dashboard থেকে পরিষ্কার করো।
- Tailwind এখন লোকাল CSS (Chrome 80+/Safari 13+ এর মতো ২০২০-এর পরের ব্রাউজারে ঠিক চলে)। ঢালাও পুরনো/ফিচার-ফোনের ব্রাউজারে ডিজাইন কিছুটা ভিন্ন দেখাতে পারে।
- সাইটটি আসল Firebase প্রজেক্টে আমি চালাতে পারিনি (আমার কাছে তোমার key/ইন্টারনেট নেই)। UI ও লজিক নকল (mock) Firebase দিয়ে টেস্ট করা হয়েছে; আসল rules/সংযোগ যাচাই করতে `check.html` বানানো হয়েছে — সেটি একবার চালিয়ে ❌ থাকলে স্ক্রিনশট পাঠাও।

## যোগাযোগ
WhatsApp: +966 56 654 6679
