# খুলনা বাড়ি ভাড়া — Khulna Bari Vara

খুলনা (ও আশপাশের জেলা) এর জন্য ফ্রি বাসা-ভাড়া বিজ্ঞাপন সাইট। Static site (HTML + JS), Firebase দিয়ে shared backend।

## ফাইল তালিকা
| ফাইল | কাজ |
|---|---|
| `index.html` | মূল সাইট (UI, search, post form, সব JS) |
| `about.html`, `contact.html`, `privacy.html`, `terms.html` | তথ্য পেজ (terms এ দায়মুক্তি ঘোষণা আছে) |
| `firebase-config.js` | **তোমার Firebase key এখানে বসাবে** |
| `cloud.js` | Firebase (Firestore + Anonymous Auth) সংযোগ |
| `firestore.rules` | database security rules (Firebase Console এ paste করবে) |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | PWA / offline / install |
| `sitemap.xml`, `robots.txt`, `ads.txt` | SEO ও AdSense |
| `SETUP-FIREBASE.md` | Firebase setup এর ধাপ |

## ফিচার
- বাসা ভাড়া / বাসা খুঁজছি — দুই ট্যাব; এলাকা, বেডরুম, ভাড়া, ধরন দিয়ে ফিল্টার ও সর্ট; নিকটতম আগে (GPS)
- এক পোস্টে একাধিক লোকেশন (সর্বোচ্চ ৫), প্রতিটির আলাদা ম্যাপ লিংক
- বিস্তারিত তথ্য: তলা, বাথরুম, বারান্দা, আয়তন, ফার্নিশিং, কাদের জন্য, অগ্রিম, বিল + ১৪টি সুবিধা + নিজের লেখা অতিরিক্ত সুবিধা
- ছবি: সর্বোচ্চ ৬টি (auto compress), ক্লিক করলে বড় করে দেখা যায়
- "বিস্তারিত" চাহিদা বক্স: নিজের ভাষায় লিখলে মিল (%) অনুযায়ী সাজিয়ে দেখায়
- Khulna জেলার ৯ উপজেলা + ইউনিয়ন + শহরের এলাকা, এবং খুলনা বিভাগের অন্য জেলার উপজেলা — মোট ১৮১টি এলাকার সাজেশন
- দায়মুক্তি ঘোষণা (banner + প্রথমবার popup + form declaration + terms)
- বাংলা/English, dark mode, বদলানো background (🎨), মোবাইল bottom nav, PWA install, offline cache

## Backend (Firebase) কীভাবে কাজ করে
- Firestore collection: `listings` (একটি পোস্ট = একটি document, id = পোস্টের id)
- Login: Anonymous Auth — প্রতিটি ব্রাউজার একটি গোপন `uid` পায়, পোস্টে `owner` হিসেবে সেভ হয়
- Security rules: সবাই পড়তে পারে; শুধু owner নিজের পোস্ট edit/delete/renew করতে পারে; ফোন, ভাড়া, ছবি সাইজ, লোকেশন সংখ্যা ইত্যাদি validate হয়
- Optimise: শেষ ৬০ দিনের সর্বোচ্চ ১৫০টি পোস্ট + নিজের পোস্ট; offline cache থাকায় বারবার খুললে শুধু পরিবর্তন পড়ে (free quota বাঁচে)
- `firebase-config.js` ফাঁকা থাকলে সাইট localStorage mode এ চলে (শুধু নিজের ব্রাউজারে দেখা যায়)

## Setup ও publish
1. `SETUP-FIREBASE.md` এর ৭টি ধাপ করো।
2. সব ফাইল Netlify (app.netlify.com/drop) / Cloudflare Pages / GitHub Pages এ upload করো।
3. `sitemap.xml`, `robots.txt`, পেজগুলোর canonical link এ তোমার আসল domain বসাও; AdSense ব্যবহার করলে নিজের publisher ID দাও।
4. Live করার পর test: পোস্ট করা, edit/delete, ভাড়া হয়ে গেছে, search, ছবি, ভাষা পরিবর্তন — মোবাইলে।

## সীমাবদ্ধতা
- Anonymous login: ব্রাউজার ডেটা মুছলে নিজের পুরনো পোস্ট edit করার অধিকার চলে যায়।
- Spam রোধে per-user rate limit নেই — দরকার হলে Firebase App Check চালু করো।
- ছবি Firestore এ base64 হিসেবে থাকে (প্রতি পোস্ট ~১MB limit), তাই ছবি ছোট করে সেভ হয়। Firebase Storage এখন Blaze (কার্ড) plan চায়।
- ফোন নম্বর সবার কাছে দৃশ্যমান।
- কোনো admin panel নেই; খারাপ পোস্ট মুছতে Firebase Console → Firestore ব্যবহার করো।
- Tailwind CDN (runtime) ব্যবহার হচ্ছে; আরও স্পিড চাইলে Tailwind CLI দিয়ে CSS build করে নাও।
- এই লেখার সময় সাইটটি আসল Firebase প্রজেক্টে পরীক্ষা করা হয়নি।

## যোগাযোগ
WhatsApp: +966 56 654 6679
