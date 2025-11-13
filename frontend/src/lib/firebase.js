// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCK91lbLuDKkKBzNbLaUY3CC303z7L2My4",
  authDomain: "encuestas-pro-web.firebaseapp.com",
  projectId: "encuestas-pro-web",
  storageBucket: "encuestas-pro-web.firebasestorage.app",
  messagingSenderId: "933654647707",
  appId: "1:933654647707:web:472a00a98dd38bd707473e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);