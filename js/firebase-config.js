import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, query, orderBy, limit, 
  serverTimestamp, doc, updateDoc, setDoc, deleteDoc, getDoc, writeBatch, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDgkJZA6BpTYLoCfVFdcvHbLzp6D_0bU4",
  authDomain: "bhavya-agro-d3407.firebaseapp.com",
  projectId: "bhavya-agro-d3407",
  storageBucket: "bhavya-agro-d3407.firebasestorage.app",
  messagingSenderId: "701815969630",
  appId: "1:701815969630:web:d38ef87a8204b72f2f61cf",
  measurementId: "G-GMV0NN4VKR"
};

// Initialize Firebase (guard against duplicate init across modules)
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  // App already initialized — get existing instance
  const { getApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
  app = getApp();
}

const db   = getFirestore(app); // Uses the (default) database in the new project
const auth = getAuth(app);
const storage = getStorage(app);

// Export for use in other scripts
export { db, auth, storage, ref, uploadBytesResumable, getDownloadURL, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, signInWithEmailAndPassword, onAuthStateChanged, signOut, doc, updateDoc, setDoc, deleteDoc, getDoc, writeBatch, onSnapshot };
