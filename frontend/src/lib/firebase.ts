import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAs-vJ4dW9IRqR7Rk25lncvlu6ugY4AcnU',
  authDomain: 'quantifyos.firebaseapp.com',
  projectId: 'quantifyos',
  storageBucket: 'quantifyos.firebasestorage.app',
  messagingSenderId: '659476571392',
  appId: '1:659476571392:web:68e84c88cd2f7fcbed7fe5',
  measurementId: 'G-Q99G00CDVX',
  databaseURL: 'https://quantifyos-default-rtdb.asia-southeast1.firebasedatabase.app'
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
