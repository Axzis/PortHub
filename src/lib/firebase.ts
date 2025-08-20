
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDVDF9FHmpJKkVnLqNt0m3cTrFfOm0ueEc",
  authDomain: "portfoliohub-tgcie.firebaseapp.com",
  projectId: "portfoliohub-tgcie",
  storageBucket: "portfoliohub-tgcie.firebasestorage.app",
  messagingSenderId: "846472260284",
  appId: "1:846472260284:web:439362a85bfc440764feb9",
  measurementId: ""
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
