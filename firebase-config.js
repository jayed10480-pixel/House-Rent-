// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCvDUlaEaTNUXtbHI9ay5llhF7l2kC_N1g",
  authDomain: "khulna-bari-vara.firebaseapp.com",
  projectId: "khulna-bari-vara",
  storageBucket: "khulna-bari-vara.firebasestorage.app",
  messagingSenderId: "720914300680",
  appId: "1:720914300680:web:d50ab3c5e2ffd2ded536bd",
  measurementId: "G-W11FGZN0YY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);