"use client";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const config = {
  apiKey: "AIzaSyC2OOkQfvQlGcRyENE_ULuZtwXMF8xfqhk",
  authDomain: "college-corchet.firebaseapp.com",
  projectId: "college-corchet",
  storageBucket: "college-corchet.firebasestorage.app",
  messagingSenderId: "700888537578",
  appId: "1:700888537578:web:8863954e32af23151e7a93",
  measurementId: "G-X1ZBHKXCTB",
};
export const firebaseApp = () => getApps()[0] || initializeApp(config);
export const firebaseAuth = () => getAuth(firebaseApp());
export const clientFirestore = () => getFirestore(firebaseApp());
