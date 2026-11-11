/* ===== 1) Firebase =====
   Firebase Console → Project settings → Your apps → Web app → "firebaseConfig" er value gulo ekhane boshao.
   Faka thakle site localStorage mode e cholbe (shudhu nijer browser e dekha jabe). */
window.FB_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

/* ===== 2) Optional extra (sob free, card lage na) ===== */
window.APP_CFG = {
  /* Spam/bot rodh: Firebase App Check → reCAPTCHA v3 "site key" (SETUP-FIREBASE.md step 8). Faka = off */
  recaptchaSiteKey: "",
  /* Chobi upload: Cloudinary free account → cloud name + UNSIGNED upload preset (SETUP-FIREBASE.md step 9).
     Faka thakle chobi chhoto kore Firestore e base64 hishebe save hobe (agerr moto, ~1MB limit). */
  cloudinaryCloud: "",
  cloudinaryPreset: ""
};
