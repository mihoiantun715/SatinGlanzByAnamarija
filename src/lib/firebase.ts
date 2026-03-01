import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAjqX5WS-BZlEFUMkgw5tRHzHaMN7_2_Fo",
  authDomain: "anamarijasatinroses.firebaseapp.com",
  projectId: "anamarijasatinroses",
  storageBucket: "anamarijasatinroses.firebasestorage.app",
  messagingSenderId: "340467386673",
  appId: "1:340467386673:web:50bd90b37968c40b0f4810",
  measurementId: "G-BBE6V4VSXF"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Only initialize analytics on the client side
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };
