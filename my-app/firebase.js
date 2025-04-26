import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDI69-IxUBqZOQT_xOY0mX6KUGtWWfg7Wk",
  authDomain: "mindmosaic-d70dd.firebaseapp.com",
  projectId: "mindmosaic-d70dd",
  storageBucket: "mindmosaic-d70dd.firebasestorage.app",
  messagingSenderId: "409754195878",
  appId: "1:409754195878:web:f32344379e76d846cf6167"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };