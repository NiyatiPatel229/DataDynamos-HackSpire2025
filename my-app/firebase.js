import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Replace with your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDI69-IxUBqZOQT_xOY0mX6KUGtWWfg7Wk",
  authDomain: "mindmosaic-d70dd.firebaseapp.com",
  projectId: "mindmosaic-d70dd",
  databaseURL: "https://mindmosaic-d70dd-default-rtdb.firebaseio.com",
  storageBucket: "mindmosaic-d70dd.firebasestorage.app",
  messagingSenderId: "409754195878",
  appId: "1:409754195878:web:f32344379e76d846cf6167",
  measurementId: "G-KR9TJSX9G5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const db = getDatabase(app);  // Initialize Realtime Database

export { auth, firestore, db };