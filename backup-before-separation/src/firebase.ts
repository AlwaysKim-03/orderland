// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration from .env file
console.log('Firebase Config Debug:');
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('Storage Bucket:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "demo-measurement-id"
};

console.log('Final Firebase Config:', firebaseConfig);

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized');
} else {
  app = getApps()[0];
  console.log('Using existing Firebase app');
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// 소셜 로그인 Provider 설정
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export const db = getFirestore(app);
export const storage = getStorage(app);

console.log('Firebase services initialized:', {
  auth: !!auth,
  db: !!db,
  storage: !!storage
});

export default app; 