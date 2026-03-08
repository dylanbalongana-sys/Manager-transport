import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

/**
 * ✅ Persistance locale (cache offline)
 * - si internet coupe: l'app reste utilisable
 * - dès que ça revient: Firebase se resynchronise
 *
 * ⚠️ Si tu ouvres l’app dans plusieurs onglets/appareils “web” en même temps,
 * Firebase peut refuser la persistance (c’est normal). On ignore juste.
 */
enableIndexedDbPersistence(db).catch(() => {
  // on ignore volontairement (cas multi-onglets / navigateur)
});

export default app;