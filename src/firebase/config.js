import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCjoNSOzBUSYsNpsrcYnr1kSMyFLjhKt6g",
  authDomain: "traidboard.firebaseapp.com",
  projectId: "traidboard",
  storageBucket: "traidboard.firebasestorage.com",
  messagingSenderId: "592277067712",
  appId: "1:592277067712:web:e57e1e99e5a075e6ea5a25",
  measurementId: "G-SRQYXC19X8"
};


// Initialize Firebase
let app;
let auth;
let db;
let analytics;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // Analytics might not work in all environments (like SSR)
    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
    }
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

export { auth, db, analytics };
