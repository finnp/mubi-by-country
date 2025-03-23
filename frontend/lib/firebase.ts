"use client"

import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsGJQ9A0ivV01ShF4U9KK7mSN4PAh38jU",
  authDomain: "mubi-by-country.firebaseapp.com",
  projectId: "mubi-by-country",
  storageBucket: "mubi-by-country.firebasestorage.app",
  messagingSenderId: "1092450910530",
  appId: "1:1092450910530:web:11d948548a70312f2f88db",
}

// Initialize Firebase
// We need to check if Firebase is already initialized to avoid multiple instances
let app
let db

// Only initialize Firebase if it hasn't been initialized yet and we're in a browser environment
if (typeof window !== "undefined") {
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
  } catch (error) {
    console.error("Firebase initialization error:", error)
  }
}

export { db }

