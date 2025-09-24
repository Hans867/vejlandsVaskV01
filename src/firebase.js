// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAaem-V_tu326yhMhjedWaTtwjuaLptnxg",
    authDomain: "vejlandvask-v01.firebaseapp.com",
    projectId: "vejlandvask-v01",
    storageBucket: "vejlandvask-v01.firebasestorage.app",
    messagingSenderId: "298219776137",
    appId: "1:298219776137:web:30bd1a2818dd1c677a7e58",
    measurementId: "G-MD22JJXZD5"
  }; 

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;