import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// SUSTITUYE ESTOS VALORES POR LOS QUE TE DA FIREBASE
const firebaseConfig = {
  apiKey: "PEGAR_AQUI_API_KEY",
  authDomain: "PEGAR_AQUI_AUTH_DOMAIN",
  projectId: "PEGAR_AQUI_PROJECT_ID",
  storageBucket: "PEGAR_AQUI_STORAGE_BUCKET",
  messagingSenderId: "PEGAR_AQUI_MESSAGING_SENDER_ID",
  appId: "PEGAR_AQUI_APP_ID"
};

// Inicializar y exportar
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
