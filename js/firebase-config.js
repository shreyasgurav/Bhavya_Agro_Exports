import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, query, orderBy, limit, 
  serverTimestamp, doc, updateDoc, setDoc, deleteDoc, getDoc, writeBatch,
  enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBu4MvRWhQuPaR9BmP0B-FCb6DISQ7P1YY",
  authDomain: "vyankyaa-foods.firebaseapp.com",
  projectId: "vyankyaa-foods",
  storageBucket: "vyankyaa-foods.firebasestorage.app",
  messagingSenderId: "468738165745",
  appId: "1:468738165745:web:8de582791b376ab0071250",
  measurementId: "G-45SB1V576F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);

// Enable Offline Persistence for faster subsequent loads
try {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence not supported by browser');
    }
  });
} catch (e) {
  console.error('Error enabling Firestore persistence:', e);
}

// Export for use in other scripts
export { db, auth, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, signInWithEmailAndPassword, onAuthStateChanged, signOut, doc, updateDoc, setDoc, deleteDoc, getDoc, writeBatch };
